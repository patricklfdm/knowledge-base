import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  withPair,
  amount,
  expectSqliteError,
  writerContention,
  readerBlocksCommit,
  staleSnapshot,
} from "./connections.mjs"

test("两个日志模式均拒绝第二写者，提交后新事务重新读取再修改", () => {
  for (const mode of ["DELETE", "WAL"]) {
    const r = writerContention(mode)
    assert.equal(r.ownUncommitted, 150)
    assert.equal(r.otherBefore, 100)
    assert.equal(r.blocked.errcode, 5)
    assert.equal(r.reread, 150)
    assert.equal(r.final, 175)
  }
})

test("改变条件：第一写者回滚也释放锁，但第二写者只能读到原值", () => {
  for (const mode of ["DELETE", "WAL"]) {
    const r = writerContention(mode, "ROLLBACK")
    assert.equal(r.blocked.errcode, 5)
    assert.equal(r.reread, 100)
    assert.equal(r.final, 125)
  }
})

test("DELETE读事务阻止COMMIT，第一次提交失败不等于自动撤销写入", () => {
  const r = readerBlocksCommit()
  assert.equal(r.before, 100)
  assert.equal(r.blocked.errcode, 5)
  assert.equal(r.ownPending, 150)
  assert.equal(r.readerStill, 100)
  assert.equal(r.final, 150)
})

test("WAL写提交后读者仍见旧快照，517后重启整个事务并重新读取", () => {
  const r = staleSnapshot()
  assert.equal(r.before, 100)
  assert.equal(r.readerStill, 100)
  assert.equal(r.blocked.errcode, 517)
  assert.equal(r.reread, 150)
  assert.equal(r.final, 175)
})

test("快照建立在首次实际读取；WAL写者回滚不会使原读快照过时", () => {
  withPair("WAL", (a, b) => {
    b.exec("BEGIN")
    a.prepare("UPDATE expenses SET amount_cents=? WHERE id=1").run(150)
    assert.equal(amount(b), 150)
    a.exec("BEGIN IMMEDIATE")
    a.prepare("UPDATE expenses SET amount_cents=? WHERE id=1").run(200)
    a.exec("ROLLBACK")
    b.prepare("UPDATE expenses SET amount_cents=? WHERE id=1").run(175)
    b.exec("COMMIT")
    assert.equal(amount(a), 175)
  })
})

test("夹具明确两连接模式与零等待；异常后关闭并清理自身目录", () => {
  let dir
  assert.throws(() => withPair("OTHER", () => {}), /Unsupported/)
  assert.throws(
    () =>
      withPair("WAL", (a, b, path) => {
        dir = path
        assert.notEqual(a, b)
        for (const db of [a, b]) {
          assert.equal(db.prepare("PRAGMA busy_timeout").get().timeout, 0)
          assert.equal(db.prepare("PRAGMA journal_mode").get().journal_mode, "wal")
        }
        a.exec("BEGIN IMMEDIATE")
        throw new Error("fixture interruption")
      }),
    /fixture interruption/,
  )
  assert.equal(existsSync(dir), false)
  assert.throws(() => expectSqliteError(() => {}, 5), /operation succeeded/)
  assert.throws(
    () =>
      expectSqliteError(() => {
        throw new Error("unrelated")
      }, 5),
    /unrelated/,
  )
})

test("维护入口运行真实交错并退出；四个观察包含准确错误码", () => {
  const r = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./connections-demo.mjs", import.meta.url))],
    { encoding: "utf8", timeout: 5000 },
  )
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stderr)
  const rows = r.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line.slice(line.indexOf(" ") + 1)))
  assert.deepEqual(
    rows.map((row) => row.blocked.errcode),
    [5, 5, 5, 517],
  )
  assert.deepEqual(
    rows.map((row) => row.final),
    [175, 175, 150, 175],
  )
})
