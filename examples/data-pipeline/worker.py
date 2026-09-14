"""Internal crash fixture. Only parent tests/demo supply their own temporary paths."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent
if ".".join(map(str,sys.version_info[:3])) != (ROOT / ".python-version").read_text().strip():
    raise SystemExit("Python version mismatch")
sys.path.insert(0, str(ROOT))
from stream import worker
if len(sys.argv) != 5 or sys.argv[4] not in {"exit_before_commit", "exit_after_commit"}:
    raise SystemExit(2)
worker(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4])
