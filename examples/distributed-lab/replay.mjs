import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { producer, consumer } from "./outbox.mjs"
export async function rehearseReplay(fault = "after-consume") {
  if (!["before-consume", "after-consume"].includes(fault)) throw new TypeError("invalid rehearsal")
  const dir = await mkdtemp(join(tmpdir(), "kb-outbox-replay-")), a = join(dir, "source.sqlite"), b = join(dir, "target.sqlite")
  try {
    const source = producer(a); try { source.create("海边") } finally { source.close() }
    const run = (mode) => {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL("./relay-worker.mjs", import.meta.url)), a, b, mode], { encoding: "utf8", timeout: 10000 })
      assert.ifError(result.error); return result
    }
    const stopped = run(fault); assert.equal(stopped.status, fault === "before-consume" ? 31 : 32)
    const pending = producer(a), received = consumer(b)
    try { assert.ok(pending.next()); assert.equal(received.count(), fault === "before-consume" ? 0 : 1) }
    finally { pending.close(); received.close() }
    const replayed = run("none"); assert.equal(replayed.status, 0, replayed.stderr)
    const replayResult = JSON.parse(replayed.stdout); assert.equal(replayResult.applied, fault === "before-consume")
    const empty = run("none"); assert.equal(empty.status, 0, empty.stderr); assert.deepEqual(JSON.parse(empty.stdout), { empty: true })
    const final = producer(a), consumed = consumer(b)
    try { assert.equal(final.next(), undefined); assert.equal(consumed.count(), 1) }
    finally { final.close(); consumed.close() }
    return { fault, interruptedExit: stopped.status, replayApplied: replayResult.applied, effects: 1, pending: 0 }
  } finally { await rm(dir, { recursive: true, force: true }) }
}
