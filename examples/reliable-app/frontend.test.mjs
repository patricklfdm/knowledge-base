import test from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { initialState, reducer, selectRows, createSelector } from "./web/state.mjs"
import { createLoader } from "./web/request.mjs"
import { Board } from "./web/view.mjs"
import { buildClient } from "./build.mjs"
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
test("reducer preserves prior snapshot and rejects unknown actions", () => {
  const before = Object.freeze({ ...initialState })
  const after = reducer(before, { type: "query", value: "海" })
  assert.notEqual(before, after); assert.equal(before.query, ""); assert.equal(after.query, "海")
  assert.equal(reducer(after, { type: "error" }).phase, "error")
  assert.throws(() => reducer(before, { type: "typo" }))
})
test("selection derives values including empty and case-insensitive query", () => {
  const rows = Object.freeze([{ id: 1, title: "Sea" }, { id: 2, title: "Hill" }])
  assert.deepEqual(selectRows(rows, " SEA "), [rows[0]])
  assert.equal(selectRows(rows, "").length, 2)
  assert.deepEqual(selectRows(rows, "none"), [])
})
test("single-entry cache skips identical work and invalidates both inputs", () => {
  let visits = 0; const select = createSelector(() => visits++)
  const rows = [{ id: 1, title: "Sea" }, { id: 2, title: "Hill" }]
  const first = select(rows, "Sea")
  assert.equal(select(rows, "Sea"), first); assert.equal(visits, 2)
  assert.equal(select(rows, "Hill")[0].id, 2); assert.equal(visits, 4)
  assert.equal(select([...rows, { id: 3, title: "Hill" }], "Hill").length, 2); assert.equal(visits, 7)
})
test("late old success cannot overwrite newer result even if read ignores abort", async () => {
  const a = deferred(), b = deferred(), events = [], signals = []
  const jobs = [a, b]
  const loader = createLoader((signal) => { signals.push(signal); return jobs.shift().promise }, (e) => events.push(e))
  const first = loader.load(), second = loader.load()
  assert.equal(signals[0].aborted, true)
  b.resolve([{ id: 2 }]); await second
  a.resolve([{ id: 1 }]); await first
  assert.deepEqual(events.map((e) => e.type), ["loading", "loading", "success"])
  assert.deepEqual(events.at(-1).rows, [{ id: 2 }])
})
test("cleanup suppresses late failure and allows a subsequent setup", async () => {
  const a = deferred(), events = []
  let calls = 0
  const loader = createLoader(() => ++calls === 1 ? a.promise : Promise.resolve([]), (e) => events.push(e))
  const first = loader.load(); loader.cancel(); a.reject(new Error("late")); await first
  assert.deepEqual(events.map((e) => e.type), ["loading"])
  await loader.load(); assert.equal(events.at(-1).type, "success")
})
test("current failure is visible and retry clears error through reducer", async () => {
  let state = initialState, fail = true
  const loader = createLoader(async () => { if (fail) throw new Error("private"); return [] }, (e) => { state = reducer(state, e) })
  await loader.load(); assert.equal(state.phase, "error"); assert.ok(!state.error.includes("private"))
  fail = false; await loader.load(); assert.equal(state.phase, "success"); assert.equal(state.error, "")
})
function render(state, rows = []) { return renderToStaticMarkup(createElement(Board, { state, rows, onQuery() {}, onReload() {} })) }
function assertForm(html) {
  assert.match(html, /<label for="query">筛选标题<\/label>/)
  assert.match(html, /<input[^>]*id="query"[^>]*aria-describedby="query-help"/)
  assert.match(html, /id="query-help"/); assert.match(html, /role="status"/)
}
test("SSR has associations, busy and error text; deliberately missing label fails", () => {
  const html = render({ ...initialState, phase: "loading" })
  assertForm(html); assert.match(html, /disabled=""/); assert.match(html, /aria-busy="true"/)
  assert.throws(() => assertForm(html.replace('for="query"', 'for="missing"')))
  assert.match(render({ ...initialState, error: "读取失败", phase: "error" }), /role="alert">读取失败/)
  assert.match(render({ ...initialState, phase: "success" }), /找到 0 条/)
})
test("SSR treats a title as text, not injected markup", () => {
  const html = render(initialState, [{ id: 1, title: "<script>bad()</script>" }])
  assert.ok(!html.includes("<script>")); assert.match(html, /&lt;script&gt;/)
})
test("real browser-target bundle and HTML build in owned temporary directory", async () => {
  const output = await buildClient()
  try {
    const js = await readFile(join(output, "app.js"), "utf8")
    assert.ok(js.length > 1000); assert.ok(!js.includes('from "react"'))
    assert.match(await readFile(join(output, "index.html"), "utf8"), /src="\.\/app.js"/)
  } finally { await rm(output, { recursive: true, force: true }) }
})
