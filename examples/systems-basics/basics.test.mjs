import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { prepare, lowerBound, linearBound, searchDemo } from "./search.mjs"
import { processFixture, readReply } from "./processes.mjs"
import { decodeChunks, backpressureDemo } from "./streams.mjs"

test("lower bound finds first equal or insertion point, including empty and singleton", () => {
  for (const values of [[], [2], [1, 2, 2, 5], [-8, -1, 0, 9]]) {
    const data = prepare(values)
    for (const target of [-9, -1, 0, 1, 2, 3, 9, 10]) {
      let expected = values.findIndex((x) => x >= target)
      if (expected < 0) expected = values.length
      assert.equal(lowerBound(data, target).index, expected)
      assert.equal(linearBound(data, target).index, expected)
    }
  }
})
test("preparation copies/sorts input; rejects non-finite data and query", () => {
  const original = [5, 1, 2]
  const sorted = prepare(original)
  assert.deepEqual(original, [5, 1, 2]); assert.deepEqual(sorted, [1, 2, 5])
  assert.throws(() => sorted.push(6), TypeError)
  for (const value of [NaN, Infinity, "1"]) assert.throws(() => prepare([value]), TypeError)
  assert.throws(() => lowerBound(sorted, NaN), TypeError)
})
test("operation counts are deterministic evidence, not elapsed-time speed claims", () => {
  assert.deepEqual(searchDemo(), [
    { n: 16, target: 32, linear: { index: 16, probes: 16 }, binary: { index: 16, probes: 4 } },
    { n: 1024, target: 2048, linear: { index: 1024, probes: 1024 }, binary: { index: 1024, probes: 10 } },
  ])
})
test("child cwd/env/stdin/argument are explicit and do not change the parent", () => {
  const cwd = process.cwd(), before = process.env.KB_DEMO_NAME
  const f = processFixture()
  try {
    const literal = "text; $(printf NOT_EXECUTED)"
    const data = readReply(f.run("echo", literal))
    // macOS may resolve /var to /private/var; compare contents and parent isolation.
    assert.equal(data.file, "合成内容"); assert.equal(data.name, "child-only")
    assert.deepEqual(data.input, { days: 3 }); assert.equal(data.argument, literal)
    assert.notEqual(data.pid, process.pid)
    assert.equal(process.cwd(), cwd); assert.equal(process.env.KB_DEMO_NAME, before)
  } finally { f.close() }
  assert.equal(existsSync(f.dir), false)
})
test("nonzero exit, invalid protocol and timeout cannot be reported as success", () => {
  const f = processFixture()
  try {
    const bad = f.run("fail")
    assert.equal(bad.status, 2); assert.equal(bad.stdout, ""); assert.match(bad.stderr, /synthetic/)
    assert.throws(() => readReply(bad), /child failed/)
    assert.throws(() => readReply(f.run("partial")), SyntaxError)
    const timeout = f.run("wait", "", 100)
    assert.equal(timeout.error?.code, "ETIMEDOUT"); assert.notEqual(timeout.status, 0)
    assert.throws(() => readReply(timeout), (e) => e.code === "ETIMEDOUT")
  } finally { f.close() }
})
test("streaming UTF-8 decoder survives every split position, including empty chunks", async () => {
  const bytes = Buffer.from("山城🙂\n")
  for (let i = 0; i <= bytes.length; i++)
    assert.equal(await decodeChunks([bytes.subarray(0, i), bytes.subarray(i)]), "山城🙂\n")
  assert.equal(await decodeChunks([]), "")
  assert.notEqual([...bytes].map((b) => Buffer.from([b]).toString("utf8")).join(""), "山城🙂\n")
})
test("bad/truncated UTF-8, byte overflow and downstream failure reject the pipeline", async () => {
  await assert.rejects(decodeChunks([Buffer.from([0xc3, 0x28])]), TypeError)
  await assert.rejects(decodeChunks([Buffer.from([0xe5])]), TypeError)
  assert.equal(await decodeChunks([Buffer.from("abc")], 3), "abc")
  await assert.rejects(decodeChunks([Buffer.from("abcd")], 3), /byte limit/)
  await assert.rejects(decodeChunks([Buffer.from("abc")], 3, true), /sink failure/)
})
test("write false requests waiting for drain; completed sink is explicitly observed", async () => {
  assert.deepEqual(await backpressureDemo(), { accepted: false, queued: 4, ended: true })
})
