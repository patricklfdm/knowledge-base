import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openLedger, createWithTransaction } from "./ledger.mjs"

export const amount = (db) =>
  db.prepare("SELECT amount_cents FROM expenses WHERE id=1").get().amount_cents
const setAmount = (db, value) =>
  db.prepare("UPDATE expenses SET amount_cents=? WHERE id=1").run(value)

// Synchronous teaching fixture. Both connections use only this new temporary file.
export function withPair(mode, run) {
  if (!["DELETE", "WAL"].includes(mode)) throw new Error("Unsupported journal mode")
  const dir = mkdtempSync(join(tmpdir(), "kb-connections space-"))
  let a, b
  try {
    a = openLedger(join(dir, "trips.sqlite"))
    const actual = a.prepare(`PRAGMA journal_mode=${mode}`).get().journal_mode
    if (actual !== mode.toLowerCase()) throw new Error(`Unexpected journal mode: ${actual}`)
    createWithTransaction(a, "合成行程", [100])
    b = openLedger(join(dir, "trips.sqlite"))
    for (const db of [a, b]) db.exec("PRAGMA busy_timeout=0")
    return run(a, b, dir)
  } finally {
    try {
      b?.close()
    } finally {
      try {
        a?.close()
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
  }
}

export function expectSqliteError(action, expected) {
  try {
    action()
  } catch (error) {
    if (!(error instanceof Error) || error.errcode !== expected) throw error
    return { errcode: error.errcode, message: error.message }
  }
  throw new Error(`Expected SQLite error ${expected}, but operation succeeded`)
}

export function writerContention(mode, finish = "COMMIT") {
  if (!["COMMIT", "ROLLBACK"].includes(finish)) throw new Error("Unsupported transaction finish")
  return withPair(mode, (a, b) => {
    a.exec("BEGIN IMMEDIATE")
    setAmount(a, 150)
    const ownUncommitted = amount(a)
    const otherBefore = amount(b)
    const blocked = expectSqliteError(() => b.exec("BEGIN IMMEDIATE"), 5)
    a.exec(finish)
    b.exec("BEGIN IMMEDIATE")
    const reread = amount(b)
    setAmount(b, reread + 25)
    b.exec("COMMIT")
    return { mode, finish, ownUncommitted, otherBefore, blocked, reread, final: amount(a) }
  })
}

export function readerBlocksCommit() {
  return withPair("DELETE", (a, b) => {
    b.exec("BEGIN")
    const before = amount(b)
    a.exec("BEGIN IMMEDIATE")
    setAmount(a, 150)
    const blocked = expectSqliteError(() => a.exec("COMMIT"), 5)
    const ownPending = amount(a)
    const readerStill = amount(b)
    b.exec("COMMIT")
    // The first COMMIT failed; this transaction is still active. Retry only COMMIT.
    a.exec("COMMIT")
    return { before, blocked, ownPending, readerStill, final: amount(b) }
  })
}

export function staleSnapshot() {
  return withPair("WAL", (a, b) => {
    b.exec("BEGIN")
    const before = amount(b)
    a.exec("BEGIN IMMEDIATE")
    setAmount(a, 150)
    a.exec("COMMIT")
    const readerStill = amount(b)
    const blocked = expectSqliteError(() => setAmount(b, 175), 517)
    // Waiting cannot make this historical snapshot current. Restart the transaction.
    b.exec("ROLLBACK")
    b.exec("BEGIN IMMEDIATE")
    const reread = amount(b)
    setAmount(b, reread + 25)
    b.exec("COMMIT")
    return { before, readerStill, blocked, reread, final: amount(a) }
  })
}
