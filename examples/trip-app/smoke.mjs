import assert from "node:assert/strict"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
export async function smoke(baseUrl) {
  const base = new URL(baseUrl)
  if (base.protocol !== "http:" || base.hostname !== "127.0.0.1")
    throw new Error("仅允许本机教学服务")
  for (const [path, type, marker] of [
    ["/", "text/html", 'id="trip-form"'],
    ["/app.js", "javascript", "createController"],
  ]) {
    const r = await fetch(new URL(path, base), { signal: AbortSignal.timeout(5000) })
    assert.equal(r.status, 200)
    assert.ok(r.headers.get("content-type")?.includes(type))
    assert.ok((await r.text()).includes(marker))
  }
  const r = await fetch(new URL("/api/trips", base), { signal: AbortSignal.timeout(5000) })
  assert.equal(r.status, 200)
  const rows = await r.json()
  assert.ok(Array.isArray(rows))
  return { pages: 2, rows: rows.length }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error("需要serve打印的URL")
  console.log("HTTP smoke", JSON.stringify(await smoke(process.argv[2])))
}
