import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { producer, consumer } from "./outbox.mjs"
import { rehearseReplay } from "./replay.mjs"
import { replica, NotCaughtUp } from "./replica.mjs"
import { fencedResource } from "./fence.mjs"
test("outbox transaction failure leaves neither note nor pending event", () => {
  const a = producer()
  try { assert.throws(() => a.create("海边", () => { throw new Error("injected") })); assert.equal(a.next(), undefined); assert.equal(a.db.prepare("SELECT count(*) n FROM notes").get().n, 0); a.create("海边"); assert.equal(a.next().id, "producer-a:1") }
  finally { a.close() }
})
test("consumer dedup and local effect share rollback; identity conflict is rejected", () => {
  const b = consumer(), event = { id: "producer-a:1", title: "海边" }
  try {
    assert.throws(() => b.apply(event, () => { throw new Error("injected") })); assert.equal(b.count(), 0); assert.equal(b.db.prepare("SELECT count(*) n FROM inbox").get().n, 0)
    assert.equal(b.apply(event), true); assert.equal(b.apply(event), false); assert.equal(b.count(), 1)
    assert.throws(() => b.apply({ ...event, title: "changed" }), /conflict/); assert.equal(b.count(), 1)
  } finally { b.close() }
})
for (const fault of ["before-consume", "after-consume"]) test(`real relay process exits ${fault}; restart delivers one effect`, async () => {
  const result = await rehearseReplay(fault); assert.equal(result.effects, 1); assert.equal(result.pending, 0)
})
test("lagging replica returns old state by default but refuses a minimum version", () => {
  const a = replica(), b = replica(), first = { sequence: 1, id: 1, title: "old" }, second = { sequence: 2, id: 1, title: "new" }
  a.apply(first); b.apply(first); a.apply(second)
  assert.equal(b.read().rows[0].title, "old"); assert.throws(() => b.read(2), NotCaughtUp)
  b.apply(second); assert.deepEqual(b.read(2), a.read(2))
})
test("replica rejects gaps and conflicting duplicates without advancing progress", () => {
  const r = replica(), event = { sequence: 1, id: 1, title: "one" }
  assert.throws(() => r.apply({ ...event, sequence: 2 }), /gap/); assert.equal(r.read().applied, 0)
  assert.equal(r.apply(event), true); assert.equal(r.apply({ ...event }), false)
  assert.throws(() => r.apply({ ...event, title: "changed" }), /conflict/); assert.equal(r.read().applied, 1)
  assert.throws(() => r.read(-1), TypeError)
})
test("session minimum must be carried when switching to another replica", () => {
  const a = replica(), b = replica(); a.apply({ sequence: 1, id: 1, title: "seen" })
  const token = a.read().applied
  assert.equal(b.read().rows.length, 0); assert.throws(() => b.read(token), NotCaughtUp)
})
test("resource rejects stale epoch and preserves accepted value", () => {
  const resource = fencedResource()
  try {
    assert.equal(resource.write(1, "old-holder"), true); assert.equal(resource.write(1, "still-accepted-before-new-epoch"), true); assert.equal(resource.write(2, "new-holder"), true)
    assert.equal(resource.write(1, "late-old-holder"), false); assert.deepEqual(resource.read(), { epoch: 2, value: "new-holder" })
    assert.equal(resource.write(2, "same-holder"), true); assert.throws(() => resource.write(0, "bad"), TypeError)
  } finally { resource.close() }
})
test("fence survives new connection; rolling back its storage is outside the guarantee", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kb-fence-")), path = join(dir, "resource.sqlite")
  let resource = fencedResource(path)
  try { resource.write(7, "current"); resource.close(); resource = fencedResource(path); assert.equal(resource.write(6, "stale"), false); assert.equal(resource.read().epoch, 7) }
  finally { resource.close(); await rm(dir, { recursive: true, force: true }) }
})
