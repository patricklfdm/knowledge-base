import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  openLedger,
  createWithTransaction,
  createWithoutTransaction,
  totalsSql,
} from "./ledger.mjs"

const dir = mkdtempSync(join(tmpdir(), "kb-ledger space-"))
try {
  for (const [label, create] of [
    ["无事务", createWithoutTransaction],
    ["有事务", createWithTransaction],
  ]) {
    const db = openLedger(join(dir, `${label}.sqlite`))
    try {
      try {
        create(db, "山城", [100, -1])
      } catch (error) {
        if (!/CHECK constraint failed/.test(error.message)) throw error
        console.log(`${label}：第二条费用被CHECK拒绝`)
      }
      console.log(label, JSON.stringify(db.prepare(totalsSql).all()))
    } finally {
      db.close()
    }
  }
  const file = join(dir, "success.sqlite")
  const db = openLedger(file)
  try {
    createWithTransaction(db, "山城", [100, 200])
    createWithTransaction(db, "海湾", [5000])
    createWithTransaction(db, "雪原", [])
    console.log("汇总", JSON.stringify(db.prepare(totalsSql).all()))
  } finally {
    db.close()
  }
  const reopened = openLedger(file)
  try {
    console.log("重开条数", reopened.prepare("SELECT COUNT(*) AS n FROM journeys").get().n)
  } finally {
    reopened.close()
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
