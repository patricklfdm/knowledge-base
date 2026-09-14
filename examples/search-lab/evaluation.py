"""Known synthetic judgments; fixed parameters, no training or test-set tuning."""
from retrieval import Index, VERSION, digest, load_fixture, tokens


def validate_cases(cases, index):
    if not isinstance(cases,list) or not 1 <= len(cases) <= 32:
        raise ValueError("case count")
    ids, queries = set(), set()
    for case in cases:
        if set(case) != {"id","split","query","relevant"} or case["split"] not in {"dev","eval"}:
            raise ValueError("case fields")
        if not isinstance(case["id"],str) or not case["id"] or case["id"] in ids:
            raise ValueError("case id")
        if not isinstance(case["query"],str) or not case["query"].strip() or len(case["query"])>128:
            raise ValueError("query")
        key = tuple(sorted(set(tokens(case["query"]))))
        if key in queries:
            raise ValueError("query repeated across judgments/splits")
        relevant = case["relevant"]
        if not isinstance(relevant,list) or any(not isinstance(id,str) for id in relevant) or len(set(relevant)) != len(relevant):
            raise ValueError("relevance ids")
        if any(id not in index.docs or index.docs[id]["visibility"] != "public" for id in relevant):
            raise ValueError("unknown or invisible judgment")
        ids.add(case["id"]); queries.add(key)


def metrics(ranked, relevant, k):
    if type(k) is not int or k < 1 or not isinstance(ranked,list) or len(ranked) != len(set(ranked)):
        raise ValueError("metric inputs")
    target = set(relevant)
    if not target:
        raise ValueError("no-answer cases scored separately")
    top = ranked[:k]
    hits = len(set(top) & target)
    return {"precision_at_k":hits/k,"recall_at_k":hits/len(target),
            "reciprocal_rank_at_k":next((1/rank for rank,id in enumerate(top,1) if id in target),0.0)}


def evaluate(index, cases, *, split="eval", method="bm25", k=2):
    validate_cases(cases,index)
    if split not in {"dev","eval"}:
        raise ValueError("split")
    selected = [case for case in cases if case["split"] == split]
    if not selected:
        raise ValueError("empty evaluation split")
    records, answerable, absent = [], [], []
    for case in selected:
        ranked = [row["id"] for row in index.search(case["query"],method=method,k=k)]
        if case["relevant"]:
            score = metrics(ranked,case["relevant"],k);answerable.append(score)
        else:
            score = {"correct_abstention":not ranked};absent.append(not ranked)
        records.append({"id":case["id"],"ranked":ranked,"score":score})
    averages = {key:sum(row[key] for row in answerable)/len(answerable) for key in answerable[0]} if answerable else None
    return {"split":split,"method":method,"k":k,"version":VERSION,"corpus_sha256":index.identity,
            "judgments_sha256":digest(cases),"answerable_count":len(answerable),"no_answer_count":len(absent),
            "macro":averages,"no_answer_accuracy":sum(absent)/len(absent) if absent else None,"records":records}


def demo():
    index = Index(load_fixture("corpus.json"));cases=load_fixture("queries.json")
    return {method:evaluate(index,cases,method=method) for method in ["overlap","bm25"]}
