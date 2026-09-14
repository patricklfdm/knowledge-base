import { queryDemo } from "./query-pages.mjs"
import { openLedger, createWithTransaction } from "./ledger.mjs"
import { addExpenseBatch } from "./savepoints.mjs"
import { backupDemo } from "./backup-restore.mjs"
console.log("queries", JSON.stringify(queryDemo()))
const db = openLedger(":memory:")
try {
  const id = createWithTransaction(db, "山城", [])
  db.exec("BEGIN")
  addExpenseBatch(db, id, [100])
  try { addExpenseBatch(db, id, [200, 0]) } catch (e) {
    if (e.errcode !== 275) throw e
  }
  addExpenseBatch(db, id, [300])
  db.exec("COMMIT")
  console.log("savepoint", db.prepare("SELECT amount_cents FROM expenses ORDER BY id").all())
} finally { db.close() }
console.log("backup", JSON.stringify(await backupDemo()))
