from dataclasses import dataclass
import re


class InvalidData(ValueError):
    """A known input contract failure, not a blanket catch for programming errors."""


def identifier(value: object) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[a-z][a-z0-9]{0,15}", value):
        raise InvalidData("id must be 1..16 lowercase ASCII letters/digits, starting with a letter")
    return value


def annotated_name(value: str) -> str:
    return value


@dataclass(frozen=True)
class Trip:
    id: str
    destination: str
    days: int

    def __post_init__(self):
        identifier(self.id)
        if not isinstance(self.destination, str) or not 1 <= len(self.destination) <= 80 or self.destination.strip() != self.destination:
            raise InvalidData("destination must be 1..80 characters without edge whitespace")
        if type(self.days) is not int or not 1 <= self.days <= 30:
            raise InvalidData("days must be integer 1..30")

    @classmethod
    def from_mapping(cls, row: object):
        if not isinstance(row, dict) or set(row) != {"id", "destination", "days"}:
            raise InvalidData("trip requires exactly id, destination, days")
        return cls(row["id"], row["destination"], row["days"])


@dataclass(frozen=True)
class Expense:
    id: str
    trip_id: str
    cents: int
    note: str

    def __post_init__(self):
        identifier(self.id)
        identifier(self.trip_id)
        if type(self.cents) is not int or not 0 <= self.cents <= 99999999:
            raise InvalidData("cents outside contract")
        if not isinstance(self.note, str) or len(self.note) > 120:
            raise InvalidData("note too long")
