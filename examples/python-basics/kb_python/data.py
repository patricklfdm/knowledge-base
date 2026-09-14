import csv
from dataclasses import asdict
from decimal import Decimal, localcontext
import io
import json
from pathlib import Path
import re
import tempfile
from .model import Expense, InvalidData, Trip


def read_utf8(path: Path, limit: int = 8192) -> str:
    if type(limit) is not int or not 1 <= limit <= 65536:
        raise InvalidData("byte limit outside 1..65536")
    with path.open("rb") as source:
        raw = source.read(limit + 1)
    if len(raw) > limit:
        raise InvalidData("input byte limit exceeded")
    return raw.decode("utf-8", errors="strict")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise InvalidData(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise InvalidData(f"non-JSON number: {value}")


def load_trips(path: Path) -> tuple[Trip, ...]:
    rows = json.loads(read_utf8(path), object_pairs_hook=unique_object, parse_constant=reject_constant)
    if not isinstance(rows, list) or len(rows) > 100:
        raise InvalidData("expected list of at most 100 trips")
    result = []
    ids = set()
    for number, row in enumerate(rows, 1):
        try:
            trip = Trip.from_mapping(row)
            if trip.id in ids:
                raise InvalidData("duplicate trip id")
            ids.add(trip.id)
            result.append(trip)
        except InvalidData as error:
            raise InvalidData(f"trip record {number}: {error}") from error
    return tuple(result)


def parse_cents(text: str) -> int:
    if not isinstance(text, str) or not re.fullmatch(r"(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,2})?", text):
        raise InvalidData("amount requires plain nonnegative decimal with at most 2 fraction digits")
    with localcontext() as context:
        context.prec = 16
        return int(Decimal(text) * 100)


def parse_expenses(text: str) -> tuple[Expense, ...]:
    if not isinstance(text, str) or len(text.encode("utf-8")) > 65536:
        raise InvalidData("CSV byte limit exceeded")
    reader = csv.reader(io.StringIO(text, newline=""), strict=True)
    if next(reader, None) != ["expense_id", "trip_id", "amount", "note"]:
        raise InvalidData("CSV header mismatch")
    result = []
    for number, row in enumerate(reader, 1):
        if number > 100:
            raise InvalidData("too many expense records")
        if len(row) != 4:
            raise InvalidData(f"expense record {number}: expected 4 columns")
        try:
            result.append(Expense(row[0], row[1], parse_cents(row[2]), row[3]))
        except InvalidData as error:
            raise InvalidData(f"expense record {number}: {error}") from error
    return tuple(result)


def demo():
    with tempfile.TemporaryDirectory(prefix="kb-python data-") as directory:
        path = Path(directory) / "trips.json"
        path.write_text(json.dumps([{"id": "t1", "destination": "山城", "days": 3}], ensure_ascii=False), encoding="utf-8")
        trips = load_trips(path)
        expenses = parse_expenses('expense_id,trip_id,amount,note\r\ne1,t1,1.15,"车票,往返"\r\n')
        return {"trips": [asdict(t) for t in trips], "expenses": [asdict(e) for e in expenses],
                "float_counterexample": int(float("1.15") * 100), "exact_cents": parse_cents("1.15")}
