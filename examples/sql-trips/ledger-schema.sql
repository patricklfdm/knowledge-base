CREATE TABLE IF NOT EXISTS journeys (
  id INTEGER PRIMARY KEY,
  destination TEXT NOT NULL CHECK(length(destination) > 0)
) STRICT;

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES journeys(id),
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0)
) STRICT;
