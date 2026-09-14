import { openLedger, createWithTransaction } from "./ledger.mjs"

export const summarySql = `WITH totals AS (
  SELECT j.id, j.destination, COALESCE(SUM(e.amount_cents), 0) AS total
  FROM journeys j LEFT JOIN expenses e ON e.journey_id=j.id
  GROUP BY j.id, j.destination
) SELECT id, destination, total,
  SUM(total) OVER (ORDER BY total, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running
FROM totals ORDER BY total, id`

export function page(db, cursor = null, limit = 2) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new RangeError("limit 1..10")
  if (cursor !== null && (!Array.isArray(cursor) || cursor.length !== 2 ||
      !cursor.every(Number.isSafeInteger) || cursor.some((x) => x < 0)))
    throw new TypeError("cursor [amount,id]")
  const after = cursor ? "WHERE (amount_cents, id) > (?, ?)" : ""
  return db.prepare(`SELECT id, amount_cents FROM expenses ${after}
    ORDER BY amount_cents, id LIMIT ?`).all(...(cursor ?? []), limit).map((r) => ({ ...r }))
}

export function queryDemo() {
  const db = openLedger(":memory:")
  try {
    createWithTransaction(db, "山城", [100, 100, 200, 300])
    createWithTransaction(db, "空行程", [])
    const summary = db.prepare(summarySql).all().map((r) => ({ ...r }))
    const first = page(db)
    db.prepare("INSERT INTO expenses(journey_id,amount_cents) VALUES (1,50)").run()
    const offset = db.prepare("SELECT id FROM expenses ORDER BY amount_cents,id LIMIT 2 OFFSET 2").all().map((r) => r.id)
    const next = page(db, [first.at(-1).amount_cents, first.at(-1).id])
    return { summary, first, offset, next }
  } finally { db.close() }
}
