from pathlib import Path
import tempfile
import unittest
from pipeline import canonical, publish, quality
from stream import consume, crash_process, fixture, inspect, reconcile, reconcile_demo


class StreamTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="kb-data-stream-test-")
        self.root = Path(self.temp.name)
        self.db = self.root / "events.sqlite"
    def tearDown(self): self.temp.cleanup()
    def test_arrival_order_late_duplicate_and_finality(self):
        actual = consume(self.db, fixture())
        self.assertEqual(actual, {"position":5,"watermark":80,"duplicates":1,"late":["e3"],
            "rows":[{"start":0,"route":"a","count":1,"cents":100,"final":True},
                    {"start":60,"route":"a","count":2,"cents":600,"final":False}]})
    def test_reopen_same_source_has_no_new_effects(self):
        first = consume(self.db, fixture())
        self.assertEqual(consume(self.db, fixture()), first)
    def test_watermark_boundary_closes_window(self):
        def e(id,t): return canonical({"id":id,"route":"a","minute":t,"cents":1})
        data = b"\n".join([e("a",70),e("b",59),e("c",60)])
        actual = consume(self.db, data)
        self.assertEqual(actual["watermark"],60)
        self.assertEqual(actual["late"],["b"])
        self.assertEqual(actual["rows"][0]["count"],2)
    def test_older_timestamp_in_open_window_is_accepted(self):
        first = {"id":"a","route":"a","minute":90,"cents":1}
        actual = consume(self.db, canonical(first)+b"\n"+canonical(first | {"id":"b","minute":65}))
        self.assertEqual(actual["late"],[])
        self.assertEqual(actual["rows"][0]["count"],2)
        self.assertEqual(actual["watermark"],80)
    def test_source_or_policy_change_rejected(self):
        previous = consume(self.db, fixture())
        for data, options in [(fixture().replace(b'"route":"a"', b'"route": "a"', 1),{}),(fixture(),{"max_seen":99})]:
            with self.assertRaises(ValueError): consume(self.db,data,**options)
        self.assertEqual(inspect(self.db),previous)
    def test_conflict_rolls_back_current_arrival(self):
        event = quality(fixture())["events"][0]
        data = canonical(event)+b"\n"+canonical(event | {"cents":999})
        with self.assertRaisesRegex(ValueError,"identity conflict"): consume(self.db,data)
        actual = inspect(self.db)
        self.assertEqual(actual["position"],1)
        self.assertEqual(actual["rows"][0]["cents"],100)
    def test_late_duplicate_does_not_become_accepted(self):
        data = fixture()+canonical({"id":"e3","route":"a","minute":20,"cents":300})
        actual = consume(self.db,data)
        self.assertEqual(actual["late"],["e3"])
        self.assertEqual(actual["duplicates"],2)
        self.assertEqual(sum(r["cents"] for r in actual["rows"]),700)
    def test_error_before_commit_rolls_back_effect_and_offset(self):
        with self.assertRaises(RuntimeError): consume(self.db,fixture(),fail_at=2,failure="error_before_commit")
        before = inspect(self.db)
        self.assertEqual(before["position"],1)
        self.assertEqual(len(before["rows"]),1)
        self.assertEqual(before["watermark"],0)
        self.assertEqual(consume(self.db,fixture())["position"],5)
    def test_process_crashes_before_and_after_commit(self):
        source = self.root / "source.jsonl"; source.write_bytes(fixture())
        for failure, code, position in [("exit_before_commit",41,1),("exit_after_commit",42,2)]:
            with self.subTest(failure=failure):
                db = self.root / (failure+".sqlite")
                self.assertEqual(crash_process(db,source,failure),code)
                self.assertEqual(inspect(db)["position"],position)
                final = consume(db,fixture())
                self.assertEqual(final["position"],5)
                self.assertEqual(sum(r["cents"] for r in final["rows"]),700)
                self.assertEqual(final["duplicates"],1)
    def test_state_limits_preserve_committed_prefix(self):
        with self.assertRaisesRegex(ValueError,"dedup state limit"): consume(self.db,fixture(),max_seen=2)
        self.assertEqual(inspect(self.db)["position"],2)
        other = self.root / "groups.sqlite"
        with self.assertRaisesRegex(ValueError,"group state limit"): consume(other,fixture(),max_groups=1)
        self.assertEqual(inspect(other)["position"],1)
    def test_empty_and_bad_input(self):
        self.assertEqual(consume(self.db,b""), {"position":0,"watermark":-1,"duplicates":0,"late":[],"rows":[]})
        for data in [b"bad json",b"\n"*101,b"x"*65537]:
            with self.assertRaises(ValueError): consume(self.root / "bad.sqlite",data)
        self.assertFalse((self.root / "bad.sqlite").exists())
    def test_budget_configuration(self):
        for options in [{"max_seen":True},{"max_seen":101},{"max_groups":0},{"max_groups":21}]:
            with self.assertRaises(ValueError): consume(self.db,fixture(),**options)
    def test_reordered_source_requires_new_checkpoint(self):
        first = consume(self.db,fixture())
        rows = sorted(quality(fixture())["events"],key=lambda e:e["minute"])
        sorted_data = b"\n".join(map(canonical,rows))
        with self.assertRaisesRegex(ValueError,"source or policy changed"): consume(self.db,sorted_data)
        reordered = consume(self.root / "sorted.sqlite", sorted_data)
        self.assertEqual(reordered["late"],[])
        self.assertEqual(sum(r["cents"] for r in reordered["rows"]),1000)
        self.assertEqual(sum(r["cents"] for r in first["rows"]),700)


class ReconcileTests(unittest.TestCase):
    def test_full_batch_correction_is_repeatable(self):
        self.assertEqual(reconcile_demo(), {"delta":[{"start":0,"route":"a","count_delta":1,"cents_delta":300}],
            "stream_cents":700,"corrected_cents":1000,"repeat_same_contents":True})
    def test_bad_quality_cannot_disappear_in_reconciliation(self):
        with self.assertRaisesRegex(ValueError,"quality-approved"):
            reconcile(b"bad json", {"rows":[]}, [])
    def test_no_delta_for_same_scope(self):
        data = canonical({"id":"a","route":"a","minute":10,"cents":0})
        with tempfile.TemporaryDirectory() as directory:
            streamed = consume(Path(directory)/"db.sqlite",data)
            self.assertEqual(reconcile(data,streamed,[("a","north")])["delta"],[])
    def test_counts_catch_zero_value_missing_event(self):
        data = canonical({"id":"a","route":"a","minute":10,"cents":0})
        report = reconcile(data,{"rows":[]},[("a","north")])
        self.assertEqual(report["delta"],[{"start":0,"route":"a","count_delta":1,"cents_delta":0}])
    def test_extra_group_and_duplicate_grain(self):
        rows = [{"start":60,"route":"a","count":1,"cents":5}]
        self.assertEqual(reconcile(b"",{"rows":rows},[])["delta"],
                         [{"start":60,"route":"a","count_delta":-1,"cents_delta":-5}])
        with self.assertRaisesRegex(ValueError,"duplicate reconciliation grain"):
            reconcile(b"",{"rows":rows*2},[])
