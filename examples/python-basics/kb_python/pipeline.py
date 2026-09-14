import hashlib
import json
from pathlib import Path
import tempfile
from .data import decode_trips, parse_expenses, read_utf8
from .model import Expense, InvalidData, Trip


def aggregate(trips, expenses):
    totals = {}
    for number, trip in enumerate(trips, 1):
        if number > 100 or not isinstance(trip, Trip):
            raise InvalidData("at most 100 validated trips required")
        if trip.id in totals:
            raise InvalidData("duplicate trip id")
        totals[trip.id] = {"trip_id": trip.id, "destination": trip.destination, "count": 0, "cents": 0}
    seen = set()
    for number, expense in enumerate(expenses, 1):
        if number > 100 or not isinstance(expense, Expense):
            raise InvalidData("at most 100 validated expenses required")
        key = expense.id
        if key in seen:
            raise InvalidData(f"duplicate expense id: {key}")
        seen.add(key)
        if expense.trip_id not in totals:
            raise InvalidData(f"orphan expense: {key}")
        group = totals[expense.trip_id]
        group["count"] += 1
        group["cents"] += expense.cents
    return [totals[id] for id in sorted(totals)]


def build_report(trips_path: Path, expenses_path: Path):
    # Each bounded input is read once; parsing and fingerprinting use those same bytes.
    trips_text = read_utf8(trips_path)
    expenses_text = read_utf8(expenses_path, 65536)
    trips = decode_trips(trips_text)
    expenses = parse_expenses(expenses_text)
    totals = aggregate(trips, expenses)
    return {"format_version": 1, "trip_count": len(trips), "expense_count": len(expenses),
            "grand_cents": sum(row["cents"] for row in totals), "totals": totals,
            "input_sha256": {"trips": hashlib.sha256(trips_text.encode("utf-8")).hexdigest(),
                             "expenses": hashlib.sha256(expenses_text.encode("utf-8")).hexdigest()}}


def sample_files(directory: Path):
    trips = directory / "trips.json"
    expenses = directory / "expenses.csv"
    trips.write_text(json.dumps([{"id": "t2", "destination": "雪原", "days": 2},
                                 {"id": "t1", "destination": "山城", "days": 3}], ensure_ascii=False), encoding="utf-8")
    expenses.write_text('expense_id,trip_id,amount,note\ne1,t1,1.15,"车票,往返"\ne2,t1,0.29,补票\n', encoding="utf-8", newline="")
    return trips, expenses


def demo():
    with tempfile.TemporaryDirectory(prefix="kb-python pipeline-") as directory:
        return build_report(*sample_files(Path(directory)))
