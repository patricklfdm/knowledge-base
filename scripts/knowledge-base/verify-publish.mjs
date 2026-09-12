import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { findMarkers, checkOutput } from "./check-output.mjs"

// Synthetic content only; never copy private notes or execute Markdown code fences.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kb-publish-"))
try {
  const input = path.join(temp, "content"),
    output = path.join(temp, "public")
  fs.mkdirSync(input)
  const markers = [
    "KB_DRAFT_FORBIDDEN_4d7920",
    "KB_UNPUBLISHED_FORBIDDEN_06bb21",
    "KB_DEFAULT_FORBIDDEN_81ba30",
  ]
  fs.writeFileSync(
    path.join(input, "index.md"),
    "---\ntitle: 合成公开页\npublish: true\ndraft: false\n---\nKB_PUBLIC_CONTROL_1a394f\n\n## 中文标题\n[锚点](#中文标题)\n",
  )
  for (const [index, flags] of [
    "draft: true\npublish: true",
    "draft: false\npublish: false",
    "draft: false",
  ].entries()) {
    fs.writeFileSync(
      path.join(input, `excluded-${index}.md`),
      `---\ntitle: ${markers[index]}\n${flags}\ntags: [${markers[index]}]\naliases: [${markers[index]}]\n---\n${markers[index]}\n`,
    )
  }
  const run = spawnSync(
    process.execPath,
    ["quartz/bootstrap-cli.mjs", "build", "-d", input, "-o", output],
    { encoding: "utf8", timeout: 180000 },
  )
  if (run.status !== 0)
    throw new Error(
      `Synthetic build failed (${run.status}): ${run.error?.message ?? ""}\n${run.stdout}\n${run.stderr}`,
    )
  assert.ok(
    fs.readFileSync(path.join(output, "index.html"), "utf8").includes("KB_PUBLIC_CONTROL_1a394f"),
    "正面对照必须实际被构建",
  )
  assert.equal(findMarkers(output, ["KB_PUBLIC_CONTROL_1a394f"]).length > 0, true)
  assert.deepEqual(
    findMarkers(output, markers),
    [],
    "禁发 marker 不得进入任一产物（含 HTML/索引/RSS/sitemap/别名）",
  )
  for (const name of ["sitemap.xml", "index.xml", "static/contentIndex.json"])
    assert.ok(fs.existsSync(path.join(output, name)), `${name} 必须存在，避免空产物伪通过`)
  assert.deepEqual(checkOutput(output).errors, [])
  fs.writeFileSync(path.join(output, "synthetic-leak.txt"), markers[0])
  assert.equal(findMarkers(output, markers).length, 1, "破坏产物后检测器必须发现泄漏")
  console.log(
    "KB publish: public control present; 3 forbidden markers absent from all artifacts; injected leak detected",
  )
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}
