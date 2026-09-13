import test from "node:test"
import assert from "node:assert/strict"
import { compiled, probe, lines } from "./test-support.mjs"

test("对象：别名修改共享状态，显式复制分离，重绑参数不改变调用者", (t) => {
  const f = compiled(t, ["TripModel", "ObjectLesson"])
  assert.deepEqual(lines(f, "ObjectLesson"), [
    "original=5",
    "alias=5",
    "copy=3",
    "same=true",
    "copied=false",
    "text=true",
  ])
})
test("构造与方法守住对象约束，失败保留原值", (t) => {
  const f = compiled(t, ["TripModel"])
  const r = probe(
    f,
    "ModelProbe",
    `public class ModelProbe {
    public static void main(String[] a) {
      TripModel t = new TripModel("山城", 3);
      for (int n : new int[] {0, 31}) {
        try { t.setDays(n); throw new AssertionError("invalid days accepted"); }
        catch (IllegalArgumentException expected) { }
        if (t.days() != 3) throw new AssertionError("mutated before validation");
      }
      for (String name : new String[] {null, "", " "}) {
        try { new TripModel(name, 3); throw new AssertionError("invalid name accepted"); }
        catch (IllegalArgumentException expected) { }
      }
      t.setDays(1); t.setDays(30);
      System.out.println(t.days());
    }
  }`,
  )
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(lines(f, "ModelProbe"), ["30"])
})
test("private字段不能越过方法直接修改", (t) => {
  const f = compiled(t, ["TripModel"])
  const r = probe(
    f,
    "PrivateProbe",
    "public class PrivateProbe { void change(TripModel t) { t.days = 99; } }",
  )
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /private access/)
})
test("集合：结构复制/共享元素/逐元素复制、只读限制、重复和缺失", (t) => {
  const f = compiled(t, ["TripModel", "CollectionLesson"])
  assert.deepEqual(lines(f, "CollectionLesson"), [
    "total=5",
    "sizes=1/2",
    "elements=7/7/3",
    "readonly=blocked",
    "duplicate=blocked",
    "found=山城",
    "missing=true",
    "remaining=0",
  ])
})
test("泛型在编译时拒绝向List<TripModel>添加String", (t) => {
  const f = compiled(t, ["TripModel"])
  const r = probe(
    f,
    "GenericProbe",
    'import java.util.*; public class GenericProbe { void add(List<TripModel> trips) { trips.add("山城"); } }',
  )
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /incompatible types/)
})
test("接口实现可替换，缺失抛受检异常并在CLI转换为失败", (t) => {
  const f = compiled(t, ["TripModel", "ContractLesson"])
  assert.deepEqual(lines(f, "ContractLesson"), ["山城:3", "山城安排3天"])
  const r = f.run("ContractLesson", ["missing"])
  assert.equal(r.status, 2)
  assert.equal(r.stdout, "")
  assert.equal(r.stderr.trim(), "未找到行程: missing")
})
test("调用受检异常的方法必须处理或声明；接口不能漏实现", (t) => {
  const f = compiled(t, ["TripModel", "ContractLesson"])
  const unhandled = probe(
    f,
    "Unhandled",
    'import java.util.Map; public class Unhandled { void run() { ContractLesson.find(Map.of(), "x"); } }',
  )
  assert.notEqual(unhandled.status, 0)
  assert.match(unhandled.stderr, /unreported exception/)
  const incomplete = probe(
    f,
    "Incomplete",
    "public class Incomplete implements ContractLesson.Formatter {}",
  )
  assert.notEqual(incomplete.status, 0)
  assert.match(incomplete.stderr, /does not override/)
})
