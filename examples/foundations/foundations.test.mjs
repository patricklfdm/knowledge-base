import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { validateDays } from "./rules.mjs"

function run(file) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], {
    encoding: "utf8",
  })
}
test("F00 顺序输出与运行错误定位", () => {
  const good = run("hello.mjs")
  assert.equal(good.status, 0)
  assert.equal(good.stdout, "开始记录行程\n5\n程序结束\n")
  const bad = run("failures/typo.mjs")
  assert.notEqual(bad.status, 0)
  assert.equal(bad.stdout, "开始记录行程\n")
  assert.match(bad.stderr, /TypeError: console.loog is not a function/)
  assert.match(bad.stderr, /typo.mjs:2/)
})
test("F00 找不到入口文件与运行错误不同", () => {
  const missing = run("intentionally-absent.mjs")
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /MODULE_NOT_FOUND/)
  assert.equal(missing.stdout, "")
})
test("F01 值、类型与精度的实际输出", () => {
  const result = run("values.mjs")
  assert.equal(result.status, 0)
  assert.equal(result.stdout, "山城 3\nnumber\n21\n3\nfalse\nfalse\n")
  const reassign = run("failures/reassign.mjs")
  assert.notEqual(reassign.status, 0)
  assert.match(reassign.stderr, /TypeError: Assignment to constant variable/)
})
test("F02 业务规则覆盖正常、边界、类型错误", () => {
  for (const days of [1, 3, 30]) assert.equal(validateDays(days), "通过")
  for (const days of [-2, 0, 31]) assert.equal(validateDays(days), "天数必须在 1 到 30 之间")
  for (const days of [2.5, "3", "三天", undefined, null, NaN, Infinity, true])
    assert.equal(validateDays(days), "天数必须是整数")
})
test("F02 真值反例与演示输出与正文一致", () => {
  assert.equal(run("failures/truthy.mjs").stdout, "通过\n通过\n")
  const result = run("rules-demo.mjs")
  assert.equal(result.status, 0)
  assert.equal(
    result.stdout,
    "通过\n天数必须在 1 到 30 之间\n通过\n天数必须在 1 到 30 之间\n天数必须是整数\n天数必须是整数\n",
  )
})

test("F03 创建、查找与两种更新的演示", () => {
  const result = run("trips-demo.mjs")
  assert.equal(result.status, 0)
  assert.equal(result.stdout, "3\n4\n5\n5 7\n")
})
test("F03 查找返回首个匹配，空列表/缺失/类型不符不会命中", () => {
  const trips = [
    { id: "t1", days: 3 },
    { id: "t1", days: 5 },
  ]
  function matches(trip) {
    return trip.id === "t1"
  }
  assert.equal(trips.find(matches), trips[0])
  assert.equal([].find(matches), undefined)
  assert.equal([{ id: 1 }].find(matches), undefined)
  assert.equal([{ id: "t2" }].find(matches), undefined)
  const bad = run("failures/missing-trip.mjs")
  assert.notEqual(bad.status, 0)
  assert.match(bad.stderr, /TypeError: Cannot read properties of undefined/)
})
test("F03 浅复制反例与改变嵌套字段的练习修复", () => {
  const bad = run("failures/shallow-copy.mjs")
  assert.equal(bad.status, 0)
  assert.equal(bad.stdout, "山顶\n")
  const trip = { days: 3, stop: { name: "山脚" } }
  const fixed = { ...trip, stop: { ...trip.stop, name: "山顶" } }
  assert.notEqual(fixed.stop, trip.stop)
  assert.equal(trip.stop.name, "山脚")
  assert.equal(fixed.stop.name, "山顶")
})

import { createTrip } from "./trips.mjs"
test("F04 模块创建返回独立对象，复用天数边界并传播原因", () => {
  for (const days of [1, 3, 30]) {
    assert.deepEqual(createTrip("山城", days), { destination: "山城", days })
  }
  assert.notEqual(createTrip("山城", 3), createTrip("山城", 3))
  for (const days of [0, 31, -1, 2.5, "3", null, undefined, NaN, Infinity]) {
    assert.throws(() => createTrip("山城", days), { name: "Error", message: validateDays(days) })
  }
})
test("F04 捕获、未捕获和导入失败是不同执行路径", () => {
  const caught = run("modules-demo.mjs")
  assert.equal(caught.status, 0)
  assert.equal(caught.stdout, "山城 3\n创建失败：天数必须在 1 到 30 之间\n入口结束\n")
  const uncaught = run("failures/uncaught.mjs")
  assert.notEqual(uncaught.status, 0)
  assert.equal(uncaught.stdout, "")
  assert.match(uncaught.stderr, /Error: 天数必须在 1 到 30 之间/)
  const wrong = run("failures/wrong-export.mjs")
  assert.notEqual(wrong.status, 0)
  assert.equal(wrong.stdout, "")
  assert.match(wrong.stderr, /does not provide an export named 'createTrips'/)
})

import { loadTrip } from "./async-trips.mjs"
test("F05 async 返回Promise，成功值与拒绝原因分别处理", async () => {
  const pending = loadTrip("t1")
  assert.ok(pending instanceof Promise)
  assert.equal(pending.destination, undefined)
  assert.deepEqual(await pending, { id: "t1", destination: "山城", days: 3 })
  for (const id of ["missing", "", null, 1, undefined])
    await assert.rejects(loadTrip(id), { name: "Error", message: "找不到行程" })
})
test("F05 await 让出当前函数，入口继续，然后恢复与捕获拒绝", () => {
  const result = run("async-demo.mjs")
  assert.equal(result.status, 0)
  assert.equal(result.stdout, "开始读取\n入口继续\n山城 3\n读取失败：找不到行程\n读取结束\n")
  const noAwait = run("failures/no-await.mjs")
  assert.equal(noAwait.status, 0)
  assert.equal(noAwait.stdout, "undefined\n山城\n")
})
test("F05 同步try不能捕获未等待的拒绝，严格模式非零退出", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--unhandled-rejections=strict",
      fileURLToPath(new URL("failures/unhandled-rejection.mjs", import.meta.url)),
    ],
    { encoding: "utf8" },
  )
  assert.notEqual(result.status, 0)
  assert.equal(result.stdout, "入口已离开 try\n")
  assert.match(result.stderr, /Error: 找不到行程/)
})
