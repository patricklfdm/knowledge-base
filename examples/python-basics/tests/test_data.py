import csv
from dataclasses import FrozenInstanceError
import json
from pathlib import Path
import tempfile
import unittest
from kb_python.model import annotated_name, Expense, InvalidData, Trip
from kb_python.data import load_trips, parse_cents, parse_expenses, read_utf8


class DataTests(unittest.TestCase):
    def test_annotations_are_not_runtime_validation(self):
        self.assertEqual(annotated_name(3), 3)
        good = Trip.from_mapping({"id": "t1", "destination": "山城", "days": 3})
        self.assertEqual(good, Trip("t1", "山城", 3))
        with self.assertRaises(FrozenInstanceError):
            good.days = 4

    def test_model_rejects_wrong_shape_types_and_bounds(self):
        for row in [None, [], {"id": "t1"}, {"id": "t1", "destination": "山城", "days": 3, "extra": 0}]:
            with self.subTest(row=row), self.assertRaises(InvalidData):
                Trip.from_mapping(row)
        for days in [True, "3", 0, 31, 1.0]:
            with self.subTest(days=days), self.assertRaises(InvalidData):
                Trip("t1", "山城", days)
        for destination in ["", " 山城", "山城 ", "x" * 81, 5]:
            with self.subTest(destination=destination), self.assertRaises(InvalidData):
                Trip("t1", destination, 1)
        for id in ["T1", "1", "t-1", "a" * 17]:
            with self.subTest(id=id), self.assertRaises(InvalidData):
                Trip(id, "山城", 1)

    def test_utf8_byte_boundary_and_missing_file(self):
        with tempfile.TemporaryDirectory(prefix="kb-json-") as directory:
            path = Path(directory) / "data.json"
            path.write_bytes("山".encode("utf-8"))
            self.assertEqual(read_utf8(path, 3), "山")
            with self.assertRaises(InvalidData):
                read_utf8(path, 2)
            path.write_bytes(b"\xff")
            with self.assertRaises(UnicodeDecodeError):
                read_utf8(path)
            with self.assertRaises(FileNotFoundError):
                read_utf8(Path(directory) / "missing")
            self.assertEqual(path.read_bytes(), b"\xff")

    def test_json_validates_all_records_before_return(self):
        with tempfile.TemporaryDirectory(prefix="kb-json-") as directory:
            path = Path(directory) / "trips.json"
            good = {"id": "t1", "destination": "山城", "days": 3}
            path.write_text(json.dumps([good]), encoding="utf-8")
            self.assertEqual(load_trips(path), (Trip("t1", "山城", 3),))
            path.write_text(json.dumps([good, {**good, "id": "t2", "days": False}]), encoding="utf-8")
            before = path.read_bytes()
            with self.assertRaisesRegex(InvalidData, "record 2") as caught:
                load_trips(path)
            self.assertIsInstance(caught.exception.__cause__, InvalidData)
            self.assertEqual(path.read_bytes(), before)

    def test_json_duplicate_keys_constants_shapes_and_truncated_input(self):
        with tempfile.TemporaryDirectory(prefix="kb-json-") as directory:
            path = Path(directory) / "trips.json"
            for text in ['[{"id":"t1","id":"t2"}]', '[NaN]', '[Infinity]', '{}', '[', '[null]',
                         json.dumps([{"id":"t1","destination":"山城","days":1}] * 2),
                         json.dumps([0] * 101)]:
                path.write_text(text, encoding="utf-8")
                with self.subTest(text=text), self.assertRaises((InvalidData, json.JSONDecodeError)):
                    load_trips(path)
            path.write_text('[]', encoding="utf-8")
            self.assertEqual(load_trips(path), ())

    def test_decimal_exact_values_and_grammar(self):
        for text, expected in [("0", 0), ("1.15", 115), ("0.29", 29), ("1.2", 120), ("999999.99", 99999999)]:
            with self.subTest(text=text):
                self.assertEqual(parse_cents(text), expected)
        self.assertEqual(int(float("1.15") * 100), 114)
        for value in ["01", "1.001", "-1", "+1", "1e2", "NaN", "Infinity", " 1", "1.", "1000000", 1.2]:
            with self.subTest(value=value), self.assertRaises(InvalidData):
                parse_cents(value)

    def test_csv_quoted_delimiters_newlines_and_empty_input(self):
        text = 'expense_id,trip_id,amount,note\r\ne1,t1,1.15,"车票,往返"\r\ne2,t1,0.29,"一行\n二行"\r\n'
        rows = parse_expenses(text)
        self.assertEqual(rows[0], Expense("e1", "t1", 115, "车票,往返"))
        self.assertEqual(rows[1].note, "一行\n二行")
        self.assertGreater(len(text.splitlines()), 3)
        self.assertEqual(parse_expenses('expense_id,trip_id,amount,note\n'), ())

    def test_csv_rejects_bad_header_columns_tail_amount_and_limits(self):
        header = 'expense_id,trip_id,amount,note\n'
        for text in ['', 'id,amount\n', header + 'e1,t1,1\n', header + 'e1,t1,1,a,b\n',
                     header + 'e1,t1,1.001,a\n', header + 'e1,t1,1,"open',
                     header + 'e1,t1,1,a\n' * 101, 'x' * 65537]:
            with self.subTest(text=text[:80]), self.assertRaises((InvalidData, csv.Error)):
                parse_expenses(text)
