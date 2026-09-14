import copy
import unittest
from retrieval import Index, load_fixture, tokens
from evaluation import evaluate, metrics, validate_cases


def doc(id, text, visibility="public"):
    return {"id":id,"title":"test","text":text,"visibility":visibility}


class RetrievalTests(unittest.TestCase):
    def test_normalization_and_bigrams(self):
        self.assertEqual(tokens("ＳＱＬ 索引查询"), ["sql","索引","引查","查询"])
        self.assertEqual(tokens("A a 库"), ["a","a","库"])
        self.assertEqual(tokens("！！！"), [])
    def test_snapshot_and_duplicate_id(self):
        docs=[doc("a","x")];index=Index(docs);identity=index.identity
        docs[0]["text"]="y"
        self.assertEqual(index.docs["a"]["text"],"x")
        self.assertNotEqual(identity,Index(docs).identity)
        with self.assertRaisesRegex(ValueError,"duplicate"):Index([doc("a","x"),doc("a","y")])
    def test_document_and_query_limits(self):
        for docs in [[],[doc(str(i),"x") for i in range(25)],[doc("a","x"*513)],[doc("a","x","hidden")]]:
            with self.assertRaises(ValueError):Index(docs)
        index=Index([doc("a","x")])
        for query,options in [("",{}),("x"*129,{}),("x",{"k":True}),("x",{"method":"magic"})]:
            with self.assertRaises(ValueError):index.search(query,**options)
    def test_postings_use_presence_but_counts_keep_frequency(self):
        index=Index([doc("a","x x"),doc("b","y")])
        self.assertEqual(index.postings["x"],{"a"})
        self.assertEqual(index.counts["a"]["x"],2)
    def test_known_query_and_unknown(self):
        index=Index(load_fixture("corpus.json"))
        self.assertEqual(index.search("SQL索引")[0]["id"],"sql-index")
        self.assertEqual(index.search("火星天气"),[])
        self.assertEqual(index.search("！！！"),[])
    def test_filter_precedes_ranking_and_statistics(self):
        public=[doc("a","x x"),doc("b","x y z")]
        expected=Index(public).search("x")
        actual=Index(public+[doc("private","x","internal")]).search("x")
        self.assertEqual(actual,expected)
        self.assertEqual(Index([doc("private","x","internal")]).search("x"),[])
    def test_stable_ties_and_duplicate_query_terms(self):
        index=Index([doc("b","x"),doc("a","x")])
        self.assertEqual([x["id"] for x in index.search("x")],["a","b"])
        self.assertEqual(index.search("x x"),index.search("x"))
    def test_length_normalization_changes_overlap_tie(self):
        index=Index([doc("a-long","x "+"y "*10),doc("z-short","x")])
        self.assertEqual(index.search("x",method="overlap")[0]["id"],"a-long")
        self.assertEqual(index.search("x",method="bm25")[0]["id"],"z-short")
    def test_input_order_does_not_change_index_or_results(self):
        data=load_fixture("corpus.json");first=Index(data);second=Index(list(reversed(data)))
        self.assertEqual(first.identity,second.identity)
        self.assertEqual(first.search("SQL索引"),second.search("SQL索引"))


class EvaluationTests(unittest.TestCase):
    def setUp(self):
        self.index=Index(load_fixture("corpus.json"));self.cases=load_fixture("queries.json")
    def test_metrics_have_explicit_denominators(self):
        self.assertEqual(metrics(["wrong","yes"],["yes","missing"],2),
            {"precision_at_k":0.5,"recall_at_k":0.5,"reciprocal_rank_at_k":0.5})
        self.assertEqual(metrics(["yes"],["yes"],2)["precision_at_k"],0.5)
        self.assertEqual(metrics([],["yes"],2)["recall_at_k"],0)
    def test_duplicate_ranks_and_no_answer_are_not_inflated(self):
        with self.assertRaises(ValueError):metrics(["a","a"],["a"],2)
        with self.assertRaises(ValueError):metrics([],[],2)
    def test_evaluation_split_keeps_failure_and_no_answer(self):
        result=evaluate(self.index,self.cases)
        self.assertEqual((result["answerable_count"],result["no_answer_count"]),(3,1))
        self.assertAlmostEqual(result["macro"]["recall_at_k"],2/3)
        self.assertAlmostEqual(result["macro"]["precision_at_k"],1/3)
        self.assertAlmostEqual(result["macro"]["reciprocal_rank_at_k"],2/3)
        self.assertEqual(result["no_answer_accuracy"],1)
        self.assertEqual(next(r for r in result["records"] if r["id"]=="eval-paraphrase")["ranked"],[])
    def test_dev_is_separate_and_reproducible(self):
        result=evaluate(self.index,self.cases,split="dev")
        self.assertEqual(result["answerable_count"],3)
        self.assertIsNone(result["no_answer_accuracy"])
        self.assertTrue(all(r["id"].startswith("dev-") for r in result["records"]))
        self.assertEqual(evaluate(self.index,self.cases),evaluate(self.index,self.cases))
    def test_unknown_invisible_and_duplicate_judgments(self):
        for relevant in [["missing"],["internal-fixture"],["sql-index","sql-index"]]:
            cases=copy.deepcopy(self.cases);cases[0]["relevant"]=relevant
            with self.assertRaises(ValueError):validate_cases(cases,self.index)
    def test_split_leak_and_empty_split(self):
        cases=copy.deepcopy(self.cases);cases[-1]["query"]="ＳＱＬ 索引"
        with self.assertRaisesRegex(ValueError,"repeated"):validate_cases(cases,self.index)
        with self.assertRaisesRegex(ValueError,"empty"):evaluate(self.index,[c for c in self.cases if c["split"]=="dev"])
