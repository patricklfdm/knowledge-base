import { createServer } from "node:http"
import { randomUUID } from "node:crypto"
import { performance } from "node:perf_hooks"
import { DeadlineError, withDeadline, createRecorder } from "./observe.mjs"
import { createLifecycle } from "./lifecycle.mjs"
class InputError extends Error { constructor(status) { super("input"); this.status = status } }
async function titleFrom(req) {
  if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers["content-type"] ?? "")) throw new InputError(415)
  let bytes = 0, chunks = []
  for await (const chunk of req) { bytes += chunk.length; if (bytes <= 1024) chunks.push(chunk) }
  if (bytes > 1024) throw new InputError(413)
  let data
  try { data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) } catch { throw new InputError(400) }
  if (!data || Array.isArray(data) || typeof data !== "object" || Object.keys(data).length !== 1 || typeof data.title !== "string" || !data.title.trim() || data.title.length > 80) throw new InputError(422)
  return data.title.trim()
}
export async function startService({ store, sessions, recorder = createRecorder(), readDependency = async () => {}, deadlineMs = 1000 }) {
  const life = createLifecycle()
  let closing
  const server = createServer(async (req, res) => {
    const started = performance.now(), requestId = randomUUID()
    const match = /^\/notes\/([1-9][0-9]{0,8})(?:\?.*)?$/.exec(req.url ?? "")
    const route = match ? "/notes/:id" : req.url === "/ready" ? "/ready" : "unmatched"
    const method = ["GET", "PUT"].includes(req.method) ? req.method : "OTHER"
    res.on("finish", () => recorder.record({ requestId, route, method, status: res.statusCode, durationMs: Math.max(0, performance.now() - started) }))
    function send(status, data, headers = {}) {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-request-id": requestId, ...headers })
      res.end(JSON.stringify(data))
    }
    let admitted = false
    try {
      if (route === "/ready" && method === "GET") return send(life.draining ? 503 : 200, { ready: !life.draining })
      if (!match) return send(404, { error: "not found" })
      if (!["GET", "PUT"].includes(method)) return send(405, { error: "method" }, { allow: "GET, PUT" })
      if (!life.enter()) return send(503, { error: "draining" })
      admitted = true
      const owner = sessions.authenticate(req.headers.authorization)
      if (!owner) return send(401, { error: "unauthenticated" }, { "www-authenticate": 'Bearer realm="synthetic-notes"' })
      const id = Number(match[1])
      if (!store.get(id, owner)) return send(404, { error: "not found" })
      if (method === "GET") {
        await withDeadline(readDependency, deadlineMs)
        const row = store.get(id, owner)
        return send(200, row, { etag: `"${row.revision}"` })
      }
      const tag = req.headers["if-match"]
      if (!tag) return send(428, { error: "revision required" })
      // Application subset: exactly one strong decimal tag, no wildcard/list.
      if (!/^"[1-9][0-9]{0,8}"$/.test(tag)) return send(400, { error: "revision format" })
      const title = await titleFrom(req)
      if (!store.update(id, owner, Number(tag.slice(1, -1)), title)) return send(412, { error: "stale revision" })
      const row = store.get(id, owner)
      return send(200, row, { etag: `"${row.revision}"` })
    } catch (error) {
      send(error instanceof InputError ? error.status : error instanceof DeadlineError ? 504 : 500, { error: error instanceof InputError ? "invalid input" : "temporarily unavailable" })
    } finally { if (admitted) life.leave() }
  })
  server.requestTimeout = 5000
  server.headersTimeout = 5000
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    server, recorder, life, url: `http://127.0.0.1:${server.address().port}`,
    beginDrain() { life.drain() },
    close() {
      life.drain()
      closing ??= life.idle().then(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
        server.closeIdleConnections()
      }))
      return closing
    },
  }
}
