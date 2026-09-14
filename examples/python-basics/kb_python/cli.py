import argparse
import csv
import json
from pathlib import Path
import sys
from .model import InvalidData
from .pipeline import build_report


def main(argv=None):
    parser = argparse.ArgumentParser(prog="kb-python summarize", description="Read bounded synthetic input files; emit a validated JSON summary.")
    parser.add_argument("trips", type=Path)
    parser.add_argument("expenses", type=Path)
    args = parser.parse_args(argv)
    try:
        report = build_report(args.trips, args.expenses)
    except (InvalidData, OSError, UnicodeError, json.JSONDecodeError, csv.Error) as error:
        print(f"input rejected: {error}", file=sys.stderr)
        return 2
    print(json.dumps(report, ensure_ascii=True, sort_keys=True, separators=(",", ":")))
    return 0
