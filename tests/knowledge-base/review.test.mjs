import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { reviewContent } from "../../scripts/knowledge-base/review.mjs"

const asOf = "2026-09-13"
const fixture = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kb review "))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), value)
  }
  write(
    "content/note.md",
    `---
id: example-note
title: 复核夹具
description: 合成示例，不是真实用户反馈。
note_type: concept
status: reviewed
draft: false
publish: true
level: L0
prerequisites: []
topics: [test]
tested_with: [Node.js 24.21.0, CPython 3.13.0, Microsoft OpenJDK 21.0.11+10, SQLite 3.47.1]
verified_on: 2026-03-17
---
[来源](https://example.com/docs)
[重复来源][official]
[official]: https://example.com/docs

\`https://example.com/inline-code\`

\`\`\`md
[示意](https://example.com/code)
\`\`\`
`,
  )
  for (const f of [".nvmrc", ".node-version"]) write(f, "24.21.0\n")
  for (const name of ["python-basics", "data-pipeline", "search-lab"])
    write(`examples/${name}/.python-version`, "3.13.0\n")
  write("examples/java-basics/.java-version", "21.0.11\n")
  write(
    "docs/knowledge-base/codex/BACKLOG.json",
    JSON.stringify({ tasks: [{ id: "TEST-1", status: "done" }] }),
  )
  write("reports/test.md", "合成复核回执：仅测试用，不代表真实用户提交。\n")
  const observations = (entries) =>
    write(
      "docs/knowledge-base/maintenance/observations.json",
      JSON.stringify({ schema_version: 1, observations: entries }),
    )
  observations([])
  const editNote = (before, after) =>
    write(
      "content/note.md",
      fs.readFileSync(path.join(root, "content/note.md"), "utf8").replace(before, after),
    )
  return {
    root,
    write,
    observations,
    editNote,
    review: (options = {}) => reviewContent(root, { asOf, ...options }),
  }
}
const receipt = (extra = {}) => ({
  id: "synthetic-feedback",
  kind: "feedback",
  observed_on: asOf,
  note_ids: ["example-note"],
  summary: "测试反馈分诊，不是真实用户反馈",
  evidence: ["reports/test.md"],
  backlog_id: null,
  ...extra,
})
function snapshot(root) {
  return Object.fromEntries(
    fs
      .readdirSync(root, { recursive: true })
      .sort()
      .filter((f) => fs.statSync(path.join(root, f)).isFile())
      .map((f) => [f, fs.readFileSync(path.join(root, f), "hex")]),
  )
}

test("到期边界180日提醒，179日不提醒；重复运行字节只读且日期不刷新", (t) => {
  const f = fixture(t),
    before = snapshot(f.root)
  assert.equal(f.review({ asOf: "2026-09-12" }).candidates.length, 0)
  assert.deepEqual(f.review().candidates, [
    { kind: "age", note_id: "example-note", verified_on: "2026-03-17", age_days: 180 },
  ])
  assert.deepEqual(f.review(), f.review())
  assert.deepEqual(snapshot(f.root), before)
})

test("无效日期/未来核验/零间隔拒绝，闰日与自定义间隔可重放", (t) => {
  const f = fixture(t)
  assert.throws(() => f.review({ asOf: "2026-02-30" }), /REVIEW_DATE/)
  assert.throws(() => f.review({ maxAgeDays: 0 }), /REVIEW_INTERVAL/)
  assert.throws(() => f.review({ maxAgeDays: 1.5 }), /REVIEW_INTERVAL/)
  assert.throws(() => f.review({ asOf: "2026-03-16" }), /REVIEW_FUTURE/)
  f.editNote("2026-03-17", "2024-02-29")
  assert.equal(f.review({ asOf: "2024-03-01", maxAgeDays: 1 }).candidates[0].age_days, 1)
})

test("固定运行时差异只是候选，未知库版本保留未比较；不伪造升级证明", (t) => {
  const f = fixture(t)
  assert.equal(f.review().candidates.filter((c) => c.kind === "runtime").length, 0)
  f.editNote("Node.js 24.21.0", "Node.js 22.1.0")
  f.editNote("CPython 3.13.0", "Python 3.12.0")
  f.editNote("21.0.11+10", "21.0.10+9")
  const r = f.review()
  assert.deepEqual(
    r.candidates.filter((c) => c.kind === "runtime").map((c) => [c.runtime, c.tested, c.pinned]),
    [
      ["node", "22.1.0", "24.21.0"],
      ["python", "3.12.0", "3.13.0"],
      ["java", "21.0.10", "21.0.11"],
    ],
  )
  assert.deepEqual(r.unCompared, [{ note_id: "example-note", tested_with: "SQLite 3.47.1" }])
  f.write("examples/search-lab/.python-version", "3.14.0")
  assert.throws(() => f.review(), /REVIEW_RUNTIME/)
})

test("Markdown外链清单识别引用式链接，去重保留位置，忽略行内/围栏代码且不联网", (t) => {
  const f = fixture(t)
  const r = f.review()
  assert.equal(r.external_links.length, 1)
  assert.equal(r.external_links[0].url, "https://example.com/docs")
  assert.equal(r.external_links[0].references.length, 2)
  assert.ok(r.external_links[0].references.every((ref) => /^note\.md:\d+$/.test(ref.location)))
  assert.equal(r.network, "NOT_RUN")
  assert.equal(r.writes, "NONE")
  f.editNote("https://example.com/docs", "https://user:secret@example.com/docs")
  assert.throws(() => f.review(), /REVIEW_URL/)
})

test("反馈先分诊再关联唯一BACKLOG；来源观测不等于当前健康检查", (t) => {
  const f = fixture(t)
  f.observations([receipt()])
  assert.ok(f.review().candidates.some((c) => c.kind === "untriaged-observation"))
  f.observations([
    receipt({ backlog_id: "TEST-1" }),
    receipt({
      id: "historical-403",
      kind: "external-link",
      url: "https://example.com/docs",
      backlog_id: "TEST-1",
    }),
  ])
  const before = snapshot(f.root),
    r = f.review()
  assert.equal(r.observations.length, 2)
  assert.ok(!r.candidates.some((c) => c.kind === "untriaged-observation"))
  assert.equal(r.network, "NOT_RUN")
  assert.deepEqual(snapshot(f.root), before)
})

test("缺证据/不存在的ID/伪状态/未知来源/未来观测等失败仍不写任何文件", (t) => {
  const f = fixture(t)
  for (const changes of [
    { evidence: [] },
    { evidence: ["reports/absent.md"] },
    { evidence: ["../outside.md"] },
    { note_ids: ["absent"] },
    { note_ids: ["example-note", "example-note"] },
    { backlog_id: "ABSENT" },
    { status: "done" },
    { kind: "automatic-verified" },
    { observed_on: "2026-09-14" },
    { observed_on: "2026-02-30" },
    { summary: " " },
    { id: "" },
    { kind: "external-link", url: "https://example.com/not-cited" },
  ]) {
    f.observations([receipt(changes)])
    const before = snapshot(f.root)
    assert.throws(() => f.review(), undefined, JSON.stringify(changes))
    assert.deepEqual(snapshot(f.root), before)
  }
  f.observations([receipt(), receipt()])
  assert.throws(() => f.review(), /id缺失、非法或重复/)
  f.observations([receipt()])
  f.write("reports/test.md", " ")
  assert.throws(() => f.review(), /REVIEW_EVIDENCE/)
})

test("不跟随观测证据和内容符号链接，元数据错误阻止复核成功", (t) => {
  const f = fixture(t)
  f.observations([receipt()])
  fs.symlinkSync(path.join(f.root, "reports/test.md"), path.join(f.root, "reports/link.md"))
  f.observations([receipt({ evidence: ["reports/link.md"] })])
  assert.throws(() => f.review(), /REVIEW_PATH/)
  f.observations([])
  fs.symlinkSync(path.join(f.root, "content/note.md"), path.join(f.root, "content/link.md"))
  assert.throws(() => f.review(), /SYMLINK/)
  fs.unlinkSync(path.join(f.root, "content/link.md"))
  f.editNote("publish: true", "publish: 'true'")
  assert.throws(() => f.review(), /BOOLEAN/)
})

test("CLI候选不阻止发布，非法输入非零退出；JSON与API结果一致", (t) => {
  const f = fixture(t),
    script = path.resolve("scripts/knowledge-base/review.mjs")
  const cli = (...args) =>
    spawnSync(process.execPath, [script, "--root", f.root, ...args], { encoding: "utf8" })
  const before = snapshot(f.root),
    result = cli("--as-of", asOf, "--json")
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), f.review())
  for (const args of [
    ["--write"],
    ["--as-of"],
    ["--as-of", "bad-date"],
    ["--max-age-days", "Infinity"],
    ["--max-age-days", "1.5"],
    ["--json", "--json"],
  ])
    assert.equal(cli(...args).status, 1, args.join(" "))
  assert.deepEqual(snapshot(f.root), before)
})

test("合成反馈闭环：坏教材链接先失败，修复并关联报告后通过，局部修复不刷新日期", (t) => {
  const f = fixture(t)
  f.observations([receipt()])
  f.editNote("[来源](https://example.com/docs)", "[下一篇](absent.md)")
  assert.throws(() => f.review(), /MISSING_LINK/)
  f.editNote("[下一篇](absent.md)", "[来源](https://example.com/docs)")
  f.write(
    "reports/test.md",
    "合成读者任务：反馈中的absent.md先触发MISSING_LINK；修复后通过，局部链接修复不刷新整篇verified_on。\n",
  )
  f.observations([receipt({ backlog_id: "TEST-1" })])
  assert.equal(f.review().candidates.length, 1)
  assert.equal(f.review().candidates[0].verified_on, "2026-03-17")
  assert.ok(fs.readFileSync(path.join(f.root, "reports/test.md"), "utf8").includes("MISSING_LINK"))
})

test("Java四段补丁号参与比较，不截断或落入未比较清单", (t) => {
  const f = fixture(t)
  f.editNote("21.0.11+10", "21.0.12.1+1")
  const mismatch = f.review()
  assert.deepEqual(mismatch.candidates.filter((c) => c.kind === "runtime").map((c) => [c.tested, c.pinned]), [["21.0.12.1", "21.0.11"]])
  assert.ok(!mismatch.unCompared.some((c) => c.tested_with.includes("Microsoft")))
  f.write("examples/java-basics/.java-version", "21.0.12.1\n")
  assert.equal(f.review().candidates.filter((c) => c.kind === "runtime").length, 0)
  f.editNote("21.0.12.1+1", "21.0.12+8")
  assert.equal(f.review().candidates.find((c) => c.kind === "runtime").tested, "21.0.12")
})

test("四段支持只给Java，错误固定版本仍然失败", (t) => {
  const f = fixture(t)
  for (const value of ["21.0.12.1.2", "21.0.12.1-ea", "21.0.12.1+1", "21.0.12."]) {
    f.write("examples/java-basics/.java-version", value)
    assert.throws(() => f.review(), /REVIEW_RUNTIME/)
  }
  f.write("examples/java-basics/.java-version", "21.0.12.1")
  f.write(".nvmrc", "24.21.0.1")
  f.write(".node-version", "24.21.0.1")
  assert.throws(() => f.review(), /REVIEW_RUNTIME/)
})
