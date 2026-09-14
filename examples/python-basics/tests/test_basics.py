import contextlib
import copy
import importlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import venv
from kb_python.basics import add_label, demo, index_unique, parse_days, shared_default, total_days

ROOT = Path(__file__).resolve().parents[1]


class BasicsTests(unittest.TestCase):
    def test_runtime_and_quiet_import(self):
        self.assertEqual(tuple(map(int, (ROOT / ".python-version").read_text().strip().split("."))), sys.version_info[:3])
        stream = io.StringIO()
        with contextlib.redirect_stdout(stream):
            importlib.reload(importlib.import_module("kb_python.basics"))
        self.assertEqual(stream.getvalue(), "")

    def test_own_venv_without_activation_or_packages(self):
        with tempfile.TemporaryDirectory(prefix="kb-python venv-") as d:
            venv.EnvBuilder(with_pip=False).create(d)
            executable = Path(d) / "bin" / "python"
            result = subprocess.run([str(executable), "-I", "-B", "-c",
                                     "import json,sys;print(json.dumps([sys.prefix != sys.base_prefix, list(sys.version_info[:3])]))"],
                                    capture_output=True, text=True, timeout=20, check=True)
            expected = list(map(int, (ROOT / ".python-version").read_text().strip().split(".")))
            self.assertEqual(json.loads(result.stdout), [True, expected])

    def test_wrong_version_fails_before_loading_lessons(self):
        with tempfile.TemporaryDirectory(prefix="kb-python wrong-") as d:
            target = Path(d)
            (target / "run.py").write_bytes((ROOT / "run.py").read_bytes())
            (target / ".python-version").write_text("3.14.0\n", encoding="ascii")
            result = subprocess.run([sys.executable, "-I", "-B", str(target / "run.py"), "basics"],
                                    capture_output=True, text=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Expected CPython 3.14.0", result.stderr)

    def test_syntax_and_undefined_names_are_different_failures(self):
        with self.assertRaises(IndentationError):
            compile("if True:\nprint('bad')\n", "owned-example.py", "exec")
        with self.assertRaises(NameError):
            eval("missing_trip", {"__builtins__": {}})

    def test_values_and_conversion(self):
        self.assertEqual(parse_days("03"), 3)
        self.assertEqual(parse_days("30"), 30)
        self.assertEqual(demo()["division"], 3.5)
        self.assertEqual(demo()["floor"], -4)
        self.assertEqual(10 ** 30 + 1 - 10 ** 30, 1)

    def test_input_grammar_and_business_bounds(self):
        for value in [None, True, 3, "", "0", "31", "003", " 3", "+3", "3.0", "３", "٣"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_days(value)

    def test_loops_do_not_accept_bool_as_a_day(self):
        self.assertEqual(total_days([]), 0)
        self.assertEqual(total_days([1, 30, 2]), 33)
        for value in [True, 0, 31, 1.0, "3"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                total_days([value])

    def test_list_alias_shallow_and_nested_copy(self):
        original = [{"labels": ["a"]}]
        alias = original
        shallow = original.copy()
        deep = copy.deepcopy(original)
        shallow[0]["labels"].append("b")
        self.assertIs(alias, original)
        self.assertIsNot(shallow, original)
        self.assertEqual(original[0]["labels"], ["a", "b"])
        self.assertEqual(deep[0]["labels"], ["a"])

    def test_mutable_default_counterexample_and_repair(self):
        shared_default.__defaults__[0].clear()
        try:
            first = shared_default("a")
            second = shared_default("b")
            self.assertIs(first, second)
            self.assertEqual(first, ["a", "b"])
            self.assertEqual(add_label("a"), ["a"])
            self.assertEqual(add_label("b"), ["b"])
        finally:
            shared_default.__defaults__[0].clear()

    def test_dictionary_duplicates_missing_and_no_input_mutation(self):
        rows = [{"id": "t1", "days": 3}]
        result = index_unique(rows)
        result["t1"]["days"] = 2
        self.assertEqual(rows[0]["days"], 3)
        self.assertIsNone(result.get("missing"))
        with self.assertRaises(KeyError):
            _ = result["missing"]
        with self.assertRaises(ValueError):
            index_unique(rows + rows)
        self.assertEqual({r["id"]: r for r in rows + [{"id": "t1", "days": 9}]}["t1"]["days"], 9)
