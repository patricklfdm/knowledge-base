import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  openLedger,
  createWithTransaction,
  createWithoutTransaction,
  detailSql,
  totalsSql,
} from "./ledger.mjs"

const plain = (v) => JSON.parse(JSON.stringify(v))
function memory(t) {
  const db = openLedger(":memory:")
  t.after(() => db.close())
  return db
}
function seed(db) {
  createWithTransaction(db, "山城", [100, 200])
  createWithTransaction(db, "海湾", [5000])
  createWithTransaction(db, "雪原", [])
}

test("外键拒绝孤儿及被引用父行删除；非空与正整数费用约束", (t) => {
  const db = memory(t)
  assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1)
  const id = createWithTransaction(db, "山城", [100])
  const insert = db.prepare("INSERT INTO expenses(journey_id,amount_cents) VALUES (?,?)")
  assert.throws(() => insert.run(999, 100), /FOREIGN KEY/)
  assert.throws(() => insert.run(null, 100), /NOT NULL/)
  for (const n of [0, -1, 1.5, null]) assert.throws(() => insert.run(id, n))
  assert.throws(() => db.prepare("DELETE FROM journeys WHERE id=?").run(id), /FOREIGN KEY/)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM expenses").get().n, 1)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM journeys").get().n, 1)
})

test("一对多明细、LEFT JOIN零条与COUNT星号反例", (t) => {
  const db = memory(t)
  seed(db)
  assert.deepEqual(
    db
      .prepare(detailSql)
      .all()
      .map((r) => [r.journey_id, r.expense_id]),
    [
      [1, 1],
      [1, 2],
      [2, 3],
    ],
  )
  assert.deepEqual(plain(db.prepare(totalsSql).all()), [
    { id: 1, destination: "山城", expense_count: 2, total_cents: 300 },
    { id: 2, destination: "海湾", expense_count: 1, total_cents: 5000 },
    { id: 3, destination: "雪原", expense_count: 0, total_cents: 0 },
  ])
  const wrong = totalsSql.replace("COUNT(e.id)", "COUNT(*)")
  assert.equal(db.prepare(wrong).all()[2].expense_count, 1)
  assert.notDeepEqual(db.prepare(wrong).all(), db.prepare(totalsSql).all())
})

test("右表条件放ON保留零匹配，WHERE移除NULL行；新条件练习", (t) => {
  const db = memory(t)
  seed(db)
  const on = `SELECT j.id, COUNT(e.id) AS n FROM journeys j
    LEFT JOIN expenses e ON e.journey_id=j.id AND e.amount_cents>=?
    GROUP BY j.id ORDER BY j.id`
  const where = `SELECT j.id, COUNT(e.id) AS n FROM journeys j
    LEFT JOIN expenses e ON e.journey_id=j.id WHERE e.amount_cents>=?
    GROUP BY j.id ORDER BY j.id`
  assert.deepEqual(plain(db.prepare(on).all(1000)), [
    { id: 1, n: 0 },
    { id: 2, n: 1 },
    { id: 3, n: 0 },
  ])
  assert.deepEqual(plain(db.prepare(where).all(1000)), [{ id: 2, n: 1 }])
  assert.deepEqual(plain(db.prepare(on).all(200)), [
    { id: 1, n: 1 },
    { id: 2, n: 1 },
    { id: 3, n: 0 },
  ])
})

test("无事务留下半写入；显式回滚保留既有数据且连接可继续使用", (t) => {
  const unsafe = memory(t)
  assert.throws(() => createWithoutTransaction(unsafe, "残留", [100, -1]), /CHECK/)
  assert.deepEqual(plain(unsafe.prepare(totalsSql).all()), [
    { id: 1, destination: "残留", expense_count: 1, total_cents: 100 },
  ])
  const db = memory(t)
  createWithTransaction(db, "既有", [50])
  const before = plain(db.prepare(totalsSql).all())
  for (const amounts of [
    [-1, 100],
    [100, -1],
    [100, 200, -1],
  ]) {
    assert.throws(() => createWithTransaction(db, "应撤销", amounts), /CHECK/)
    assert.deepEqual(plain(db.prepare(totalsSql).all()), before)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM expenses").get().n, 1)
  }
  createWithTransaction(db, "之后成功", [300])
  assert.equal(db.prepare(totalsSql).all().length, 2)
})

test("事务函数不支持嵌套；BEGIN失败不撤销调用方原有事务", (t) => {
  const db = memory(t)
  db.exec("BEGIN")
  try {
    db.prepare("INSERT INTO journeys(destination) VALUES (?)").run("调用方")
    assert.throws(() => createWithTransaction(db, "嵌套", [100]), /within a transaction/)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM journeys").get().n, 1)
  } finally {
    db.exec("ROLLBACK")
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM journeys").get().n, 0)
})

test("已提交内容关闭重开保留；同文件失败回滚不留下新增行", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kb-ledger-test space-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const file = join(dir, "ledger.sqlite")
  const db = openLedger(file)
  try {
    seed(db)
    assert.throws(() => createWithTransaction(db, "失败", [100, -1]), /CHECK/)
  } finally {
    db.close()
  }
  const reopened = openLedger(file)
  try {
    assert.deepEqual(
      reopened
        .prepare(totalsSql)
        .all()
        .map((r) => r.total_cents),
      [300, 5000, 0],
    )
    assert.equal(reopened.prepare("PRAGMA foreign_key_check").all().length, 0)
  } finally {
    reopened.close()
  }
})

test("维护的ledger演示入口输出半写入/回滚/汇总/重开证据", () => {
  const r = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./ledger-demo.mjs", import.meta.url))],
    { encoding: "utf8", timeout: 5000 },
  )
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /无事务 .*"expense_count":1/)
  assert.match(r.stdout, /有事务 \[\]/)
  assert.match(r.stdout, /重开条数 3/)
})
