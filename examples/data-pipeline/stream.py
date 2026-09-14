"""Single immutable bounded source, one SQLite transaction per arrival."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
from pipeline import MAX_ROWS, MAX_GROUPS, aggregate, bounded_lines, canonical, decode_event, publish, quality, sha


def source_events(data):
    # Streaming stage accepts already contract-valid records; no silent bad-line skipping.
    return [decode_event(line) for line in bounded_lines(data)]


def policy(max_seen, max_groups):
    if type(max_seen) is not int or not 1 <= max_seen <= MAX_ROWS:
        raise ValueError("seen limit configuration")
    if type(max_groups) is not int or not 1 <= max_groups <= MAX_GROUPS:
        raise ValueError("group limit configuration")
    return {"version": 1, "width": 60, "lag": 10, "max_seen": max_seen, "max_groups": max_groups}


def initialize(connection, digest, configuration):
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS checkpoint(singleton INTEGER PRIMARY KEY CHECK(singleton=1),
            source TEXT NOT NULL, policy TEXT NOT NULL, position INTEGER NOT NULL,
            maximum INTEGER NOT NULL, watermark INTEGER NOT NULL, duplicates INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS seen(id TEXT PRIMARY KEY, digest TEXT NOT NULL, verdict TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS totals(start INTEGER, route TEXT, count INTEGER NOT NULL, cents INTEGER NOT NULL,
            PRIMARY KEY(start,route));
    """)
    with connection:
        connection.execute("INSERT OR IGNORE INTO checkpoint VALUES(1,?,?,0,-1,-1,0)",
                           (digest, canonical(configuration).decode()))
    checkpoint = connection.execute("SELECT source,policy FROM checkpoint").fetchone()
    if checkpoint != (digest, canonical(configuration).decode()):
        raise ValueError("source or policy changed; use a fresh checkpoint")


def consume(database, data, *, max_seen=100, max_groups=20, fail_at=None, failure=None):
    events = source_events(data)
    configuration = policy(max_seen, max_groups)
    connection = sqlite3.connect(database, isolation_level="DEFERRED")
    try:
        initialize(connection, sha(data), configuration)
        while True:
            connection.execute("BEGIN IMMEDIATE")
            try:
                position, maximum, watermark, duplicates = connection.execute(
                    "SELECT position,maximum,watermark,duplicates FROM checkpoint").fetchone()
                if position == len(events):
                    connection.rollback()
                    break
                event = events[position]
                state = {"watermark": watermark}
                digest = sha(canonical(event))
                prior = connection.execute("SELECT digest,verdict FROM seen WHERE id=?", (event["id"],)).fetchone()
                if prior is not None:
                    if prior[0] != digest:
                        raise ValueError("event identity conflict")
                    duplicates += 1
                else:
                    if connection.execute("SELECT COUNT(*) FROM seen").fetchone()[0] >= max_seen:
                        raise ValueError("dedup state limit")
                    start = event["minute"] // 60 * 60
                    end = start + 60
                    if end <= state["watermark"]:
                        verdict = "late"
                    else:
                        verdict = "accepted"
                        exists = connection.execute("SELECT 1 FROM totals WHERE start=? AND route=?", (start,event["route"])).fetchone()
                        if not exists and connection.execute("SELECT COUNT(*) FROM totals").fetchone()[0] >= max_groups:
                            raise ValueError("group state limit")
                        connection.execute("""INSERT INTO totals VALUES(?,?,1,?)
                            ON CONFLICT(start,route) DO UPDATE SET count=count+1,cents=cents+excluded.cents""",
                            (start,event["route"],event["cents"]))
                    connection.execute("INSERT INTO seen VALUES(?,?,?)", (event["id"],digest,verdict))
                    maximum = max(maximum, event["minute"])
                    watermark = max(watermark, maximum - 10)
                connection.execute("UPDATE checkpoint SET position=?,maximum=?,watermark=?,duplicates=? WHERE singleton=1",
                                   (position+1, maximum, watermark, duplicates))
                if fail_at == position+1 and failure == "error_before_commit":
                    raise RuntimeError("injected before commit")
                if fail_at == position+1 and failure == "exit_before_commit":
                    os._exit(41)
                connection.commit()
                if fail_at == position+1 and failure == "exit_after_commit":
                    os._exit(42)
            except BaseException:
                connection.rollback()
                raise
        return snapshot(connection)
    finally:
        connection.close()


def snapshot(connection):
    position, watermark, duplicates = connection.execute("SELECT position,watermark,duplicates FROM checkpoint").fetchone()
    return {"position": position, "watermark": watermark, "duplicates": duplicates,
            "late": [row[0] for row in connection.execute("SELECT id FROM seen WHERE verdict='late' ORDER BY id")],
            "rows": [{"start": start, "route": route, "count": count, "cents": cents, "final": start+60 <= watermark}
                     for start, route, count, cents in connection.execute("SELECT * FROM totals ORDER BY start,route")]}


def inspect(database):
    connection = sqlite3.connect(database)
    try:
        return snapshot(connection)
    finally:
        connection.close()


def fixture():
    first = {"id":"e1","route":"a","minute":10,"cents":100}
    second = {"id":"e2","route":"a","minute":80,"cents":200}
    late = {"id":"e3","route":"a","minute":20,"cents":300}
    fourth = {"id":"e4","route":"a","minute":90,"cents":400}
    return b"\n".join(map(canonical, [first,second,late,second,fourth])) + b"\n"


def worker(database, source, fail_at, failure):
    with open(source, "rb") as handle:
        data = handle.read(65537)
    consume(database, data, fail_at=fail_at, failure=failure)


def crash_process(database, source, failure):
    result = subprocess.run([sys.executable,"-I","-B",str(Path(__file__).with_name("worker.py")),
                             str(database),str(source),"2",failure], capture_output=True, timeout=15)
    if result.returncode not in [41,42]:
        raise RuntimeError(result.stderr.decode())
    return result.returncode


def demo():
    with tempfile.TemporaryDirectory(prefix="kb-data-stream-") as directory:
        root = Path(directory); data = fixture(); source = root / "source.jsonl"; source.write_bytes(data)
        database = root / "stream.sqlite"
        code = crash_process(database, source, "exit_after_commit")
        before = inspect(database)
        after = consume(database, data)
        return {"interrupted_exit": code, "committed_position": before["position"], "recovered": after}


def reconcile(data, streamed, dimensions):
    checked = quality(data)
    if checked["quality"]["rejected"]:
        raise ValueError("reconciliation requires quality-approved input")
    expected = aggregate(checked["events"], dimensions)
    def keyed(rows):
        result = {}
        for row in rows:
            key = (row["start"], row["route"])
            if key in result:
                raise ValueError("duplicate reconciliation grain")
            result[key] = row
        return result
    target, actual = keyed(expected), keyed(streamed["rows"])
    delta = []
    for start,route in sorted(target.keys() | actual.keys()):
        left = target.get((start,route), {"count":0,"cents":0})
        right = actual.get((start,route), {"count":0,"cents":0})
        count, cents = left["count"]-right["count"], left["cents"]-right["cents"]
        if count or cents:
            delta.append({"start":start,"route":route,"count_delta":count,"cents_delta":cents})
    return {"delta":delta, "expected":expected}


def reconcile_demo():
    with tempfile.TemporaryDirectory(prefix="kb-data-reconcile-") as directory:
        root = Path(directory); data = fixture(); dimensions = [("a","north")]
        streamed = consume(root / "stream.sqlite", data)
        report = reconcile(data, streamed, dimensions)
        corrected = publish(root / "published", data, dimensions)
        repeated = publish(root / "published", data, dimensions)
        assert corrected == repeated
        assert corrected["rows"] == report["expected"]
        return {"delta":report["delta"], "stream_cents":sum(r["cents"] for r in streamed["rows"]),
                "corrected_cents":sum(r["cents"] for r in corrected["rows"]), "repeat_same_contents":True}
