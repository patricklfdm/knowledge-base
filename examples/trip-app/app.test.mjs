import { request as rawRequest } from "node:http"
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"
import { startApp } from "./server.mjs"
import { launch } from "./process.mjs"
import { createClient } from "./web/client.js"
import { createController } from "./web/controller.js"
import { parseTripFields } from "./web/fields.js"
const options = { timeout: 15000 }
function database(t) {
  const dir = mkdtempSync(join(tmpdir(), "kb-app-test space-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return join(dir, "trips.sqlite")
}
async function fixture(t) {
  const path = database(t),
    app = await startApp(path)
  t.after(() => app.close())
  return { ...app, path, api: createClient(app.baseUrl) }
}
const put = (app, id, body, headers = { "Content-Type": "application/json" }) =>
  fetch(app.baseUrl + "/api/trips/" + id, { method: "PUT", headers, body })

test("真实HTTP创建/Location/读取/修改，重复PUT不增行", options, async (t) => {
  const app = await fixture(t)
  const response = await fetch(app.baseUrl + "/api/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: app.baseUrl },
    body: JSON.stringify({ id: 99, destination: " 山城 ", days: 3 }),
  })
  assert.equal(response.status, 201)
  assert.equal(response.headers.get("location"), "/api/trips/1")
  assert.deepEqual(await response.json(), { id: 1, destination: "山城", days: 3 })
  for (let i = 0; i < 2; i++)
    assert.deepEqual(await app.api.update(1, { destination: "海湾", days: 30 }), {
      id: 1,
      destination: "海湾",
      days: 30,
    })
  assert.deepEqual(await (await fetch(app.baseUrl + "/api/trips/1")).json(), {
    id: 1,
    destination: "海湾",
    days: 30,
  })
  assert.equal((await app.api.list()).length, 1)
})
test("非法PUT在写入前失败，JSON/业务/媒体/字节与缺失资源", options, async (t) => {
  const app = await fixture(t)
  const before = await app.api.create({ destination: "山城", days: 1 })
  for (const fields of [
    null,
    [],
    {},
    { destination: " ", days: 3 },
    { destination: "界".repeat(81), days: 3 },
    ...["3", 0, 31, 2.5].map((days) => ({ destination: "海湾", days })),
  ]) {
    const r = await put(app, 1, JSON.stringify(fields))
    assert.equal(r.status, 422)
    await r.text()
    assert.deepEqual(await app.api.list(), [before])
  }
  for (const [body, headers, status] of [
    ["{", { "Content-Type": "application/json" }, 400],
    [new Uint8Array([255]), { "Content-Type": "application/json" }, 400],
    ["x", { "Content-Type": "text/plain" }, 415],
    [" ".repeat(1025), { "Content-Type": "application/json" }, 413],
  ]) {
    const r = await put(app, 1, body, headers)
    assert.equal(r.status, status)
    await r.text()
    assert.deepEqual(await app.api.list(), [before])
  }
  const missing = await put(app, 999, JSON.stringify({ destination: "海湾", days: 3 }))
  assert.equal(missing.status, 404)
  await missing.text()
  assert.deepEqual(await app.api.list(), [before])
})
test("静态白名单可达，不公开数据库/服务源码，拒绝错误Host/Origin与方法", options, async (t) => {
  const app = await fixture(t)
  for (const path of ["/", "/app.js", "/client.js", "/controller.js", "/fields.js"]) {
    const r = await fetch(app.baseUrl + path)
    assert.equal(r.status, 200)
    assert.match(r.headers.get("content-type"), path === "/" ? /text\/html/ : /javascript/)
    await r.text()
  }
  for (const path of [
    "/trips.sqlite",
    "/store.mjs",
    "/web/index.html",
    "/api/trips/9007199254740992",
  ]) {
    const r = await fetch(app.baseUrl + path)
    assert.equal(r.status, 404)
    await r.text()
  }
  for (const headers of [{ Origin: "https://example.invalid" }]) {
    const r = await fetch(app.baseUrl + "/api/trips", { headers })
    assert.equal(r.status, 403)
    await r.text()
  }
  const hostStatus = await new Promise((resolve, reject) => {
    const req = rawRequest(
      app.baseUrl + "/api/trips",
      { headers: { Host: "example.invalid" } },
      (res) => {
        res.resume()
        res.on("end", () => resolve(res.statusCode))
        res.on("error", reject)
      },
    )
    req.on("error", reject)
    req.end()
  })
  assert.equal(hostStatus, 403)
  const r = await fetch(app.baseUrl + "/api/trips/1", { method: "DELETE" })
  assert.equal(r.status, 405)
  assert.equal(r.headers.get("allow"), "GET, PUT")
  await r.text()
  assert.deepEqual(await app.api.list(), [])
})
test("参数化SQL与数据库约束仍生效；未知数据库错误500不泄漏内部信息", options, async (t) => {
  const app = await fixture(t)
  const text = "x'); DROP TABLE trips; --"
  assert.equal((await app.api.create({ destination: text, days: 3 })).destination, text)
  const db = new DatabaseSync(app.path)
  try {
    assert.throws(() => db.prepare("UPDATE trips SET days=? WHERE id=?").run(31, 1), /CHECK/)
    assert.equal((await app.api.list())[0].days, 3)
    db.exec("DROP TABLE trips")
    const r = await fetch(app.baseUrl + "/api/trips")
    assert.equal(r.status, 500)
    assert.deepEqual(await r.json(), {
      error: { code: "INTERNAL_ERROR", message: "服务暂时无法完成请求" },
    })
  } finally {
    db.close()
  }
})
test("真实服务器进程停止/重启后保留修改结果", options, async (t) => {
  const path = database(t)
  let app = await launch(path)
  try {
    const api = createClient(app.baseUrl)
    await api.create({ destination: "山城", days: 3 })
    await api.update(1, { destination: "海湾", days: 5 })
  } finally {
    await app.close()
  }
  app = await launch(path)
  try {
    assert.deepEqual(await createClient(app.baseUrl).list(), [
      { id: 1, destination: "海湾", days: 5 },
    ])
  } finally {
    await app.close()
  }
})
test("页面字段转换拒绝非法文字和长度，不把字符串发送为days", () => {
  assert.deepEqual(parseTripFields(" 山城 ", "03"), { destination: "山城", days: 3 })
  for (const [d, n] of [
    [" ", "3"],
    ["界".repeat(81), "3"],
    ["山城", "3x"],
    ["山城", "31"],
    ["山城", "2.5"],
  ])
    assert.throws(() => parseTripFields(d, n))
})
function view() {
  const events = []
  return {
    events,
    busy: (v) => events.push(["busy", v]),
    message: (v) => events.push(["message", v]),
    rows: (v) => events.push(["rows", v]),
    saved: () => events.push(["saved"]),
  }
}
test("页面控制器用真实API保存/刷新/修改，输入失败不重置", options, async (t) => {
  const app = await fixture(t),
    v = view(),
    c = createController(app.api, v)
  assert.equal(await c.load(), true)
  assert.equal(await c.save(null, " 山城 ", "3"), true)
  assert.equal(await c.save(1, "海湾", "5"), true)
  assert.equal(await c.save(1, "海湾", "31"), false)
  assert.equal(v.events.filter((x) => x[0] === "saved").length, 2)
  assert.deepEqual(await app.api.list(), [{ id: 1, destination: "海湾", days: 5 }])
  assert.deepEqual(v.events.at(-1), ["busy", false])
})
test("控制器pending拒绝重复；写入失败与已保存刷新失败分别提示", async () => {
  let release
  let writes = 0
  const v = view()
  const c = createController(
    {
      create: () => {
        writes++
        return new Promise((r) => {
          release = r
        })
      },
      list: async () => {
        throw new Error("list down")
      },
    },
    v,
  )
  const first = c.save(null, "山城", "3")
  assert.equal(await c.save(null, "山城", "3"), false)
  assert.equal(writes, 1)
  release({ id: 1 })
  await first
  assert.ok(v.events.some((x) => x[0] === "saved"))
  assert.ok(v.events.some((x) => String(x[1]).includes("已保存，但列表刷新失败")))
  const failed = view()
  const bad = createController(
    {
      create: async () => {
        throw new Error("network down")
      },
    },
    failed,
  )
  assert.equal(await bad.save(null, "山城", "3"), false)
  assert.ok(!failed.events.some((x) => x[0] === "saved"))
  assert.ok(failed.events.some((x) => String(x[1]).includes("确认结果")))
})
test("客户端区分HTTP错误/坏JSON/断网，不把全部错误当未写入", async () => {
  const http = createClient("", async () => new Response("internal html", { status: 500 }))
  await assert.rejects(http.list(), /HTTP 500/)
  const bad = createClient("", async () => new Response("{", { status: 200 }))
  await assert.rejects(bad.list(), SyntaxError)
  const net = createClient("", async () => {
    throw new TypeError("fetch failed")
  })
  await assert.rejects(net.list(), /fetch failed/)
})
test("demo独立进程完整执行并自动退出；DOM适配只作源码复核", options, async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL("./demo.mjs", import.meta.url))], {
    timeout: 10000,
  })
  let out = "",
    err = ""
  child.stdout.on("data", (x) => {
    out += x
  })
  child.stderr.on("data", (x) => {
    err += x
  })
  const result = await new Promise((resolve, reject) => {
    child.on("error", reject)
    child.on("close", (code, signal) => resolve({ code, signal }))
  })
  assert.deepEqual(result, { code: 0, signal: null }, err)
  assert.match(out, /非法修改 422/)
  assert.match(out, /重启后.*海湾.*5/)
  const html = readFileSync(new URL("./web/index.html", import.meta.url), "utf8")
  assert.match(html, /type="module" src="\/app.js"/)
})
