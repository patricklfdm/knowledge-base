import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { startFixture } from "./server.mjs"
import { getJson } from "./client.mjs"

async function setup(t) {
  const fixture = await startFixture()
  t.after(() => fixture.close())
  return fixture
}
const options = { timeout: 10000 }

test("请求确实经过HTTP：方法、查询、Accept、片段不发送与响应正文", options, async (t) => {
  const fixture = await setup(t)
  const response = await fetch(fixture.baseUrl + "/trips/t1?view=full#preview", {
    headers: { Accept: "application/json" },
  })
  assert.deepEqual(fixture.requests, [
    { method: "GET", target: "/trips/t1?view=full", accept: "application/json" },
  ])
  assert.equal(response.status, 200)
  assert.equal(response.ok, true)
  assert.equal(response.headers.get("CONTENT-TYPE"), "application/json; charset=utf-8")
  const text = await response.text()
  assert.equal(text, '{"id":"t1","destination":"山城","days":3}')
  assert.deepEqual(JSON.parse(text), { id: "t1", destination: "山城", days: 3 })
})
test("查询参数改变表示；非法view返回400；JSON解析不验证业务形状", options, async (t) => {
  const { baseUrl } = await setup(t)
  assert.deepEqual(await getJson(baseUrl + "/trips/t1?view=summary"), {
    id: "t1",
    destination: "山城",
  })
  await assert.rejects(getJson(baseUrl + "/trips/t1?view=unknown"), { message: "HTTP 400" })
  assert.equal(typeof (await getJson(baseUrl + "/wrong-shape")).days, "string")
})
test("404使fetch正常返回Response，getJson才明确抛HTTP错误", options, async (t) => {
  const { baseUrl } = await setup(t)
  const response = await fetch(baseUrl + "/trips/missing")
  assert.equal(response.status, 404)
  assert.equal(response.ok, false)
  assert.deepEqual(await response.json(), { error: "找不到行程或演示路径" })
  await assert.rejects(getJson(baseUrl + "/trips/missing"), { name: "Error", message: "HTTP 404" })
})
test("POST不产生写入：405并声明Allow，后续GET数据不变", options, async (t) => {
  const { baseUrl } = await setup(t)
  const response = await fetch(baseUrl + "/trips/t1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days: 8 }),
  })
  assert.equal(response.status, 405)
  assert.equal(response.headers.get("allow"), "GET")
  assert.equal((await response.json()).error, "此演示只允许GET")
  assert.equal((await getJson(baseUrl + "/trips/t1")).days, 3)
})
test("先判断状态：500的HTML错误页不会被误诊为JSON语法错误", options, async (t) => {
  const { baseUrl } = await setup(t)
  await assert.rejects(getJson(baseUrl + "/html-error"), { name: "Error", message: "HTTP 500" })
})
test("200和JSON类型头不能保证JSON正文正确；读取过的正文不能重复消费", options, async (t) => {
  const { baseUrl } = await setup(t)
  const response = await fetch(baseUrl + "/broken-json")
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("content-type"), "application/json")
  await assert.rejects(response.json(), SyntaxError)
  await assert.rejects(getJson(baseUrl + "/broken-json"), SyntaxError)
  const consumed = await fetch(baseUrl + "/trips/t1")
  await consumed.text()
  assert.equal(consumed.bodyUsed, true)
  await assert.rejects(consumed.json(), TypeError)
})
test("服务端实际接收后断开连接，fetch以网络错误拒绝而无HTTP状态", options, async (t) => {
  const fixture = await setup(t)
  await assert.rejects(getJson(fixture.baseUrl + "/disconnect"), TypeError)
  assert.ok(fixture.requests.some((r) => r.target === "/disconnect"))
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
test("独立入口自动停止；故意未捕获HTTP错误使进程非零退出", options, async () => {
  const inspect = await run("./inspect.mjs")
  assert.equal(inspect.code, 0, inspect.stderr)
  assert.equal(inspect.signal, null)
  assert.match(inspect.stdout, /请求 GET \/trips\/t1\?view=full\n/)
  assert.match(inspect.stdout, /解析后 山城 3 number\n/)
  const errors = await run("./errors.mjs")
  assert.equal(errors.code, 0, errors.stderr)
  assert.match(errors.stdout, /原始fetch 404 false\n/)
  assert.match(errors.stdout, /\/broken-json 失败 SyntaxError/)
  assert.match(errors.stdout, /\/disconnect 失败 TypeError/)
  const failure = await run("./failure.mjs")
  assert.equal(failure.code, 1, failure.stderr)
  assert.equal(failure.signal, null)
  assert.match(failure.stderr, /Error: HTTP 404/)
})
