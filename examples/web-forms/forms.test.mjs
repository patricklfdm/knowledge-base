import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { parseTripFields } from "./fields.js"

test("成功及边界：去除首尾空白、返回数字、允许前导零", () => {
  for (const value of ["1", "3", "30", "03", " 3 "]) {
    assert.deepEqual(parseTripFields(" 山城 ", value), { destination: "山城", days: Number(value) })
  }
})
test("拒绝缺失与非字符串字段，包括文件式对象", () => {
  for (const value of [null, undefined, 3, {}, [], { name: "sample.txt" }]) {
    assert.throws(() => parseTripFields(value, "3"), /文字字段/)
    assert.throws(() => parseTripFields("山城", value), /文字字段/)
  }
})
test("空白、不同数字格式及业务范围分别失败", () => {
  assert.throws(() => parseTripFields(" \n ", "3"), /目的地不能为空/)
  for (const value of [
    "",
    " ",
    "3.0",
    "2.5",
    "3e0",
    "+3",
    "-1",
    "0x03",
    "三",
    "３",
    "3天",
    "1 2",
    "NaN",
    "Infinity",
  ]) {
    assert.throws(() => parseTripFields("山城", value), /十进制整数文字/)
  }
  for (const value of ["0", "31", "999", "9".repeat(400)]) {
    assert.throws(() => parseTripFields("山城", value), /1到30/)
  }
})
test("返回独立对象，输入文字不变；HTML样式文字不被校验层改写", () => {
  const destination = " <b>山城</b> "
  const first = parseTripFields(destination, "3")
  const second = parseTripFields(destination, "3")
  first.days = 8
  assert.equal(second.days, 3)
  assert.equal(destination, " <b>山城</b> ")
  assert.equal(second.destination, "<b>山城</b>")
  // 安全渲染由页面 textContent 负责，这不是浏览器注入防护实测。
})
test("终端入口正常输出，未捕获非法输入以非零退出", () => {
  const run = (file) =>
    spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], {
      encoding: "utf8",
    })
  const good = run("./demo.mjs")
  assert.equal(good.status, 0)
  assert.equal(good.stdout, "山城 3 number\n拒绝：天数请填写十进制整数文字，例如3\n")
  const bad = run("./failure.mjs")
  assert.notEqual(bad.status, 0)
  assert.match(bad.stderr, /天数必须是1到30的整数/)
})
