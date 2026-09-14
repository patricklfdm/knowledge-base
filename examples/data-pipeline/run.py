"""Explicit entry for the owned package; do not load code from an arbitrary cwd."""
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent
expected = (ROOT / ".python-version").read_text(encoding="ascii").strip()
actual = ".".join(map(str, sys.version_info[:3]))
if actual != expected:
    raise SystemExit(f"Expected CPython {expected}; got {actual}")
sys.path.insert(0, str(ROOT))


def main():
    if sys.argv[1:] == ["test"]:
        suite = unittest.defaultTestLoader.discover(str(ROOT / "tests"))
        if suite.countTestCases() == 0:
            raise SystemExit("no maintained tests discovered")
        return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1
    if sys.argv[1:] == ["batch"]:
        from pipeline import demo
        print(json.dumps(demo(), sort_keys=True))
        return 0
    if sys.argv[1:] == ["stream"]:
        from stream import demo
        print(json.dumps(demo(), sort_keys=True))
        return 0
    if sys.argv[1:] == ["reconcile"]:
        from stream import reconcile_demo
        print(json.dumps(reconcile_demo(), sort_keys=True))
        return 0
    print("usage: run.py {test|batch|stream|reconcile}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
