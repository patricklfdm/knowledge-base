import test from "node:test"
import assert from "node:assert/strict"
import { request } from "node:http"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { startApi } from "./server.mjs"
import { parseTrip } from "./input.mjs"

const options = { timeout: 10000 }
async function setup(t) {
  const api = await startApi()
  t.after(() => api.close())
  return api.baseUrl
}
async function post(base, input) {
  return fetch(base + "/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}
async function count(base) {
  return (await (await fetch(base + "/trips")).json()).length
}
function raw(base, chunks, headers = { "Content-Type": "application/json" }) {
  return new Promise((resolve, reject) => {
    const req = request(base + "/trips", { method: "POST", headers }, (res) => {
      let text = ""
      res.setEncoding("utf8")
      res.on("data", (chunk) => {
        text += chunk
      })
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(text) }),
      )
      res.on("error", reject)
    })
    req.on("error", reject)
    req.setTimeout(5000, () => req.destroy(new Error("test request timed out")))
    for (const chunk of chunks) req.write(chunk)
    req.end()
  })
}

test("201/Location创建后可读，服务端编号、拣选字段且不相信客户端id", options, async (t) => {
  const base = await setup(t)
  const response = await post(base, { id: "forged", destination: " 山城 ", days: 3, admin: true })
  assert.equal(response.status, 201)
  assert.equal(response.headers.get("location"), "/trips/t1")
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8")
  const trip = { id: "t1", destination: "山城", days: 3 }
  assert.deepEqual(await response.json(), trip)
  assert.deepEqual(await (await fetch(base + "/trips/t1")).json(), trip)
  assert.deepEqual(await (await fetch(base + "/trips")).json(), [trip])
})
test("业务边界1/30、目的地80代码单元与纯函数不修改输入", options, async (t) => {
  const base = await setup(t)
  for (const input of [
    { destination: "山", days: 1 },
    { destination: "😀".repeat(40), days: 30 },
  ]) {
    const before = structuredClone(input)
    const parsed = parseTrip(input)
    assert.deepEqual(input, before)
    assert.notEqual(parsed, input)
    const response = await post(base, input)
    assert.equal(response.status, 201)
    await response.text()
  }
})
test("非法对象、类型、范围和长度均422，失败不写入也不消耗编号", options, async (t) => {
  const base = await setup(t)
  const invalid = [
    null,
    [],
    true,
    "trip",
    {},
    { destination: 3, days: 3 },
    ...["", " ", "界".repeat(81), "😀".repeat(41)].map((destination) => ({ destination, days: 3 })),
    ...["3", null, 0, 31, 2.5].map((days) => ({ destination: "山城", days })),
  ]
  for (const input of invalid) {
    const response = await post(base, input)
    assert.equal(response.status, 422)
    assert.equal((await response.json()).error.code, "INVALID_TRIP")
    assert.equal(await count(base), 0)
  }
  const good = await post(base, { destination: "山城", days: 3 })
  assert.equal((await good.json()).id, "t1")
})
test("空正文、坏JSON和非法UTF-8为400且无写入", options, async (t) => {
  const base = await setup(t)
  for (const body of [
    Buffer.from(""),
    Buffer.from('{"days":'),
    Buffer.from('{"days":3,}'),
    Buffer.from([0xff]),
  ]) {
    const response = await raw(base, [body])
    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, "INVALID_JSON")
    assert.equal(await count(base), 0)
  }
})
test("只接受声明支持的UTF-8 JSON与identity编码", options, async (t) => {
  const base = await setup(t)
  for (const headers of [
    {},
    { "Content-Type": "text/plain" },
    { "Content-Type": "application/json; charset=gbk" },
    { "Content-Type": "application/jsonp" },
    { "Content-Type": "application/json", "Content-Encoding": "gzip" },
  ]) {
    const response = await raw(base, ['{"destination":"山城","days":3}'], headers)
    assert.equal(response.status, 415)
    assert.equal(await count(base), 0)
  }
  const valid = await raw(base, ['{"destination":"山城","days":3}'], {
    "Content-Type": 'Application/JSON; charset="UTF-8"',
    "Content-Encoding": "identity",
  })
  assert.equal(valid.status, 201)
})
test("实际字节边界：1024通过，1025与多字节超限413，chunked不能绕过", options, async (t) => {
  const base = await setup(t)
  const json = '{"destination":"山城","days":3}'
  const exact = Buffer.from(json + " ".repeat(1024 - Buffer.byteLength(json)))
  assert.equal(exact.length, 1024)
  assert.equal((await raw(base, [exact.subarray(0, 10), exact.subarray(10)])).status, 201)
  const tooLarge = Buffer.concat([exact, Buffer.from(" ")])
  const rejected = await raw(base, [tooLarge.subarray(0, 512), tooLarge.subarray(512)])
  assert.equal(rejected.status, 413)
  assert.equal(rejected.body.error.code, "BODY_TOO_LARGE")
  const unicode = JSON.stringify({ destination: "山城", days: 3, extra: "界".repeat(350) })
  assert.ok(unicode.length < 1024 && Buffer.byteLength(unicode) > 1024)
  assert.equal((await raw(base, [unicode])).status, 413)
  assert.equal(await count(base), 1)
})
test("多块中文UTF-8和数字跨块仍正确解析", options, async (t) => {
  const base = await setup(t)
  const bytes = Buffer.from('{"destination":"山城","days":30}')
  const split = bytes.indexOf(Buffer.from("山")) + 1
  const response = await raw(base, [
    bytes.subarray(0, split),
    bytes.subarray(split, bytes.length - 2),
    bytes.subarray(bytes.length - 2),
  ])
  assert.equal(response.status, 201)
  assert.equal(response.body.destination, "山城")
  assert.equal(response.body.days, 30)
})
test("404/405+Allow稳定；失败路径不创建数据", options, async (t) => {
  const base = await setup(t)
  for (const path of ["/missing", "/trips/t9"]) {
    const response = await fetch(base + path)
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.code, "NOT_FOUND")
  }
  const response = await fetch(base + "/trips", { method: "DELETE" })
  assert.equal(response.status, 405)
  assert.equal(response.headers.get("allow"), "GET, POST")
  await response.text()
  assert.equal(await count(base), 0)
})
test("重复POST产生不同记录；关闭后新实例为空，不能当持久化", options, async (t) => {
  const api = await startApi()
  try {
    const one = await post(api.baseUrl, { destination: "山城", days: 3 })
    const two = await post(api.baseUrl, { destination: "山城", days: 3 })
    assert.equal((await one.json()).id, "t1")
    assert.equal((await two.json()).id, "t2")
    assert.equal(await count(api.baseUrl), 2)
  } finally {
    await api.close()
  }
  assert.equal(await count(await setup(t)), 0)
})
function run(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], {
      timeout: 8000,
    })
    let stdout = "",
      stderr = ""
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      stdout += chunk
    })
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr += chunk
    })
    child.on("error", reject)
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }))
  })
}
test("独立demo清理服务；未捕获422入口非零退出", options, async () => {
  const demo = await run("./demo.mjs")
  assert.equal(demo.code, 0, demo.stderr)
  assert.match(demo.stdout, /创建 201 \/trips\/t1/)
  assert.match(demo.stdout, /非法输入 422 INVALID_TRIP/)
  assert.match(demo.stdout, /条数 1\n新实例条数 0/)
  const fail = await run("./failure.mjs")
  assert.equal(fail.code, 1, fail.stderr)
  assert.equal(fail.signal, null)
  assert.match(fail.stderr, /HTTP 422/)
})
