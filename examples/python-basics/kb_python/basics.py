"""P00–P02: explicit contracts, objects and controlled counterexamples."""
import copy


def parse_days(text):
    if not isinstance(text, str) or not text or len(text) > 2 or any(c not in "0123456789" for c in text):
        raise ValueError("days must be 1–2 ASCII digits")
    days = int(text)
    if not 1 <= days <= 30:
        raise ValueError("days outside 1..30")
    return days


def total_days(values):
    total = 0
    for value in values:
        if type(value) is not int or not 1 <= value <= 30:
            raise ValueError("integer days required; bool is not accepted")
        total += value
    return total


def add_label(label, labels=None):
    if labels is None:
        labels = []
    return [*labels, label]


def shared_default(label, labels=[]):
    """Deliberately wrong: used only to demonstrate one persistent default object."""
    labels.append(label)
    return labels


def index_unique(rows):
    result = {}
    for row in rows:
        key = row["id"]
        if key in result:
            raise ValueError(f"duplicate id: {key}")
        result[key] = dict(row)
    return result


def demo():
    source = [{"id": "t1", "labels": ["山城"]}]
    alias = source
    shallow = list(source)
    deep = copy.deepcopy(source)
    shallow[0]["labels"].append("徒步")
    return {"division": 7 / 2, "floor": -7 // 2, "days": parse_days("03"),
            "total": total_days([3, 2]), "same_list": alias is source,
            "shallow_nested": shallow[0] is source[0], "deep_labels": deep[0]["labels"],
            "separate_defaults": [add_label("a"), add_label("b")]}
