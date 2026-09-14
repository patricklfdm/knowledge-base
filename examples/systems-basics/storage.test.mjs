import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, rmSync, openSync, closeSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { publishState } from "./file-publish.mjs"
import { appendRecord, encodeRecord, replay } from "./replay.mjs"
import { LocalCache, cacheRace } from "./cache.mjs"

function ownDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "kb-storage test-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
test("file replacement preserves old open descriptor and exposes new whole value by pathname", (t) => {
  const dir = ownDir(t), path = join(dir, "state.json")
  publishState(dir, { value: "old" })
  const old = openSync(path, "r")
  try {
    publishState(dir, { value: "new" })
    assert.deepEqual(JSON.parse(readFileSync(old, "utf8")), { value: "old" })
    assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), { value: "new" })
  } finally { closeSync(old) }
  assert.deepEqual(readdirSync(dir), ["state.json"])
})
test("pre-publication failure preserves old file; post-rename error has already exposed new state", (t) => {
  const dir = ownDir(t), path = join(dir, "state.json")
  publishState(dir, { value: 1 })
  for (const phase of ["before-rename", "after-rename"]) {
    assert.throws(() => publishState(dir, { value: 2 }, (p) => { if (p === phase) throw new Error(phase) }), new RegExp(phase))
    assert.equal(JSON.parse(readFileSync(path)).value, phase === "before-rename" ? 1 : 2)
  }
  assert.throws(() => publishState(dir, "x".repeat(4096)), /small JSON/)
  assert.deepEqual(readdirSync(dir), ["state.json"])
})
test("abrupt child exit before or after rename leaves the corresponding complete version", (t) => {
  for (const phase of ["before-rename", "after-rename"]) {
    const dir = ownDir(t)
    publishState(dir, { seq: 0, value: 10 })
    const child = spawnSync(process.execPath, [fileURLToPath(new URL("./publish-worker.mjs", import.meta.url)), dir, phase],
      { encoding: "utf8", timeout: 5000, env: {} })
    assert.ifError(child.error); assert.equal(child.status, 17, child.stderr)
    assert.deepEqual(JSON.parse(readFileSync(join(dir, "state.json"))), phase === "before-rename" ? { seq: 0, value: 10 } : { seq: 1, value: 20 })
    assert.equal(readdirSync(dir).some((name) => name.startsWith(".candidate-")), true)
  }
})
test("snapshot plus old or compacted log replays once; published snapshot survives reload", (t) => {
  const dir = ownDir(t), log = join(dir, "events.log")
  const records = [{ seq: 1, delta: 10 }, { seq: 2, delta: 5 }, { seq: 3, delta: 7 }]
  for (const r of records) appendRecord(log, r)
  const all = readFileSync(log, "utf8"), initial = { seq: 0, value: 0 }
  assert.deepEqual(replay(initial, all), { seq: 3, value: 22 })
  assert.deepEqual(initial, { seq: 0, value: 0 })
  publishState(dir, { seq: 2, value: 15 })
  const snapshot = JSON.parse(readFileSync(join(dir, "state.json")))
  assert.deepEqual(replay(snapshot, all), { seq: 3, value: 22 })
  assert.deepEqual(replay(snapshot, encodeRecord(records[2])), { seq: 3, value: 22 })
  assert.deepEqual(replay(snapshot, ""), snapshot)
})
test("replay rejects gaps, duplicates, truncated tails, malformed records and overflow", () => {
  const start = { seq: 0, value: 0 }, r = encodeRecord
  for (const bad of [r({ seq: 2, delta: 1 }), r({ seq: 1, delta: 1 }) + r({ seq: 1, delta: 1 }),
    r({ seq: 1, delta: 1 }) + r({ seq: 3, delta: 1 }), '{"seq":1', '{"seq":1,"delta":2}', 'bad\n', '{"seq":1,"delta":"2"}\n'])
    assert.throws(() => replay(start, bad))
  assert.throws(() => replay({ seq: 0, value: Number.MAX_SAFE_INTEGER }, r({ seq: 1, delta: 1 })), /unsafe total/)
  assert.throws(() => replay({ seq: -1, value: 0 }, ""), /invalid snapshot/)
  assert.throws(() => replay(start, "x".repeat(65537)), /log limit/)
})
test("discarding covered prefix before its snapshot exists is a detectable recovery gap", () => {
  const suffix = encodeRecord({ seq: 3, delta: 7 })
  assert.throws(() => replay({ seq: 0, value: 0 }, suffix), /gap/)
  assert.deepEqual(replay({ seq: 2, value: 15 }, suffix), { seq: 3, value: 22 })
})
test("late old read cannot refill invalidated cache, though its original caller still sees old value", async () => {
  assert.deepEqual(await cacheRace(), { oldCaller: "old", fresh: "new", cached: "new", size: 1 })
})
test("LRU capacity, undefined misses, loader errors and invalid values have explicit behavior", async () => {
  const cache = new LocalCache(2)
  const loads = []
  const load = async (key) => { loads.push(key); return key }
  await cache.read("a", load); await cache.read("b", load); await cache.read("a", load)
  await cache.read("c", load); await cache.read("b", load)
  assert.deepEqual(loads, ["a", "b", "c", "b"]); assert.equal(cache.size, 2)
  cache.invalidate("b"); assert.equal(cache.size, 1)
  await assert.rejects(cache.read("z", async () => { throw new Error("source failed") }), /source failed/)
  assert.equal(await cache.read("z", async () => "fixed"), "fixed")
  await assert.rejects(cache.read("object", async () => ({})), /scalar/)
  let missing = 0
  for (let i = 0; i < 2; i++) assert.equal(await cache.read("missing", async () => { missing++; return undefined }), undefined)
  assert.equal(missing, 2)
  assert.equal(await cache.read("empty", async () => ""), "")
  assert.equal(await cache.read("empty", async () => { throw new Error("must hit") }), "")
  for (const size of [0, -1, 1.5, 1001]) assert.throws(() => new LocalCache(size), /capacity/)
})
