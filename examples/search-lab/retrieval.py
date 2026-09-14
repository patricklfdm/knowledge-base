"""Bounded lexical reference implementation, not a language tokenizer or search service."""
from collections import Counter, defaultdict
import hashlib
import json
import math
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parent
MAX_DOCS = 24
VERSION = "nfkc-bigram-v1-bm25-k1=1.2-b=0.75"


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def load_fixture(name):
    if name not in {"corpus.json", "queries.json"}:
        raise ValueError("fixture not allowed")
    data = (ROOT / name).read_bytes()
    if len(data) > 65536:
        raise ValueError("fixture byte limit")
    return json.loads(data)


def tokens(text):
    if not isinstance(text, str) or len(text) > 4096:
        raise ValueError("text limit")
    normalized = unicodedata.normalize("NFKC", text).casefold()
    result = []
    for run in re.findall(r"[a-z0-9]+|[\u4e00-\u9fff]+", normalized):
        if "\u4e00" <= run[0] <= "\u9fff" and len(run) > 1:
            result.extend(run[i:i+2] for i in range(len(run)-1))
        else:
            result.append(run)
    return result


class Index:
    def __init__(self, documents):
        if not isinstance(documents, list) or not 1 <= len(documents) <= MAX_DOCS:
            raise ValueError("document count")
        self.docs = {}
        for document in documents:
            if not isinstance(document, dict) or set(document) != {"id","title","text","visibility"}:
                raise ValueError("document fields")
            if not isinstance(document["id"],str) or not re.fullmatch(r"[a-z0-9-]{1,40}", document["id"]):
                raise ValueError("document id")
            for key, limit in [("title",80),("text",512)]:
                if not isinstance(document[key],str) or not document[key].strip() or len(document[key]) > limit:
                    raise ValueError("document text limit")
            if document["visibility"] not in ["public","internal"]:
                raise ValueError("visibility")
            if document["id"] in self.docs:
                raise ValueError("duplicate document id")
            self.docs[document["id"]] = dict(document)
        self.identity = digest({"version":VERSION,"documents":[self.docs[k] for k in sorted(self.docs)]})
        self.counts = {id:Counter(tokens(doc["title"]+" "+doc["text"])) for id,doc in self.docs.items()}
        self.postings = defaultdict(set)
        for id, counts in self.counts.items():
            for token in counts:
                self.postings[token].add(id)

    def search(self, query, *, k=2, method="bm25"):
        if not isinstance(query,str) or not query.strip() or len(query) > 128:
            raise ValueError("query limit")
        if type(k) is not int or not 1 <= k <= 5 or method not in {"overlap","bm25"}:
            raise ValueError("search options")
        terms = set(tokens(query))
        # Filter the authorized public corpus before candidates, statistics and top-k.
        visible = {id for id, doc in self.docs.items() if doc["visibility"] == "public"}
        if not visible or not terms:
            return []
        average = sum(sum(self.counts[id].values()) for id in visible) / len(visible)
        candidates = set().union(*(self.postings.get(term,set()) for term in terms)) & visible
        result = []
        for id in candidates:
            score = 0.0
            for term in sorted(terms):
                frequency = self.counts[id][term]
                if not frequency:
                    continue
                if method == "overlap":
                    score += 1
                else:
                    df = len(self.postings[term] & visible)
                    idf = math.log1p((len(visible)-df+0.5)/(df+0.5))
                    length = sum(self.counts[id].values())
                    score += idf * frequency * 2.2 / (frequency + 1.2*(0.25+0.75*length/average))
            result.append({"id":id,"score":score})
        return sorted(result,key=lambda row:(-row["score"],row["id"]))[:k]


def demo():
    index = Index(load_fixture("corpus.json"))
    return {"version":VERSION,"corpus_sha256":index.identity,"query":"SQL索引",
            "overlap":index.search("SQL索引",method="overlap"),"bm25":index.search("SQL索引")}
