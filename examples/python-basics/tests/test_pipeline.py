import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from kb_python import cli
from kb_python.iteration import iter_trip_lines
from kb_python.model import Expense, InvalidData, Trip
from kb_python.pipeline import aggregate, build_report, sample_files

ROOT = Path(__file__).resolve().parents[1]
LINE = b'{"id":"t1","destination":"Bay","days":3}\n'


class PipelineTests(unittest.TestCase):
    def test_generator_is_lazy_and_consumed_once(self):
        with io.BytesIO(LINE * 2) as source:
            iterator = iter_trip_lines(source)
            self.assertEqual(source.tell(), 0)
            self.assertEqual(next(iterator), Trip("t1", "Bay", 3))
            self.assertEqual(source.tell(), len(LINE))
            self.assertEqual(len(list(iterator)), 1)
            self.assertEqual(list(iterator), [])
            self.assertFalse(source.closed)
        self.assertTrue(source.closed)

    def test_lazy_second_failure_and_caller_resource_ownership(self):
        with io.BytesIO(LINE + b'{"days":false}\n') as source:
            iterator = iter_trip_lines(source)
            self.assertEqual(next(iterator).id, "t1")
            with self.assertRaisesRegex(InvalidData, "line 2"):
                next(iterator)
            self.assertFalse(source.closed)
        self.assertTrue(source.closed)
        with io.BytesIO(LINE * 2) as source:
            iterator = iter_trip_lines(source)
            next(iterator)
            iterator.close()
            self.assertFalse(source.closed)

    def test_line_and_record_limits_and_incomplete_or_invalid_text(self):
        with io.BytesIO(LINE) as source:
            self.assertEqual(len(list(iter_trip_lines(source, 1, len(LINE)))), 1)
        for raw, count, size in [(LINE, 1, len(LINE)-1), (LINE*2, 1, 256), (LINE[:-1], 1, 256),
                                 (b'\xff\n', 1, 256), (b'\n', 1, 256), (b'{"id":"t1","id":"t2"}\n',1,256)]:
            with self.subTest(raw=raw), io.BytesIO(raw) as source, self.assertRaises(InvalidData):
                list(iter_trip_lines(source, count, size))
        with io.BytesIO(b"") as source:
            self.assertEqual(list(iter_trip_lines(source)), [])
        for count in [True, 0, 101]:
            with io.BytesIO(LINE) as source, self.assertRaises(InvalidData):
                list(iter_trip_lines(source, count))

    def test_aggregation_preserves_empty_trips_and_orders_by_id(self):
        trips = [Trip("t2", "雪原", 2), Trip("t1", "山城", 3)]
        expenses = [Expense("e1", "t1", 115, ""), Expense("e2", "t1", 29, "")]
        expected = [{"trip_id":"t1","destination":"山城","count":2,"cents":144},
                    {"trip_id":"t2","destination":"雪原","count":0,"cents":0}]
        self.assertEqual(aggregate(trips, expenses), expected)
        self.assertEqual(aggregate(reversed(trips), reversed(expenses)), expected)
        self.assertEqual(len(trips), 2)
        self.assertEqual(expenses[0].cents, 115)
        self.assertEqual(aggregate([], []), [])

    def test_duplicate_or_orphan_expenses_and_duplicate_trips_fail(self):
        trip = Trip("t1", "Bay", 1)
        expense = Expense("e1", "t1", 100, "")
        for trips, expenses in [([trip,trip], []), ([trip], [expense,expense]),
                                ([trip], [Expense("e2", "missing", 100, "")])]:
            with self.subTest(trips=trips, expenses=expenses), self.assertRaises(InvalidData):
                aggregate(trips, expenses)
        with self.assertRaises(InvalidData):
            aggregate([trip], [Expense("e"+str(i), "t1", 1, "") for i in range(101)])

    def test_repeated_runs_match_and_changed_input_changes_fingerprint(self):
        with tempfile.TemporaryDirectory(prefix="kb-python report-") as directory:
            paths = sample_files(Path(directory))
            before = [p.read_bytes() for p in paths]
            first = build_report(*paths)
            self.assertEqual(first, build_report(*paths))
            self.assertEqual(first["grand_cents"], 144)
            self.assertEqual((first["trip_count"], first["expense_count"]), (2, 2))
            self.assertEqual(before, [p.read_bytes() for p in paths])
            paths[1].write_bytes(before[1].replace(b"0.29", b"0.30"))
            changed = build_report(*paths)
            self.assertEqual(changed["grand_cents"], 145)
            self.assertNotEqual(changed["input_sha256"]["expenses"], first["input_sha256"]["expenses"])

    def test_each_source_is_read_once_for_parse_and_hash(self):
        from kb_python.data import read_utf8
        with tempfile.TemporaryDirectory(prefix="kb-python once-") as directory:
            paths = sample_files(Path(directory))
            with patch("kb_python.pipeline.read_utf8", wraps=read_utf8) as reader:
                build_report(*paths)
                self.assertEqual(reader.call_count, 2)

    def test_real_cli_success_help_and_repeated_bytes_from_other_cwd(self):
        with tempfile.TemporaryDirectory(prefix="kb-python cli space-") as directory:
            paths = sample_files(Path(directory))
            command = [sys.executable, "-I", "-B", str(ROOT / "run.py"), "summarize", *map(str, paths)]
            first = subprocess.run(command, cwd=directory, capture_output=True, timeout=10, check=True)
            second = subprocess.run(command, cwd=directory, capture_output=True, timeout=10, check=True)
            self.assertEqual(first.stdout, second.stdout)
            self.assertEqual(first.stderr, b"")
            self.assertEqual(json.loads(first.stdout)["grand_cents"], 144)
            help_result = subprocess.run(command[:5]+["--help"], capture_output=True, text=True, timeout=10)
            self.assertEqual(help_result.returncode, 0)
            self.assertIn("usage:", help_result.stdout)

    def test_cli_rejects_bad_input_without_success_stdout_or_mutation(self):
        with tempfile.TemporaryDirectory(prefix="kb-python cli bad-") as directory:
            paths = sample_files(Path(directory))
            command = [sys.executable, "-I", "-B", str(ROOT / "run.py"), "summarize"]
            for arguments in [[], ["--unknown"], [str(Path(directory)/"missing"), str(paths[1])]]:
                result = subprocess.run(command+arguments, capture_output=True, timeout=10)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, b"")
                self.assertTrue(result.stderr)
            for bad in ['expense_id,trip_id,amount,note\ne1,t1,1,a\ne1,t1,1,a\n', 'bad header\n']:
                paths[1].write_text(bad, encoding="utf-8")
                before = [p.read_bytes() for p in paths]
                result = subprocess.run(command+list(map(str, paths)), capture_output=True, timeout=10)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, b"")
                self.assertIn(b"input rejected", result.stderr)
                self.assertEqual(before, [p.read_bytes() for p in paths])

    def test_unexpected_programming_error_is_not_converted_to_empty_report(self):
        with patch("kb_python.cli.build_report", side_effect=RuntimeError("deliberate bug")):
            with self.assertRaisesRegex(RuntimeError, "deliberate bug"):
                cli.main(["owned-trips", "owned-expenses"])

    def test_test_harness_detects_wrong_expected_value(self):
        class DeliberatelyWrong(unittest.TestCase):
            def runTest(self):
                self.assertEqual(115, 114)
        stream = io.StringIO()
        result = unittest.TextTestRunner(stream=stream).run(unittest.TestSuite([DeliberatelyWrong()]))
        self.assertFalse(result.wasSuccessful())
        self.assertEqual(len(result.failures), 1)
        self.assertIn("115 != 114", stream.getvalue())
