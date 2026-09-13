import { openLedger, createWithTransaction } from "./ledger.mjs"

export const querySql = `SELECT id, amount_cents FROM expenses
  WHERE journey_id = ? AND amount_cents >= ? ORDER BY amount_cents, id`
export const createIndexSql =
  "CREATE INDEX expenses_journey_amount ON expenses(journey_id, amount_cents)"

export function dataset() {
  const db = openLedger(":memory:")
  try {
    for (let j = 1; j <= 100; j++) {
      createWithTransaction(
        db,
        `合成行程${j}`,
        Array.from({ length: 20 }, (_, k) => (k + 1) * 100),
      )
    }
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export function snapshot(db, journey = 42, minimum = 1000) {
  return {
    plan: db
      .prepare("EXPLAIN QUERY PLAN " + querySql)
      .all(journey, minimum)
      .map((r) => r.detail),
    rows: db.prepare(querySql).all(journey, minimum),
  }
}

export function comparePlans() {
  const db = dataset()
  try {
    const sqlite = db.prepare("SELECT sqlite_version() AS v").get().v
    const before = snapshot(db)
    db.exec(createIndexSql)
    const indexed = snapshot(db)
    db.exec("DROP INDEX expenses_journey_amount")
    db.exec("CREATE INDEX expenses_amount_journey ON expenses(amount_cents, journey_id)")
    const reversed = snapshot(db)
    db.exec("DROP INDEX expenses_amount_journey")
    const removed = snapshot(db)
    return { sqlite, before, indexed, reversed, removed }
  } finally {
    db.close()
  }
}
