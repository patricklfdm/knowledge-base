import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"

export function openLedger(path) {
  const db = new DatabaseSync(path)
  try {
    db.exec("PRAGMA foreign_keys = ON")
    db.exec(readFileSync(new URL("./ledger-schema.sql", import.meta.url), "utf8"))
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export const detailSql = `
  SELECT j.id AS journey_id, j.destination, e.id AS expense_id, e.amount_cents
  FROM journeys AS j JOIN expenses AS e ON e.journey_id = j.id
  ORDER BY j.id, e.id`

export const totalsSql = `
  SELECT j.id, j.destination, COUNT(e.id) AS expense_count,
         COALESCE(SUM(e.amount_cents), 0) AS total_cents
  FROM journeys AS j LEFT JOIN expenses AS e ON e.journey_id = j.id
  GROUP BY j.id, j.destination
  ORDER BY j.id`

function writeRows(db, destination, amounts) {
  const result = db.prepare("INSERT INTO journeys(destination) VALUES (?)").run(destination)
  const id = Number(result.lastInsertRowid)
  const insert = db.prepare("INSERT INTO expenses(journey_id, amount_cents) VALUES (?, ?)")
  for (const amount of amounts) insert.run(id, amount)
  return id
}

// Deliberately unsafe contrast, used only with synthetic teaching data.
export function createWithoutTransaction(db, destination, amounts) {
  return writeRows(db, destination, amounts)
}

// Synchronous, owns its transaction; no nesting, await, network or retries.
export function createWithTransaction(db, destination, amounts) {
  db.exec("BEGIN IMMEDIATE")
  try {
    const id = writeRows(db, destination, amounts)
    db.exec("COMMIT")
    return id
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
