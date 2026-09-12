import test from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { spawnSync, spawn } from "node:child_process"
import { createServer } from "node:http"
import { buildNote } from "./exercises/build-note.mjs"
import { openStore } from "./store.mjs"
import { createClient } from "./web/client.js"
import { startApp } from "./server.mjs"
import { smoke } from "./smoke.mjs"
const options = { timeout: 15000 }
function copy(t) {
  const c = buildNote()
  t.after(c.cleanup)
  return c
}
const load = (app, file) => import(pathToFileURL(join(app, file)).href)

test("备注迁移：旧行默认值、事务中断回滚、重复启动及不支持版本", options, async (t) => {
  const c = copy(t),
    path = join(c.dir, "trips.sqlite"),
    old = openStore(path)
  old.create({ destination: "山城", days: 3 })
  old.close()
  const { migrate } = await load(c.app, "store.mjs"),
    db = new DatabaseSync(path)
  try {
    assert.throws(() => migrate(db, true), /故意中断/)
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 0)
    assert.equal(db.prepare("PRAGMA table_info(trips)").all().length, 3)
    assert.equal(db.prepare("SELECT count(*) AS n FROM trips").get().n, 1)
    migrate(db)
    migrate(db)
    assert.equal(db.prepare("SELECT note FROM trips").get().note, "")
    assert.equal(db.prepare("PRAGMA user_version").get().user_version, 1)
    assert.throws(() => db.prepare("UPDATE trips SET note=NULL").run(), /NOT NULL/)
    db.exec("PRAGMA user_version=99")
    assert.throws(() => migrate(db), /不支持/)
  } finally {
    db.close()
  }
})
test("字段全链路：页面补丁、控制器、HTTP校验、SQL更新与新进程保留备注", options, async (t) => {
  const c = copy(t),
    path = join(c.dir, "trips.sqlite"),
    old = openStore(path)
  old.create({ destination: "山城", days: 3 })
  old.close()
  const { launch } = await load(c.app, "process.mjs")
  let app = await launch(path)
  try {
    const api = createClient(app.baseUrl)
    assert.equal((await api.list())[0].note, "")
    const { createController } = await load(c.app, "web/controller.js")
    let resets = 0
    const controller = createController(api, {
      busy() {},
      message() {},
      rows() {},
      saved() {
        resets++
      },
    })
    assert.equal(await controller.save(1, "海湾", "5", "靠窗"), true)
    assert.equal(resets, 1)
    const good = { destination: "雪原", days: 2, note: "界".repeat(120) }
    const created = await api.create(good)
    assert.equal(created.note, good.note)
    const before = await api.list()
    for (const note of [null, 7, "界".repeat(121)]) {
      const r = await fetch(app.baseUrl + "/api/trips/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: "坏修改", days: 3, note }),
      })
      assert.equal(r.status, 422)
      await r.text()
      assert.deepEqual(await api.list(), before)
    }
    assert.equal(await controller.save(1, "海湾", "5", "界".repeat(121)), false)
    assert.equal(resets, 1)
    const html = await (await fetch(app.baseUrl)).text()
    assert.match(html, /name="note"/)
    const js = await (await fetch(app.baseUrl + "/app.js")).text()
    assert.match(js, /note.value = trip.note/)
    assert.match(js, /days.value, note.value/)
    assert.equal((await fetch(app.baseUrl + "/base-fields.js")).status, 200)
    const checked = spawnSync(process.execPath, ["--check", join(c.app, "web/app.js")], {
      encoding: "utf8",
    })
    assert.equal(checked.status, 0, checked.stderr)
  } finally {
    await app.close()
  }
  app = await launch(path)
  try {
    const rows = await createClient(app.baseUrl).list()
    assert.equal(rows[0].note, "靠窗")
    assert.equal(rows[0].days, 5)
    assert.equal(rows.length, 2)
  } finally {
    await app.close()
  }
})
test("只读HTTP冒烟不创建记录，不能把页面200当业务成功", options, async (t) => {
  const c = copy(t),
    app = await startApp(join(c.dir, "smoke.sqlite"))
  t.after(() => app.close())
  assert.deepEqual(await smoke(app.baseUrl), { pages: 2, rows: 0 })
  assert.deepEqual(await createClient(app.baseUrl).list(), [])
  const broken = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("not the app")
  })
  await new Promise((r) => broken.listen(0, "127.0.0.1", r))
  t.after(() => new Promise((r) => broken.close(r)))
  const bad = "http://127.0.0.1:" + broken.address().port
  await assert.rejects(smoke(bad))
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL("./smoke.mjs", import.meta.url)), bad],
    { timeout: 6000 },
  )
  child.stdout.resume()
  child.stderr.resume()
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject)
    child.on("close", resolve)
  })
  assert.equal(code, 1)
  await assert.rejects(smoke("https://example.invalid"), /仅允许本机/)
})
