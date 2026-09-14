import test from "node:test"
import assert from "node:assert/strict"
import { createLifecycle } from "./lifecycle.mjs"
import { rehearseRestore, rehearseShutdown } from "./operations.mjs"
import { errorBudget } from "./budget.mjs"
import { createRecorder } from "./observe.mjs"
test("draining denies new admission and waits for exactly existing work", async () => {
  const life = createLifecycle(); assert.equal(life.enter(), true); life.drain(); life.drain()
  assert.equal(life.enter(), false); assert.equal(life.active, 1)
  let idle = false; const waiting = life.idle().then(() => { idle = true })
  await Promise.resolve(); assert.equal(idle, false)
  life.leave(); await waiting; assert.equal(idle, true); assert.throws(() => life.leave())
})
test("SIGTERM rejects new work, completes admitted request and exits cleanly", { timeout: 20000 }, async () => {
  assert.deepEqual(await rehearseShutdown(), { mode: "graceful", readiness: 503, newWork: 503, admitted: 200, exit: 0 })
})
test("deadline-forced process exit is a failure, never graceful success", { timeout: 20000 }, async () => {
  assert.deepEqual(await rehearseShutdown(true), { mode: "forced", exit: 2, graceful: false })
})
test("live WAL backup restores in a new process with owner/revision and new write", async () => {
  assert.deepEqual(await rehearseRestore(), { restored: 2, ownership: true, writable: true })
})
test("structurally valid backup missing one owner's row fails business manifest", async () => {
  assert.deepEqual(await rehearseRestore(true), { incompleteDetected: true, structure: "ok" })
})
test("error budget uses exact count boundaries and treats empty traffic as unknown", () => {
  assert.equal(errorBudget({ eligible: 0, bad: 0 }).state, "unknown")
  assert.deepEqual(errorBudget({ eligible: 1000, bad: 1 }), { state: "within", allowedBad: 1, remaining: 0, goodRatio: 0.999 })
  assert.equal(errorBudget({ eligible: 1000, bad: 2 }).remaining, -1)
  assert.equal(errorBudget({ eligible: 1000, bad: 2 }).state, "exceeded")
  assert.equal(errorBudget({ eligible: 999, bad: 1 }).allowedBad, 0)
  assert.equal(errorBudget({ eligible: 1000, bad: 0 }, 10000).allowedBad, 0)
  for (const data of [{ eligible: 0, bad: 1 }, { eligible: -1, bad: 0 }, { eligible: 1.5, bad: 0 }]) assert.throws(() => errorBudget(data))
})
test("health and unmatched traffic cannot dilute defined business failures", () => {
  const r = createRecorder()
  const event = { requestId: "synthetic", method: "GET", durationMs: 0 }
  for (const [route, status] of [["/notes/:id", 200], ["/notes/:id", 500], ["/notes/:id", 412], ["/ready", 200], ["unmatched", 404]]) r.record({ ...event, route, status })
  assert.deepEqual(r.counts, { eligible: 3, bad: 1 })
  assert.equal(errorBudget(r.counts, 9900).state, "exceeded")
})
