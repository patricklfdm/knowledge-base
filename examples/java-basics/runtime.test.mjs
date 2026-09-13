import test from "node:test"
import assert from "node:assert/strict"
import { writeFileSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { compiled, probe, lines } from "./test-support.mjs"
import { javaFixture } from "./tools.mjs"
import { buildJar } from "./packaging.mjs"

test("文件：UTF-8两行读取，第二行失败不交付半份列表，清理自身文件", (t) => {
  const f = compiled(t, ["TripModel", "DaysInput", "FileLesson"])
  assert.deepEqual(lines(f, "FileLesson"), [
    "read=2:山城",
    "第2行无效",
    "preserved=2",
    "cleanup=true",
  ])
})
test("资源：reader成功/解析失败都关闭，空文件/缺列/缺文件/坏UTF-8", (t) => {
  const f = compiled(t, ["TripModel", "DaysInput", "FileLesson"])
  writeFileSync(join(f.dir, "invalid-utf8.tsv"), Buffer.from([0xc3, 0x28]))
  const r = probe(
    f,
    "ReaderProbe",
    `import java.io.*; import java.nio.file.*;
    public class ReaderProbe {
      static class Tracked extends BufferedReader {
        boolean closed;
        Tracked(String s) { super(new StringReader(s)); }
        @Override public void close() throws IOException { closed = true; super.close(); }
      }
      public static void main(String[] args) throws Exception {
        Tracked good = new Tracked("山城\\t3\\n");
        if (FileLesson.readAndClose(good).size() != 1 || !good.closed) throw new AssertionError("success ownership");
        Tracked empty = new Tracked("");
        if (!FileLesson.readAndClose(empty).isEmpty() || !empty.closed) throw new AssertionError("empty ownership");
        for (String text : new String[] {"bad", "山城\\t3\\textra", "山城\\t31"}) {
          Tracked bad = new Tracked(text);
          try { FileLesson.readAndClose(bad); throw new AssertionError("bad accepted"); }
          catch (IOException expected) { if (expected.getCause() == null) throw new AssertionError("lost cause"); }
          if (!bad.closed) throw new AssertionError("reader leaked");
        }
        for (String name : new String[] {"missing.tsv", "invalid-utf8.tsv"}) {
          try { FileLesson.load(Path.of(name)); throw new AssertionError("file accepted"); }
          catch (IOException expected) { }
        }
        System.out.println("resource boundaries PASS");
      }
    }`,
  )
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(lines(f, "ReaderProbe"), ["resource boundaries PASS"])
})
test("try-with-resources逆序关闭，保留主异常与两个suppressed", (t) => {
  const f = compiled(t, ["ResourceLesson"])
  assert.deepEqual(lines(f, "ResourceLesson"), [
    "primary=body failed",
    "suppressed=close B",
    "suppressed=close A",
    "closed=B,A",
  ])
})
test("真实JAR包含两包，在源码和class移走后独立运行", (t) => {
  const f = javaFixture()
  t.after(() => f.close())
  const artifact = buildJar(f)
  const listing = f.jar(["--list", "--file", artifact])
  assert.equal(listing.status, 0, listing.stderr)
  assert.match(listing.stdout, /kb\/app\/Main.class/)
  assert.match(listing.stdout, /kb\/trips\/TripText.class/)
  rmSync(f.out, { recursive: true })
  rmSync(join(f.dir, "src"), { recursive: true })
  const r = f.launch(["-jar", artifact, "海湾 城"])
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stdout.trim(), "行程: 海湾 城")
})
test("JAR缺入口或依赖必须失败；错全限定类名不能启动", (t) => {
  const f = javaFixture()
  t.after(() => f.close())
  buildJar(f)
  for (const [name, extras, pattern] of [
    ["no-main.jar", [], /no main manifest attribute/],
    ["missing-class.jar", ["--main-class", "kb.app.Main"], /NoClassDefFoundError/],
  ]) {
    const artifact = join(f.dir, name)
    const r = f.jar(["--create", "--file", artifact, ...extras, "-C", f.out, "kb/app/Main.class"])
    assert.equal(r.status, 0, r.stderr)
    const launched = f.launch(["-jar", artifact])
    assert.notEqual(launched.status, 0)
    assert.match(launched.stderr, pattern)
  }
  const wrong = f.run("Main")
  assert.notEqual(wrong.status, 0)
  assert.match(wrong.stderr, /Could not find or load main class/)
})
test("新JVM不继承上个进程的static字段；小堆拒绝受控分配且无dump", (t) => {
  const f = compiled(t, ["ProcessLesson"])
  assert.deepEqual(lines(f, "ProcessLesson"), ["counter=1"])
  assert.deepEqual(lines(f, "ProcessLesson"), ["counter=1"])
  const heap = f.launch(["-Xmx32m", "-cp", f.out, "ProcessLesson", "heap"])
  assert.equal(heap.status, 0, heap.stderr)
  assert.ok(Number(heap.stdout) >= 16 * 1024 * 1024 && Number(heap.stdout) <= 40 * 1024 * 1024)
  const oom = f.launch([
    "-Xmx32m",
    "-XX:-HeapDumpOnOutOfMemoryError",
    "-cp",
    f.out,
    "ProcessLesson",
    "oom",
  ])
  assert.notEqual(oom.status, 0)
  assert.match(oom.stderr, /OutOfMemoryError/)
  assert.equal(oom.stdout, "")
  assert.equal(
    readdirSync(f.dir).some((name) => name.endsWith(".hprof")),
    false,
  )
})
