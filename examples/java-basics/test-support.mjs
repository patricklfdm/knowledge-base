import assert from "node:assert/strict"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { javaFixture } from "./tools.mjs"
import { lessonSource } from "./lesson.mjs"
export function compiled(t, names) {
  const f = javaFixture()
  t.after(() => f.close())
  f.sources = names.map((name) => lessonSource(f, name))
  const r = f.compile(f.sources)
  assert.equal(r.status, 0, r.stderr)
  return f
}
export function probe(f, name, source) {
  const p = join(f.dir, `${name}.java`)
  writeFileSync(p, source)
  return f.compile([...f.sources, p])
}
export function lines(f, name, args = []) {
  const r = f.run(name, args)
  assert.equal(r.status, 0, r.stderr)
  return r.stdout.trim().split(/\r?\n/)
}
