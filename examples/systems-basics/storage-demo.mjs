import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { publishState } from "./file-publish.mjs"
import { appendRecord, replay } from "./replay.mjs"
import { cacheRace } from "./cache.mjs"
const dir = mkdtempSync(join(tmpdir(), "kb-storage space-"))
try {
  const log = join(dir, "events.log")
  appendRecord(log, { seq: 1, delta: 10 })
  appendRecord(log, { seq: 2, delta: 5 })
  const snapshot = replay({ seq: 0, value: 0 }, readFileSync(log, "utf8"))
  publishState(dir, snapshot)
  appendRecord(log, { seq: 3, delta: 7 })
  const stored = JSON.parse(readFileSync(join(dir, "state.json"), "utf8"))
  console.log("recovered", JSON.stringify(replay(stored, readFileSync(log, "utf8"))))
  try { publishState(dir, { seq: 99, value: 99 }, () => { throw new Error("before publication") }) }
  catch (error) { if (error.message !== "before publication") throw error }
  console.log("snapshotPreserved", readFileSync(join(dir, "state.json"), "utf8"))
} finally { rmSync(dir, { recursive: true, force: true }) }
console.log("cache", JSON.stringify(await cacheRace()))
