import test from "node:test"
import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { javaFixture } from "./tools.mjs"
import { lessonSource } from "./lesson.mjs"

function fixture(t, name) {
  const f = javaFixture()
  t.after(() => f.close())
  const source = lessonSource(f, name)
  const r = f.compile(source)
  assert.equal(r.status, 0, r.stderr)
  return f
}
function result(f, args, code, out, err) {
  const r = f.run("DaysInput", args)
  assert.equal(r.status, code, r.stderr)
  assert.equal(r.stdout.trim(), out)
  assert.equal(r.stderr.trim(), err)
}

test("数值运算实测：拼接、整除向零、浮点提升、溢出前后转换", (t) => {
  const f = fixture(t, "NumericValues")
  const r = f.run("NumericValues")
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(r.stdout.trim().split(/\r?\n/), [
    "5",
    "天数: 32",
    "天数: 5",
    "2",
    "2.5",
    "-2",
    "true",
    "-2147483648",
    "2147483648",
  ])
})
test("Java条件必须为boolean，整数条件不能编译", (t) => {
  const f = fixture(t, "NumericValues")
  const bad = join(f.dir, "BadCondition.java")
  writeFileSync(
    bad,
    "public class BadCondition { public static void main(String[] args) { if (3) {} } }",
  )
  const r = f.compile(bad)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /incompatible types/)
})
test("合法天数、两端点与前导零，成功后才输出", (t) => {
  const f = fixture(t, "DaysInput")
  for (const [raw, n] of [
    ["1", 1],
    ["3", 3],
    ["30", 30],
    ["03", 3],
  ])
    result(f, [raw], 0, `已验证天数: ${n}`, "")
})
test("词法失败：空白、符号、小数、混合字符、非ASCII数字均无成功输出", (t) => {
  const f = fixture(t, "DaysInput")
  for (const raw of ["", " ", " 3", "3\n", "+3", "-1", "3.0", "3x", "٣", "３"])
    result(f, [raw], 2, "", "天数只能包含ASCII数字0–9，不能为空")
})
test("int表示范围与业务范围是不同错误，边界外一格不放行", (t) => {
  const f = fixture(t, "DaysInput")
  for (const raw of ["0", "31", "2147483647"]) result(f, [raw], 2, "", "天数必须在1–30之间")
  for (const raw of ["2147483648", "9".repeat(40)]) result(f, [raw], 2, "", "天数超出int表示范围")
})
test("直接Java调用：null拒绝、失败无赋值、成功后可继续；parseInt语法更宽", (t) => {
  const f = fixture(t, "DaysInput")
  const probe = join(f.dir, "InputProbe.java")
  writeFileSync(
    probe,
    `public class InputProbe {
    public static void main(String[] args) {
      int current = 5;
      for (String raw : new String[] {null, "31", "bad"}) {
        try { current = DaysInput.parse(raw); throw new AssertionError("accepted invalid input"); }
        catch (IllegalArgumentException expected) { }
        if (current != 5) throw new AssertionError("changed previous value");
      }
      String raw = "03";
      if (DaysInput.parse(raw) != 3 || !raw.equals("03")) throw new AssertionError("input changed");
      if (Integer.parseInt("+3") != 3 || Integer.parseInt("٣") != 3) throw new AssertionError("parser contrast");
      current = DaysInput.parse("30");
      if (current != 30) throw new AssertionError("valid after invalid");
      System.out.println("pure boundary PASS");
    }
  }`,
  )
  const compiled = f.compile([lessonSource(f, "DaysInput"), probe])
  assert.equal(compiled.status, 0, compiled.stderr)
  const r = f.run("InputProbe")
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stdout.trim(), "pure boundary PASS")
})
test("CLI参数个数必须准确，不能漏传或静默忽略多余输入", (t) => {
  const f = fixture(t, "DaysInput")
  for (const args of [[], ["3", "4"]]) result(f, args, 2, "", "用法: DaysInput <天数>")
  assert.throws(() => lessonSource(f, "../unmaintained"), /Unknown maintained lesson/)
})
test("Node入口传递真实Java成功与失败退出码，不把错误改为成功", () => {
  const entry = fileURLToPath(new URL("./input-demo.mjs", import.meta.url))
  for (const [raw, code, out, err] of [
    ["3", 0, "已验证天数: 3", ""],
    ["31", 2, "", "天数必须在1–30之间"],
  ]) {
    const r = spawnSync(process.execPath, [entry, raw], { encoding: "utf8", timeout: 20000 })
    assert.ifError(r.error)
    assert.equal(r.status, code, r.stderr)
    assert.equal(r.stdout.trim(), out)
    assert.equal(r.stderr.trim(), err)
  }
})
