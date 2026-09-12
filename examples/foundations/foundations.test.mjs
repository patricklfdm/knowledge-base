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
