import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { parseTrip } from "./trip.ts"

const cwd = fileURLToPath(new URL(".", import.meta.url))
function run(file, args = []) {
  return spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url)), ...args], {
    cwd,
    encoding: "utf8",
  })
}
test("F06 正常类型检查通过，非法赋值被实际编译器拒绝", () => {
  const good = run("node_modules/typescript/bin/tsc", ["--project", "tsconfig.json"])
  assert.equal(good.status, 0, good.stdout + good.stderr)
  const bad = run("node_modules/typescript/bin/tsc", ["--project", "tsconfig.negative.json"])
  assert.notEqual(bad.status, 0)
  assert.match(bad.stdout, /TS2322/)
  assert.match(bad.stdout, /type-error.ts\(1,7\)/)
  const native = run("failures/type-error.ts")
  assert.equal(native.status, 0)
  assert.equal(native.stdout, "31\n")
})
test("F06 断言不转换类型，正确入口则拒绝字符串天数", () => {
  const assertion = run("assertion-demo.ts")
  assert.equal(assertion.status, 0)
  assert.equal(assertion.stdout, "string\n31\n")
  const demo = run("demo.ts")
  assert.equal(demo.status, 0)
  assert.equal(demo.stdout, "山城 3\n拒绝：天数必须是数字\n")
})
test("F06 边界有效且返回新对象，只保留允许的属性", () => {
  for (const days of [1, 3, 30]) {
    const input = { destination: " 山城 ", days, extra: "ignored" }
    const result = parseTrip(input)
    assert.deepEqual(result, { destination: "山城", days })
    assert.notEqual(result, input)
    assert.equal(input.destination, " 山城 ")
  }
})
test("F06 拒绝不符合对象、字段和业务约束的外部数据", () => {
  for (const input of [null, undefined, [], "trip", 3, true])
    assert.throws(() => parseTrip(input), /输入必须是行程对象/)
  for (const destination of [undefined, null, 3, [], {}])
    assert.throws(() => parseTrip({ destination, days: 3 }), /目的地必须是文字/)
  for (const destination of ["", " ", "\t\n"])
    assert.throws(() => parseTrip({ destination, days: 3 }), /目的地不能为空/)
  for (const days of [undefined, null, "3", true, []])
    assert.throws(() => parseTrip({ destination: "海边", days }), /天数必须是数字/)
  for (const days of [0, -1, 31, 2.5, NaN, Infinity])
    assert.throws(() => parseTrip({ destination: "海边", days }), /天数必须是1到30的整数/)
  assert.throws(() => parseTrip({}), /目的地必须是文字/)
  assert.throws(() => parseTrip({ destination: "海边" }), /天数必须是数字/)
})
