import test from "node:test"
import assert from "node:assert/strict"
import { openLedger, createWithTransaction } from "./ledger.mjs"
import { queryDemo, page, summarySql } from "./query-pages.mjs"
import { addExpenseBatch } from "./savepoints.mjs"
import { backupDemo } from "./backup-restore.mjs"

test("CTE totals preserve empty journeys; ROWS frame and total order give explicit running totals", () => {
  assert.deepEqual(queryDemo().summary, [
    { id: 2, destination: "空行程", total: 0, running: 0 },
    { id: 1, destination: "山城", total: 700, running: 700 },
  ])
  const db = openLedger(":memory:")
  try {
    assert.deepEqual(db.prepare(summarySql).all(), [])
    createWithTransaction(db, "A", [100]); createWithTransaction(db, "B", [100])
    assert.deepEqual(db.prepare(summarySql).all().map((r) => r.running), [100, 200])
  } finally { db.close() }
})
test("keyset cursor preserves ties; offset repeats an item after insert before page", () => {
  const r = queryDemo()
  assert.deepEqual(r.first.map((x) => x.id), [1, 2])
  assert.deepEqual(r.offset, [2, 3])
  assert.deepEqual(r.next.map((x) => x.id), [3, 4])
  const db = openLedger(":memory:")
  try {
    createWithTransaction(db, "A", [100, 100, 100])
    assert.deepEqual(page(db, [100, 1], 2).map((x) => x.id), [2, 3])
    assert.deepEqual(page(db, [100, 3]), [])
    for (const bad of [0, -1, 11, 1.5, "2"]) assert.throws(() => page(db, null, bad), /limit/)
    for (const bad of [[null, 1], [1], [1, -1], [1, Infinity]]) assert.throws(() => page(db, bad), /cursor/)
  } finally { db.close() }
})
test("savepoint rolls back a failed whole batch while preserving outer work", () => {
  const db = openLedger(":memory:")
  try {
    const id = createWithTransaction(db, "A", [])
    assert.throws(() => addExpenseBatch(db, id, [1]), /outer transaction/)
    db.exec("BEGIN")
    addExpenseBatch(db, id, [100])
    assert.throws(() => addExpenseBatch(db, id, [200, 0]), (e) => e.errcode === 275)
    assert.equal(db.isTransaction, true)
    addExpenseBatch(db, id, [300]); db.exec("COMMIT")
    assert.deepEqual(db.prepare("SELECT amount_cents FROM expenses ORDER BY id").all().map((r) => r.amount_cents), [100, 300])
  } finally { db.close() }
})
test("RELEASE inside an outer transaction does not survive outer ROLLBACK", () => {
  const db = openLedger(":memory:")
  try {
    const id = createWithTransaction(db, "A", [])
    db.exec("BEGIN"); addExpenseBatch(db, id, [100]); db.exec("ROLLBACK")
    assert.equal(db.prepare("SELECT count(*) AS n FROM expenses").get().n, 0)
    db.exec("BEGIN; SAVEPOINT mark;")
    db.exec("ROLLBACK TO mark; ROLLBACK TO mark; RELEASE mark; COMMIT;")
    assert.throws(() => db.exec("ROLLBACK TO mark"), /no such savepoint/)
  } finally { db.close() }
})
test("online backup restores WAL commits in a new process; a valid main-only copy can be stale", async () => {
  const r = await backupDemo()
  assert.deepEqual(r.stale, { integrity: "ok", rows: [100] })
  assert.deepEqual(r.restored, { integrity: "ok", rows: [100, 200] })
  assert.deepEqual(r.child, r.restored)
  assert.equal(r.rejected, true); assert.equal(r.sourceRows, 2)
})
