import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { stringify } from "yaml"
import { checkContent } from "../../scripts/knowledge-base/check.mjs"

const base = {
  id: "one",
  title: "标题",
  description: "学习目标",
  note_type: "concept",
  level: "L0",
  status: "reviewed",
  draft: false,
  publish: true,
  prerequisites: [],
  topics: ["js"],
  tested_with: [],
  verified_on: "2026-09-11",
}
function fixture(t, entries) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kb-check-"))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const [name, { meta = base, body = "## 中文标题\n" }] of Object.entries(entries)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
    fs.writeFileSync(path.join(root, name), `---\n${stringify(meta)}---\n${body}`)
  }
  return root
}
const cases = [
  ["缺标题", { title: undefined }, "REQUIRED"],
  ["缺正文数组", { tested_with: undefined }, "REQUIRED_ARRAY"],
  ["字符串 publish", { publish: "false" }, "BOOLEAN"],
  ["字符串 draft", { draft: "false" }, "BOOLEAN"],
  ["草稿却发布", { status: "draft", draft: true, publish: true, verified_on: null }, "DRAFT_STATE"],
  ["seed 正文", { status: "seed" }, "SEED"],
  ["无效日期", { verified_on: "2026-02-30" }, "VERIFIED_DATE"],
  ["缺核验", { verified_on: null }, "VERIFIED_DATE"],
  ["更新却发布", { status: "needs-update" }, "UPDATE_STATE"],
  ["非法数组", { tags: [""] }, "ARRAY"],
  ["未知先修", { prerequisites: ["missing"] }, "UNKNOWN_PREREQUISITE"],
  ["自依赖", { prerequisites: ["one"] }, "SELF_PREREQUISITE"],
  ["重复先修", { prerequisites: ["two", "two"] }, "DUPLICATE_PREREQUISITE"],
]
for (const [name, patch, code] of cases)
  test(name, (t) => {
    const root = fixture(t, { "one.md": { meta: { ...base, ...patch } } })
    assert.ok(checkContent(root).errors.some((e) => e.includes(code)))
  })
test("种子导航兼容，代码伪链接忽略，中文重复标题与引用式链接有效", (t) => {
  const root = fixture(t, {
    "index.md": {
      meta: {
        id: "home",
        title: "导航",
        description: "入口",
        note_type: "navigation",
        status: "seed",
        draft: false,
        publish: true,
      },
      body: "[正文](topic/one.md#中文标题-1)\n\n`[[假链接]]`\n\n```md\n[假链接](missing.md)\n```\n",
    },
    "topic/one.md": { body: "## 中文标题\n## 中文标题\n[回去][home]\n\n[home]: ../index.md\n" },
  })
  assert.deepEqual(checkContent(root).errors, [])
})
test("缺省 publish 撤下，草稿允许 null 日期", (t) => {
  const root = fixture(t, {
    "one.md": {
      meta: { ...base, status: "draft", draft: true, publish: undefined, verified_on: null },
    },
  })
  assert.deepEqual(checkContent(root).errors, [])
})
for (const [name, body, code] of [
  ["不存在正文", "[无](missing.md)", "MISSING_LINK"],
  ["锚点不存在", "[无](#不存在)", "MISSING_ANCHOR"],
  ["大小写错误", "[无](ONE.md)", "CASE_MISMATCH"],
  ["根路径", "[无](/one)", "ABSOLUTE_LINK"],
  ["不支持 wiki", "[[one]]", "UNSUPPORTED_OBSIDIAN"],
  ["不支持 HTML", '<a href="missing">链接</a>', "UNSUPPORTED_HTML"],
  ["不支持内部 query", "[无](one.md?x=1)", "UNSUPPORTED_QUERY"],
  ["危险协议", "[无](javascript:alert)", "UNSUPPORTED_URL"],
])
  test(name, (t) => {
    const root = fixture(t, { "one.md": { body } })
    assert.ok(checkContent(root).errors.some((e) => e.includes(code)))
  })
test("重复 ID、别名冲突、环", (t) => {
  const root = fixture(t, {
    "one.md": { meta: { ...base, prerequisites: ["two"], aliases: ["two"] } },
    "two.md": { meta: { ...base, id: "two", prerequisites: ["one"] } },
    "three.md": { meta: base },
  })
  for (const code of ["DUPLICATE_ID", "ALIAS_COLLISION", "PREREQUISITE_CYCLE"])
    assert.ok(checkContent(root).errors.some((e) => e.includes(code)))
})
test("公开必要先修与正文不能指向禁发页面", (t) => {
  const root = fixture(t, {
    "one.md": { meta: { ...base, prerequisites: ["two"] }, body: "[先修](two.md)" },
    "two.md": { meta: { ...base, id: "two", publish: false } },
  })
  for (const code of ["UNPUBLISHED_PREREQUISITE", "UNPUBLISHED_LINK"])
    assert.ok(checkContent(root).errors.some((e) => e.includes(code)))
})
test("含空格与 URL 编码的中文路径", (t) => {
  const root = fixture(t, {
    "one.md": { body: "[中文](%E4%B8%AD%E6%96%87%20%E9%A1%B5.md#中文标题)" },
    "中文 页.md": { meta: { ...base, id: "two" } },
  })
  assert.deepEqual(checkContent(root).errors, [])
})
test("CLI 对坏内容返回非零，正常内容返回零", (t) => {
  const root = fixture(t, { "one.md": { body: "[无](missing.md)" } })
  const run = () =>
    spawnSync(process.execPath, ["scripts/knowledge-base/check.mjs", root], { encoding: "utf8" })
  assert.equal(run().status, 1)
  fs.writeFileSync(path.join(root, "one.md"), `---\n${stringify(base)}---\n## 标题\n`)
  assert.equal(run().status, 0)
})

test("空 frontmatter、非法 YAML 和附件均明确拒绝", (t) => {
  const root = fixture(t, { "one.md": {} })
  fs.writeFileSync(path.join(root, "missing-front.md"), "# 缺 frontmatter")
  fs.writeFileSync(path.join(root, "broken.md"), "---\ntitle: [\n---\n")
  fs.writeFileSync(path.join(root, "asset.png"), "synthetic")
  for (const code of ["FRONTMATTER", "YAML", "UNSUPPORTED_ASSET"])
    assert.ok(checkContent(root).errors.some((e) => e.includes(code)))
})
test("歧义 shortest 链接和 slug 冲突拒绝；普通别名链接通过", (t) => {
  const root = fixture(t, {
    "index.md": { meta: { ...base, id: "home" }, body: "[歧义](one.md)" },
    "a/one.md": { meta: { ...base, aliases: ["redirect"] }, body: "[别名](redirect)" },
    "b/one.md": { meta: { ...base, id: "two" } },
  })
  assert.ok(checkContent(root).errors.some((e) => e.includes("AMBIGUOUS_LINK")))
  assert.equal(checkContent(root).errors.filter((e) => e.startsWith("a/one.md:")).length, 0)
  fs.writeFileSync(path.join(root, "index.md"), `---\n${stringify({ ...base, id: "home" })}---\n`)
  // Folder-note collisions are reproducible on macOS and Linux.
  fs.mkdirSync(path.join(root, "folder"))
  fs.writeFileSync(
    path.join(root, "folder/folder.md"),
    `---\n${stringify({ ...base, id: "four" })}---\n`,
  )
  fs.writeFileSync(
    path.join(root, "folder/index.md"),
    `---\n${stringify({ ...base, id: "five" })}---\n`,
  )
  assert.ok(checkContent(root).errors.some((e) => e.includes("SLUG_COLLISION")))
})
