"""Bounded synthetic data pipeline; no third-party dependencies or external IO."""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import uuid

MAX_BYTES = 65536
MAX_ROWS = 100
MAX_LINE = 512
MAX_GROUPS = 20


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def decode_event(line):
    if len(line) > MAX_LINE:
        raise ValueError("line too long")
    try:
        event = json.loads(line.decode("utf-8"), object_pairs_hook=unique_object)
    except (UnicodeError, ValueError, RecursionError) as exc:
        raise ValueError("invalid JSON/UTF-8") from exc
    if not isinstance(event, dict) or set(event) != {"id", "route", "minute", "cents"}:
        raise ValueError("fields")
    for field in ["id", "route"]:
        if not isinstance(event[field], str) or not re.fullmatch(r"[a-z0-9-]{1,32}", event[field]):
            raise ValueError("identifier")
    for field, ceiling in [("minute", 1000000), ("cents", 1000000)]:
        if type(event[field]) is not int or not 0 <= event[field] <= ceiling:
            raise ValueError("integer range")
    return event


def bounded_lines(data):
    if not isinstance(data, bytes) or len(data) > MAX_BYTES:
        raise ValueError("input bytes limit")
    # LF separates records. CRLF is accepted by the JSON parser; blank lines are rejected rows.
    lines = data.split(b"\n")
    if lines[-1] == b"":
        lines.pop()
    if len(lines) > MAX_ROWS:
        raise ValueError("input rows limit")
    return lines


def quality(data):
    events, seen, rejected, duplicates = [], {}, [], 0
    lines = bounded_lines(data)
    for number, line in enumerate(lines, 1):
        try:
            event = decode_event(line)
        except ValueError as exc:
            rejected.append({"line": number, "reason": str(exc)})
            continue
        prior = seen.get(event["id"])
        if prior is not None:
            if prior != event:
                raise ValueError("event identity conflict")
            duplicates += 1
            continue
        seen[event["id"]] = event
        events.append(event)
    return {"events": events, "quality": {"rows": len(lines), "accepted": len(events),
            "duplicates": duplicates, "rejected": rejected}, "input_sha256": sha(data)}


def aggregate(events, dimensions, max_groups=MAX_GROUPS):
    if type(max_groups) is not int or not 1 <= max_groups <= MAX_GROUPS:
        raise ValueError("group limit configuration")
    names = {}
    for route, name in dimensions:
        if route in names:
            raise ValueError("dimension key not unique")
        names[route] = name
    if len(events) > MAX_ROWS or len(names) > MAX_ROWS:
        raise ValueError("rows limit")
    groups, seen = {}, set()
    for event in events:
        decode_event(canonical(event))
        if event["id"] in seen:
            raise ValueError("aggregate expects unique events")
        seen.add(event["id"])
        if event["route"] not in names:
            raise ValueError("missing dimension")
        key = (event["minute"] // 60 * 60, event["route"])
        if key not in groups:
            if len(groups) >= max_groups:
                raise ValueError("group state limit")
            groups[key] = {"start": key[0], "route": key[1], "name": names[key[1]], "count": 0, "cents": 0}
        groups[key]["count"] += 1
        groups[key]["cents"] += event["cents"]
    return [groups[key] for key in sorted(groups)]


def publish(directory, data, dimensions, *, max_rejected=0, fail_before_pointer=False):
    """Single writer; directory must be an owned local temporary workspace."""
    checked = quality(data)
    if type(max_rejected) is not int or not 0 <= max_rejected <= MAX_ROWS:
        raise ValueError("reject budget")
    if len(checked["quality"]["rejected"]) > max_rejected:
        raise ValueError("quality budget exceeded")
    rows = aggregate(checked["events"], dimensions)
    root = Path(directory)
    root.mkdir(parents=True, exist_ok=True)
    generation = uuid.uuid4().hex
    stage = root / generation
    stage.mkdir()
    output = canonical(rows)
    (stage / "rows.json").write_bytes(output)
    manifest = {"schema": 1, "rule": "event-v1-window60", "input_sha256": checked["input_sha256"],
                "dimensions_sha256": sha(canonical(dimensions)), "quality": checked["quality"],
                "output_sha256": sha(output)}
    (stage / "manifest.json").write_bytes(canonical(manifest))
    if fail_before_pointer:
        raise RuntimeError("interrupted before publication")
    pointer = root / (generation + ".pointer")
    pointer.write_text(generation, encoding="ascii")
    os.replace(pointer, root / "CURRENT")
    return read_current(root)


def read_current(directory):
    root = Path(directory)
    generation = (root / "CURRENT").read_text(encoding="ascii")
    if not re.fullmatch(r"[a-f0-9]{32}", generation):
        raise ValueError("invalid generation")
    stage = root / generation
    manifest = json.loads((stage / "manifest.json").read_bytes())
    output = (stage / "rows.json").read_bytes()
    if sha(output) != manifest["output_sha256"]:
        raise ValueError("output digest mismatch")
    return {"manifest": manifest, "rows": json.loads(output)}


def fixture():
    events = [{"id": "e1", "route": "a", "minute": 10, "cents": 100},
              {"id": "e2", "route": "a", "minute": 20, "cents": 200},
              {"id": "e1", "route": "a", "minute": 10, "cents": 100},
              {"id": "e3", "route": "a", "minute": 80, "cents": 300},
              {"id": "bad", "route": "a", "minute": True, "cents": 1}]
    return b"\n".join(map(canonical, events)) + b"\n"


def demo():
    with tempfile.TemporaryDirectory(prefix="kb-data-batch-") as directory:
        result = publish(directory, fixture(), [("a", "north")], max_rejected=1)
        return {"quality": result["manifest"]["quality"], "rows": result["rows"]}
