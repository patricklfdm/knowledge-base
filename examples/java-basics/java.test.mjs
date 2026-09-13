import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { javaFixture, sourceText } from "./tools.mjs"

function fixture(t) {
  const f = javaFixture()
  t.after(() => f.close())
  return f
}
function successful(r) {
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim()
}

test("真实javac编译并由JVM启动；默认值、中文及含空格参数", (t) => {
  const f = fixture(t)
  successful(f.compile())
  assert.ok(existsSync(join(f.out, "TripSummary.class")))
  assert.equal(successful(f.run()), "山城: 3天")
  assert.equal(successful(f.run("TripSummary", ["海湾 城"])), "海湾 城: 3天")
})

test("类型错误发生在编译阶段，空输出目录没有可运行class", (t) => {
  const f = fixture(t)
  writeFileSync(f.source, sourceText.replace("int days = 3;", 'int days = "3";'))
  const bad = f.compile()
  assert.notEqual(bad.status, 0)
  assert.match(bad.stderr, /incompatible types/)
  assert.equal(existsSync(join(f.out, "TripSummary.class")), false)
})

test("编译成功不保证启动成功：错类路径、错类名和缺少main", (t) => {
  const f = fixture(t)
  successful(f.compile())
  for (const result of [f.run("MissingClass"), f.run("TripSummary", [], f.dir)]) {
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Could not find or load main class/)
  }
  const noMain = join(f.dir, "NoMain.java")
  writeFileSync(noMain, "public class NoMain {}\n")
  successful(f.compile(noMain))
  const result = f.run("NoMain")
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Main method not found/)
})

test("改源码不自动改变已有class；重编译后更新，失败编译不删除旧产物", (t) => {
  const f = fixture(t)
  successful(f.compile())
  writeFileSync(f.source, sourceText.replace("int days = 3;", "int days = 5;"))
  assert.equal(successful(f.run()), "山城: 3天")
  successful(f.compile())
  assert.equal(successful(f.run()), "山城: 5天")
  writeFileSync(f.source, sourceText.replace("int days = 3;", 'int days = "bad";'))
  assert.notEqual(f.compile().status, 0)
  assert.equal(successful(f.run()), "山城: 5天")
})

test("public类与源文件名不匹配会编译失败", (t) => {
  const f = fixture(t)
  const wrong = join(f.dir, "WrongName.java")
  writeFileSync(wrong, sourceText)
  const result = f.compile(wrong)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /should be declared in a file named TripSummary.java/)
})

test("独立演示确实编译/启动，夹具产物可清理；缺JDK不跳过", () => {
  const demo = fileURLToPath(new URL("./demo.mjs", import.meta.url))
  const r = spawnSync(process.execPath, [demo, "雪原"], { encoding: "utf8", timeout: 20000 })
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stdout.trim(), "雪原: 3天")
  const f = javaFixture()
  successful(f.compile())
  f.close()
  assert.equal(existsSync(f.dir), false)
  const missing = spawnSync(process.execPath, [demo], {
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, KB_JAVA_HOME: "", JAVA_HOME: "" },
  })
  assert.ifError(missing.error)
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /Set KB_JAVA_HOME or JAVA_HOME/)
})
