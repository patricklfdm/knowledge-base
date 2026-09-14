import assert from "node:assert/strict"
import { openLedger } from "./ledger.mjs"
import { deliver, UnknownOutcome } from "./transport.mjs"
import { retry } from "./retry.mjs"
const ledger = openLedger(); let time = 0, attempts = 0
try {
  const result = await retry(() => { attempts++; return deliver(() => ledger.create("alice", "one-intent", "海边"), attempts === 1 ? "response-lost" : "none") }, { now: () => time, sleep: async (ms) => { time += ms }, random: () => 0.5, retryable: (e) => e instanceof UnknownOutcome })
  assert.equal(ledger.count(), 1)
  console.log(JSON.stringify({ attempts, rows: ledger.count(), result, simulatedWaitMs: time }))
} finally { ledger.close() }
