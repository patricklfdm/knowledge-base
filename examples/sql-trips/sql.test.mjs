import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"
import { openTrips } from "./store.mjs"
import { readTrips } from "./read.mjs"

function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "kb-sql-test space-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return join(dir, "trips.sqlite")
}
function run(file, args = []) {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url)), ...args], {
    encoding: "utf8",
    timeout: 5000,
  })
  assert.ifError(r.error)
  assert.equal(r.signal, null)
  return r
}
const plain = (value) => JSON.parse(JSON.stringify(value))

test("建表、创建、按ID读取、显式排序与边界1/30", (t) => {
  const store = openTrips(setup(t))
  try {
    const a = store.create("山城", 3)
    store.create("海湾", 1)
    store.create("雪原", 30)
    assert.deepEqual(plain(a), { id: 1, destination: "山城", days: 3 })
    assert.deepEqual(store.get(1), a)
    assert.equal(store.get(999), undefined)
    assert.deepEqual(
      store.list().map((x) => x.id),
      [1, 2, 3],
    )
    assert.deepEqual(
      store.atLeast(3).map((x) => x.days),
      [3, 30],
    )
    assert.deepEqual(store.atLeast(31), [])
  } finally {
    store.close()
  }
})
test("约束错误不新增行：空/NULL、范围、不可转换类型、小数", (t) => {
  const store = openTrips(setup(t))
  try {
    store.create("山城", 3)
    for (const [destination, days, pattern] of [
      ["", 3, /CHECK/],
      [null, 3, /NOT NULL/],
      ["山城", null, /NOT NULL/],
      ["山城", 0, /CHECK/],
      ["山城", 31, /CHECK/],
      ["山城", "three", /cannot store/],
      ["山城", 2.5, /cannot store/],
    ]) {
      assert.throws(() => store.create(destination, days), pattern)
      assert.equal(store.list().length, 1)
    }
  } finally {
    store.close()
  }
})
test("STRICT允许无损转换，数据库规则不等于F09输入规则", (t) => {
  const store = openTrips(setup(t))
  try {
    assert.equal(store.create("山城", "3").days, 3)
    assert.equal(store.create(" ", 1).destination, " ")
    assert.equal(store.create("界".repeat(81), 1).destination.length, 81)
  } finally {
    store.close()
  }
})
test("参数绑定保留单引号和SQL样式文字，查询注入不扩大匹配", (t) => {
  const store = openTrips(setup(t))
  try {
    for (const value of ["O'Brien", "x'); DROP TABLE trips; --"]) {
      assert.equal(store.create(value, 3).destination, value)
    }
    assert.equal(store.get("1 OR 1=1"), undefined)
    assert.equal(store.list().length, 2)
  } finally {
    store.close()
  }
})
test("绕过存储函数仍受主键/CHECK约束；SQL拼写错误在prepare失败", (t) => {
  const path = setup(t)
  const store = openTrips(path)
  store.close()
  const db = new DatabaseSync(path)
  try {
    const insert = db.prepare("INSERT INTO trips(id,destination,days) VALUES(?,?,?)")
    insert.run(7, "山城", 3)
    assert.throws(() => insert.run(7, "海湾", 2), /UNIQUE/)
    assert.throws(() => insert.run(8, "海湾", 31), /CHECK/)
    assert.throws(() => db.prepare("SELEC id FROM trips"), /syntax error/)
    assert.equal(db.prepare("SELECT count(*) AS n FROM trips").get().n, 1)
  } finally {
    db.close()
  }
})
test("关闭后重开及新进程读取同一文件；内存连接对照为空", (t) => {
  const path = setup(t)
  const store = openTrips(path)
  try {
    store.create("山城", 3)
  } finally {
    store.close()
  }
  const expected = [{ id: 1, destination: "山城", days: 3 }]
  assert.deepEqual(plain(readTrips(path)), expected)
  const reader = run("./read.mjs", [path])
  assert.equal(reader.status, 0, reader.stderr)
  assert.deepEqual(JSON.parse(reader.stdout), expected)
  const reopened = openTrips(path)
  try {
    assert.equal(reopened.create("海湾", 1).id, 2)
  } finally {
    reopened.close()
  }
  const first = openTrips(":memory:")
  try {
    first.create("山城", 3)
  } finally {
    first.close()
  }
  const second = openTrips(":memory:")
  try {
    assert.equal(second.list().length, 0)
  } finally {
    second.close()
  }
})
test("IF NOT EXISTS不修改现有schema；新库14天练习才使用新约束", (t) => {
  const path = setup(t)
  const store = openTrips(path)
  store.close()
  const changed = readFileSync(new URL("./schema.sql", import.meta.url), "utf8").replace(
    "BETWEEN 1 AND 30",
    "BETWEEN 1 AND 14",
  )
  const db = new DatabaseSync(path)
  try {
    db.exec(changed)
    db.prepare("INSERT INTO trips(destination,days) VALUES(?,?)").run("旧表", 15)
  } finally {
    db.close()
  }
  const fresh = new DatabaseSync(":memory:")
  try {
    fresh.exec(changed)
    const insert = fresh.prepare("INSERT INTO trips(destination,days) VALUES(?,?)")
    insert.run("新表", 14)
    assert.throws(() => insert.run("新表", 15), /CHECK/)
    assert.equal(fresh.prepare("SELECT count(*) AS n FROM trips").get().n, 1)
  } finally {
    fresh.close()
  }
})
test("demo与故意失败入口正常清理；只读缺失文件不自动建库", (t) => {
  const demo = run("./demo.mjs")
  assert.equal(demo.status, 0, demo.stderr)
  assert.match(demo.stdout, /31天被CHECK拒绝\n条数 2/)
  assert.match(demo.stdout, /新进程读取.*山城.*海湾/)
  const failure = run("./failure.mjs")
  assert.equal(failure.status, 1)
  assert.match(failure.stderr, /CHECK constraint failed/)
  const reader = run("./read.mjs", [setup(t)])
  assert.notEqual(reader.status, 0)
  assert.match(reader.stderr, /unable to open database file/)
})
