import { DatabaseSync, backup } from "node:sqlite"
import { mkdtempSync, copyFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { openLedger, createWithTransaction } from "./ledger.mjs"

export function verifyRestore(path) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const integrity = db.prepare("PRAGMA integrity_check").get().integrity_check
    const foreign = db.prepare("PRAGMA foreign_key_check").all()
    const rows = db.prepare("SELECT amount_cents FROM expenses ORDER BY id").all().map((r) => r.amount_cents)
    if (integrity !== "ok" || foreign.length) throw new Error("restore integrity failed")
    return { integrity, rows }
  } finally { db.close() }
}

export async function backupDemo() {
  const dir = mkdtempSync(join(tmpdir(), "kb-backup space-"))
  const source = join(dir, "source.sqlite")
  let db
  try {
    db = openLedger(source)
    db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;")
    createWithTransaction(db, "山城", [100])
    const checkpoint = db.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get()
    if (checkpoint.busy !== 0) throw new Error("fixture checkpoint busy")
    db.prepare("INSERT INTO expenses(journey_id,amount_cents) VALUES (1,200)").run()
    // Controlled wrong contrast: main file only, while the newer commit remains in WAL.
    const wrong = join(dir, "main-only.sqlite")
    copyFileSync(source, wrong)
    const stale = verifyRestore(wrong)
    const target = join(dir, "backup.sqlite")
    await backup(db, target)
    const restored = verifyRestore(target)
    const child = spawnSync(process.execPath, ["--input-type=module", "-e",
      `import { verifyRestore } from ${JSON.stringify(import.meta.url)};
       console.log(JSON.stringify(verifyRestore(process.argv[1])));`, target],
      { encoding: "utf8", timeout: 10000 })
    if (child.error) throw child.error
    if (child.status !== 0) throw new Error(child.stderr)
    // Invalid destination is confined to our own directory; failure must not harm source.
    let rejected = false
    try { await backup(db, join(dir, "missing", "bad.sqlite")) }
    catch { rejected = true }
    if (!rejected) throw new Error("invalid backup destination accepted")
    return { stale, restored, child: JSON.parse(child.stdout), rejected,
      sourceRows: db.prepare("SELECT COUNT(*) AS n FROM expenses").get().n }
  } finally {
    try { db?.close() } finally { rmSync(dir, { recursive: true, force: true }) }
  }
}
