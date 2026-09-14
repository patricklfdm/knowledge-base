import test from "node:test"
import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { createSessions } from "./session.mjs"
import { openStore, migrate } from "./store.mjs"
import { startService } from "./server.mjs"
import { withDeadline, DeadlineError, createRecorder } from "./observe.mjs"
async function fixture(t, options = {}) {
  const store = openStore(); store.seed(); const sessions = createSessions()
  const service = await startService({ store, sessions, ...options })
  t.after(async () => { await service.close(); store.close() })
  const token = sessions.issueFixture("alice"), bob = sessions.issueFixture("bob")
  const call = (path = "/notes/1", headers = {}, extra = {}) => fetch(service.url + path, { headers: { authorization: `Bearer ${token}`, ...headers }, ...extra })
  return { store, sessions, service, token, bob, call }
}
test("session validates opaque fixture, expiry boundary and revocation", () => {
  let now = 100; const sessions = createSessions(() => now)
  const a = sessions.issueFixture("alice", 10), b = sessions.issueFixture("alice", 20)
  assert.notEqual(a, b); assert.equal(sessions.authenticate(`Bearer ${a}`), "alice")
  for (const header of [undefined, "Bearer alice", `Basic ${a}`, `Bearer ${a} junk`]) assert.equal(sessions.authenticate(header), null)
  now = 110; assert.equal(sessions.authenticate(`Bearer ${a}`), null)
  sessions.revoke(b); assert.equal(sessions.authenticate(`Bearer ${b}`), null)
  assert.throws(() => sessions.issueFixture("unknown"))
})
test("HTTP requires session and checks owner on read and write", async (t) => {
  const f = await fixture(t)
  assert.equal((await f.call()).status, 200)
  assert.equal((await f.call("/notes/1", { authorization: "" })).status, 401)
  assert.equal((await f.call("/notes/1", { authorization: `Bearer ${f.bob}` })).status, 404)
  const denied = await f.call("/notes/2", { "if-match": '"1"', "content-type": "application/json" }, { method: "PUT", body: JSON.stringify({ title: "stolen" }) })
  assert.equal(denied.status, 404); assert.equal(f.store.get(2, "bob").title, "山间")
  f.sessions.revoke(f.token); assert.equal((await f.call()).status, 401)
})
test("two clients sharing revision cannot silently overwrite; reread enables correction", async (t) => {
  const f = await fixture(t)
  const first = await f.call(), second = await f.call()
  assert.equal(first.headers.get("etag"), '"1"'); assert.equal(second.headers.get("etag"), '"1"')
  const put = (tag, title) => f.call("/notes/1", { "if-match": tag, "content-type": "application/json" }, { method: "PUT", body: JSON.stringify({ title }) })
  assert.equal((await put('"1"', "new")).status, 200)
  assert.equal((await put('"1"', "lost")).status, 412)
  assert.equal(f.store.get(1, "alice").title, "new")
  assert.equal((await put('"2"', "merged")).status, 200); assert.equal(f.store.get(1, "alice").revision, 3)
})
test("conditional update rejects absent/weak tags, unknown owner field and oversized body", async (t) => {
  const f = await fixture(t)
  const put = (headers, body) => f.call("/notes/1", { "content-type": "application/json", ...headers }, { method: "PUT", body })
  assert.equal((await put({}, '{}')).status, 428)
  for (const tag of ['W/"1"', '*', '"1", "2"']) assert.equal((await put({ "if-match": tag }, '{}')).status, 400)
  assert.equal((await put({ "if-match": '"1"' }, '{bad')).status, 400)
  assert.equal((await put({ "if-match": '"1"' }, '{"title":"x","owner":"bob"}')).status, 422)
  assert.equal((await put({ "if-match": '"1"' }, 'x'.repeat(2048))).status, 413)
  assert.equal(f.store.get(1, "alice").revision, 1)
})
test("migration preserves v1 data; failure rolls back column and schema version", () => {
  const db = new DatabaseSync(":memory:")
  try {
    db.exec("CREATE TABLE notes(id INTEGER PRIMARY KEY,owner TEXT NOT NULL,title TEXT NOT NULL) STRICT; INSERT INTO notes VALUES(1,'alice','kept'); PRAGMA user_version=1")
    assert.throws(() => migrate(db, () => { throw new Error("injected") }))
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 1)
    assert.ok(!db.prepare("PRAGMA table_info(notes)").all().some((c) => c.name === "revision"))
    migrate(db); migrate(db)
    assert.equal(db.prepare("SELECT revision FROM notes").get().revision, 1)
    assert.equal(db.prepare("SELECT title FROM notes").get().title, "kept")
    db.exec("PRAGMA user_version=3"); assert.throws(() => migrate(db), /unsupported/)
  } finally { db.close() }
})
test("deadline aborts cooperative work and does not turn failure into success", async () => {
  let signal
  await assert.rejects(withDeadline((s) => { signal = s; return new Promise(() => {}) }, 10), DeadlineError)
  assert.equal(signal.aborted, true)
  assert.equal(await withDeadline(async () => 7, 1000), 7)
  await assert.rejects(withDeadline(async () => { throw new Error("failure") }, 1000), /failure/)
})
test("real HTTP failures carry request id, bounded safe logs and correct bad count", async (t) => {
  const f = await fixture(t, { readDependency: async () => { throw new Error("SECRET-error") } })
  const res = await f.call("/notes/1?private=SECRET-query", { "x-extra": "SECRET-header" })
  assert.equal(res.status, 500); assert.ok(!(await res.text()).includes("SECRET"))
  const event = f.service.recorder.events.at(-1)
  assert.equal(event.requestId, res.headers.get("x-request-id"))
  assert.equal(event.route, "/notes/:id"); assert.equal(event.status, 500)
  assert.deepEqual(Object.keys(event).sort(), ["durationMs", "method", "requestId", "route", "status"])
  assert.ok(!JSON.stringify(event).includes("SECRET")); assert.ok(!JSON.stringify(event).includes(f.token))
  assert.deepEqual(f.service.recorder.counts, { eligible: 1, bad: 1 })
  assert.equal((await f.call("/ready")).status, 200)
  assert.deepEqual(f.service.recorder.counts, { eligible: 1, bad: 1 })
  const r = createRecorder(); for (let i = 0; i < 150; i++) r.record({ requestId: String(i), route: "/notes/:id", method: "GET", status: 200, durationMs: 0 })
  assert.equal(r.events.length, 100); assert.equal(r.counts.eligible, 150)
})
test("dependency exceeding budget returns HTTP504", async (t) => {
  const f = await fixture(t, { readDependency: () => new Promise(() => {}), deadlineMs: 10 })
  assert.equal((await f.call()).status, 504); assert.equal(f.service.recorder.counts.bad, 1)
})
