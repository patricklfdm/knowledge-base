import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { openStore } from "./store.mjs"
// Caller supplies only its own newly copied rehearsal database and fixture manifest.
const [path, manifest] = process.argv.slice(2)
if (!path || !manifest) throw new Error("usage: restore-worker.mjs owned-copy manifest-json")
const expected = JSON.parse(manifest)
const db = new DatabaseSync(path, { readOnly: true })
let rows
try {
  assert.equal(db.prepare("PRAGMA user_version").get().user_version, 2)
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok")
  rows = db.prepare("SELECT id,owner,title,revision FROM notes ORDER BY id").all().map((row) => ({ ...row }))
  assert.deepEqual(rows, expected)
} finally { db.close() }
const restored = openStore(path)
try {
  for (const row of expected) assert.equal(restored.get(row.id, row.owner).title, row.title)
  assert.equal(restored.get(2, "alice"), undefined)
  assert.equal(restored.update(1, "alice", expected[0].revision, "恢复后可写"), true)
  assert.equal(restored.get(1, "alice").revision, expected[0].revision + 1)
} finally { restored.close() }
console.log(JSON.stringify({ restored: rows.length, ownership: true, writable: true }))
