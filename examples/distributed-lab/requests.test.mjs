import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openLedger, Conflict } from "./ledger.mjs"
import { deliver, UnknownOutcome } from "./transport.mjs"
import { retry, RetryBudgetExceeded } from "./retry.mjs"
test("identical caller observation can mean zero or one side effect", () => {
  for (const [fault, expected] of [["request-lost", 0], ["response-lost", 1]]) {
    let count = 0
    assert.throws(() => deliver(() => ++count, fault), UnknownOutcome); assert.equal(count, expected)
  }
  assert.equal(deliver(() => 7), 7); assert.throws(() => deliver(() => 1, "typo"))
})
test("unprotected repeat duplicates; stable key replays one transaction result", () => {
  let count = 0; assert.throws(() => deliver(() => ++count, "response-lost")); deliver(() => ++count); assert.equal(count, 2)
  const ledger = openLedger()
  try {
    assert.throws(() => deliver(() => ledger.create("alice", "req-1", "海边"), "response-lost"))
    assert.deepEqual(ledger.create("alice", "req-1", "海边"), { id: 1, title: "海边" }); assert.equal(ledger.count(), 1)
  } finally { ledger.close() }
})
test("key binds normalized intent and owner, not just matching payload", () => {
  const ledger = openLedger()
  try {
    const first = ledger.create("alice", "a", "海边")
    assert.deepEqual(ledger.create("alice", "a", " 海边 "), first)
    assert.throws(() => ledger.create("alice", "a", "山间"), Conflict)
    ledger.create("alice", "b", "海边"); ledger.create("bob", "a", "海边")
    assert.equal(ledger.count(), 3)
    assert.throws(() => ledger.create("alice", "a", ""), TypeError)
  } finally { ledger.close() }
})
test("failure between effect and receipt rolls back both", () => {
  const ledger = openLedger()
  try {
    assert.throws(() => ledger.create("alice", "a", "海边", () => { throw new Error("injected") }))
    assert.equal(ledger.count(), 0); assert.equal(ledger.db.prepare("SELECT count(*) n FROM requests").get().n, 0)
    ledger.create("alice", "a", "海边"); assert.equal(ledger.count(), 1)
  } finally { ledger.close() }
})
test("receipt survives closing connection and reopening the owned file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kb-request-ledger-")), file = join(dir, "ledger.sqlite")
  let ledger = openLedger(file)
  try {
    const first = ledger.create("alice", "a", "海边"); ledger.close(); ledger = openLedger(file)
    assert.deepEqual(ledger.create("alice", "a", "海边"), first); assert.equal(ledger.count(), 1)
  } finally { ledger.close(); await rm(dir, { recursive: true, force: true }) }
})
function clock() { let time = 0; const waits = []; return { waits, now: () => time, sleep: async (ms) => { waits.push(ms); time += ms }, advance: (ms) => { time += ms } } }
test("retry reuses intent across lost replies and has predictable injected jitter", async () => {
  const c = clock(), ledger = openLedger(); let attempts = 0
  try {
    const result = await retry(() => { attempts++; return deliver(() => ledger.create("alice", "stable", "海边"), attempts < 3 ? "response-lost" : "none") }, { ...c, random: () => 0.5, retryable: (e) => e instanceof UnknownOutcome })
    assert.equal(result.id, 1); assert.equal(ledger.count(), 1); assert.equal(attempts, 3); assert.deepEqual(c.waits, [5, 10])
  } finally { ledger.close() }
})
test("permanent error and max attempts stop without extra waits", async () => {
  for (const permanent of [true, false]) {
    const c = clock(); let attempts = 0
    await assert.rejects(retry(() => { attempts++; throw new Error("fail") }, { ...c, random: () => 0.5, retryable: () => !permanent }), /fail/)
    assert.equal(attempts, permanent ? 1 : 3); assert.equal(c.waits.length, permanent ? 0 : 2)
  }
})
test("elapsed operation and waiting consume one overall budget", async () => {
  const c = clock(); let attempts = 0
  await assert.rejects(retry(({ remainingMs }) => { attempts++; assert.equal(remainingMs, 10); c.advance(8); throw new UnknownOutcome() }, { ...c, budgetMs: 10, random: () => 0.5, retryable: () => true }), RetryBudgetExceeded)
  assert.equal(attempts, 1); assert.deepEqual(c.waits, [])
})
test("invalid retry policy/random rejected; scheduler passes decreasing remaining budget", async () => {
  const c = clock(), budgets = []
  await retry(({ remainingMs, attempt }) => { budgets.push(remainingMs); if (attempt === 1) throw new UnknownOutcome(); return 1 }, { ...c, random: () => 0.5, retryable: () => true })
  assert.deepEqual(budgets, [100, 95])
  await assert.rejects(retry(() => 1, { ...c, maxAttempts: 0 }), TypeError)
  await assert.rejects(retry(() => { throw new Error() }, { ...c, random: () => 1, retryable: () => true }), TypeError)
})
