import json
from pathlib import Path
import tempfile
import unittest
from pipeline import aggregate, canonical, decode_event, fixture, publish, quality, read_current, sha


class QualityTests(unittest.TestCase):
    def test_counts_and_digest(self):
        result = quality(fixture()); q = result["quality"]
        self.assertEqual((q["rows"], q["accepted"], q["duplicates"], len(q["rejected"])), (5, 3, 1, 1))
        self.assertEqual(q["rows"], q["accepted"] + q["duplicates"] + len(q["rejected"]))
        self.assertEqual(result["input_sha256"], sha(fixture()))
        self.assertEqual(q["rejected"], [{"line": 5, "reason": "integer range"}])
    def test_empty_and_blank(self):
        self.assertEqual(quality(b"")["quality"]["rows"], 0)
        self.assertEqual(len(quality(b"\n")["quality"]["rejected"]), 1)
    def test_utf8_duplicate_keys_and_long_line(self):
        for line in [b'\xff', b'{"id":"a","id":"b"}', b' ' * 513, b'[]']:
            with self.subTest(line=line[:20]), self.assertRaises(ValueError): decode_event(line)
    def test_field_types_and_ranges(self):
        valid = {"id":"x", "route":"a", "minute":0, "cents":0}
        self.assertEqual(decode_event(canonical(valid)), valid)
        for field, value in [("minute", True), ("cents", -1), ("cents", 1.0), ("minute",1000001), ("id","../x"), ("extra",1)]:
            with self.subTest(field=field,value=value), self.assertRaises(ValueError): decode_event(canonical(valid | {field:value}))
    def test_identity_conflict_aborts(self):
        event = quality(fixture())["events"][0]
        with self.assertRaisesRegex(ValueError, "identity conflict"):
            quality(canonical(event) + b"\n" + canonical(event | {"cents": 999}))
    def test_input_limits(self):
        for data in [b"x"*65537, b"\n"*101]:
            with self.assertRaises(ValueError): quality(data)


class AggregateTests(unittest.TestCase):
    def setUp(self): self.events = quality(fixture())["events"]
    def test_grain_and_conservation(self):
        rows = aggregate(self.events, [("a","north")])
        self.assertEqual([(r["start"],r["count"],r["cents"]) for r in rows], [(0,2,300),(60,1,300)])
        self.assertEqual(sum(r["cents"] for r in rows), sum(e["cents"] for e in self.events))
        self.assertEqual(aggregate(list(reversed(self.events)), [("a","north")]), rows)
    def test_duplicate_dimension_fails(self):
        with self.assertRaisesRegex(ValueError, "not unique"): aggregate(self.events, [("a","north"),("a","north")])
    def test_missing_dimension_and_event_duplicates(self):
        with self.assertRaisesRegex(ValueError, "missing dimension"): aggregate(self.events, [])
        with self.assertRaisesRegex(ValueError, "unique events"): aggregate(self.events*2, [("a","north")])
    def test_group_bound_and_empty(self):
        with self.assertRaisesRegex(ValueError, "group state limit"): aggregate(self.events, [("a","north")], max_groups=1)
        self.assertEqual(aggregate([], []), [])


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="kb-data-test-")
        self.root = Path(self.temp.name)
    def tearDown(self): self.temp.cleanup()
    def test_publish_and_replay_same_contents(self):
        one = publish(self.root, fixture(), [("a","north")], max_rejected=1)
        two = publish(self.root, fixture(), [("a","north")], max_rejected=1)
        self.assertEqual(one, two)
        self.assertEqual(one["manifest"]["dimensions_sha256"], sha(canonical([("a","north")])))
    def test_failed_quality_preserves_previous(self):
        previous = publish(self.root, b"", [])
        with self.assertRaisesRegex(ValueError, "quality budget"): publish(self.root, fixture(), [("a","north")])
        self.assertEqual(read_current(self.root), previous)
    def test_failure_before_pointer_preserves_previous(self):
        previous = publish(self.root, b"", [])
        with self.assertRaises(RuntimeError): publish(self.root, fixture(), [("a","north")], max_rejected=1, fail_before_pointer=True)
        self.assertEqual(read_current(self.root), previous)
        self.assertEqual(len([p for p in self.root.iterdir() if p.is_dir()]), 2)
    def test_corruption_detected(self):
        publish(self.root, b"", [])
        generation = (self.root / "CURRENT").read_text()
        (self.root / generation / "rows.json").write_text('[{"cents":999}]')
        with self.assertRaisesRegex(ValueError, "digest mismatch"): read_current(self.root)
    def test_pointer_path_rejected(self):
        (self.root / "CURRENT").write_text("../outside")
        with self.assertRaisesRegex(ValueError, "invalid generation"): read_current(self.root)
