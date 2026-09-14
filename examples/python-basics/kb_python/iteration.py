import io
import json
from .data import unique_object, reject_constant
from .model import Trip, InvalidData


def iter_trip_lines(source, max_records=100, max_line_bytes=256):
    """Borrow a binary stream. Limit includes LF/CRLF; caller owns closing it."""
    if type(max_records) is not int or not 1 <= max_records <= 100:
        raise InvalidData("record limit outside 1..100")
    if type(max_line_bytes) is not int or not 1 <= max_line_bytes <= 4096:
        raise InvalidData("line limit outside 1..4096")
    number = 0
    while True:
        raw = source.readline(max_line_bytes + 1)
        if not raw:
            return
        if len(raw) > max_line_bytes:
            raise InvalidData("line byte limit exceeded")
        number += 1
        if number > max_records:
            raise InvalidData("record limit exceeded")
        if not raw.endswith(b"\n"):
            raise InvalidData("incomplete line: LF required")
        try:
            row = json.loads(raw.decode("utf-8", errors="strict"), object_pairs_hook=unique_object, parse_constant=reject_constant)
            yield Trip.from_mapping(row)
        except (InvalidData, UnicodeError, json.JSONDecodeError) as error:
            raise InvalidData(f"line {number}: {error}") from error


def demo():
    raw = b'{"id":"t1","destination":"Bay","days":3}\n' * 2
    with io.BytesIO(raw) as source:
        iterator = iter_trip_lines(source)
        before = source.tell()
        first = next(iterator)
        after_first = source.tell()
        rest = list(iterator)
        exhausted = list(iterator)
        return {"before": before, "after_first": after_first, "total_bytes": len(raw),
                "first_id": first.id, "remaining": len(rest), "exhausted": exhausted}
