import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { checkOutput, findMarkers } from "../../scripts/knowledge-base/check-output.mjs"

test("真实 DOM 检查 base path、资源与锚点，marker 检查二进制及索引", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kb-output-"))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, "static"))
  fs.writeFileSync(
    path.join(root, "index.html"),
    '<h2 id="中文">标题</h2><a href="#中文">同页</a><a href="next">下一页</a>',
  )
  fs.writeFileSync(path.join(root, "next.html"), '<a href="./">首页</a>')
  fs.writeFileSync(path.join(root, "404.html"), '<a href="/knowledge-base/">首页</a>')
  fs.writeFileSync(path.join(root, "static/contentIndex.json"), "{}")
  assert.deepEqual(checkOutput(root).errors, [])
  fs.appendFileSync(
    path.join(root, "index.html"),
    '<a href="/next">错 base</a><img src="absent.png"><a href="next#absent">错锚点</a>',
  )
  for (const code of ["BASE_PATH", "OUTPUT_LINK", "OUTPUT_ANCHOR"])
    assert.ok(checkOutput(root).errors.some((e) => e.includes(code)))
  fs.writeFileSync(path.join(root, "static/contentIndex.json"), '{"text":"FORBIDDEN_TEST"}')
  assert.equal(findMarkers(root, ["FORBIDDEN_TEST"]).length, 1)
  fs.writeFileSync(
    path.join(root, "test.bin"),
    Buffer.from([0, ...Buffer.from("FORBIDDEN_TEST"), 255]),
  )
  assert.equal(findMarkers(root, ["FORBIDDEN_TEST"]).length, 2)
})
