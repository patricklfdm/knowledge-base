import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { comparePlans, dataset, snapshot, createIndexSql } from "./index-plans.mjs"

test("2000条确定性费用的四种访问计划，结果与显式顺序一致", () => {
  const { before, indexed, reversed, removed } = comparePlans()
  const expected = Array.from({ length: 11 }, (_, k) => ({
    id: 830 + k,
    amount_cents: 1000 + k * 100,
  }))
  for (const state of [before, indexed, reversed, removed]) {
    assert.deepEqual(JSON.parse(JSON.stringify(state.rows)), expected)
  }
  // Version-scoped teaching observations, never used by application logic.
  assert.match(before.plan.join("\n"), /SCAN expenses/)
  assert.match(before.plan.join("\n"), /TEMP B-TREE/)
  assert.match(
    indexed.plan.join("\n"),
    /SEARCH expenses USING COVERING INDEX expenses_journey_amount/,
  )
  assert.match(indexed.plan.join("\n"), /journey_id=\? AND amount_cents>\?/)
  assert.doesNotMatch(indexed.plan.join("\n"), /TEMP B-TREE/)
  assert.match(reversed.plan.join("\n"), /expenses_amount_journey \(amount_cents>\?\)/)
  assert.match(removed.plan.join("\n"), /SCAN expenses/)
})

test("参数边界与无结果对照，建索引后的增改删仍返回正确数据", () => {
  const db = dataset()
  try {
    for (const [journey, minimum, n] of [
      [42, 2000, 1],
      [42, 2001, 0],
      [101, 1000, 0],
    ]) {
      const before = snapshot(db, journey, minimum).rows
      db.exec(createIndexSql)
      assert.equal(before.length, n)
      assert.deepEqual(snapshot(db, journey, minimum).rows, before)
      db.exec("DROP INDEX expenses_journey_amount")
    }
    db.exec(createIndexSql)
    const result = db
      .prepare("INSERT INTO expenses(journey_id,amount_cents) VALUES (?,?)")
      .run(42, 2500)
    assert.equal(snapshot(db).rows.length, 12)
    assert.equal(snapshot(db).rows.at(-1).amount_cents, 2500)
    db.prepare("UPDATE expenses SET amount_cents=? WHERE id=?").run(50, 830)
    assert.equal(snapshot(db).rows.length, 11)
    assert.equal(snapshot(db).rows[0].amount_cents, 1100)
    db.prepare("DELETE FROM expenses WHERE id=?").run(result.lastInsertRowid)
    assert.equal(snapshot(db).rows.length, 10)
  } finally {
    db.close()
  }
})

test("维护的索引演示可独立退出，四组计划均包含实际行数", () => {
  const r = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./index-demo.mjs", import.meta.url))],
    { encoding: "utf8", timeout: 5000 },
  )
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stderr)
  const [version, ...states] = r.stdout.trim().split("\n")
  assert.match(version, /^SQLite /)
  assert.deepEqual(
    states.map((s) => JSON.parse(s).rows),
    [11, 11, 11, 11],
  )
})
