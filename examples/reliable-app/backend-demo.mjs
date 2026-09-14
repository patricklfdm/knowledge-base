import assert from "node:assert/strict"
import { createSessions } from "./session.mjs"
import { openStore } from "./store.mjs"
import { startService } from "./server.mjs"
const store = openStore(); store.seed(); const sessions = createSessions()
const service = await startService({ store, sessions })
try {
  const token = sessions.issueFixture("alice")
  const headers = { authorization: `Bearer ${token}` }
  const own = await fetch(service.url + "/notes/1", { headers })
  assert.equal(own.status, 200)
  const denied = await fetch(service.url + "/notes/2", { headers }); assert.equal(denied.status, 404)
  const put = () => fetch(service.url + "/notes/1", { method: "PUT", headers: { ...headers, "content-type": "application/json", "if-match": own.headers.get("etag") }, body: JSON.stringify({ title: "更新" }) })
  assert.equal((await put()).status, 200); assert.equal((await put()).status, 412)
  console.log(JSON.stringify({ own: 200, otherOwner: 404, update: 200, stale: 412, revision: store.get(1, "alice").revision }))
} finally { await service.close(); store.close() }
