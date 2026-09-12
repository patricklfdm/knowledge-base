import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { parse } from "yaml"

const read = (file) => parse(fs.readFileSync(file, "utf8"))
function assertProtected(publish, checks) {
  assert.equal(publish.jobs.quality.uses, "./.github/workflows/knowledge-base-checks.yml")
  assert.equal(publish.jobs.build.needs, "quality")
  assert.equal(publish.jobs.deploy.needs, "build")
  assert.match(publish.jobs.build.if, /refs\/heads\/v5/)
  assert.ok(Object.hasOwn(checks.on, "workflow_call"))
  assert.equal(checks.permissions.contents, "read")
  for (const workflow of [publish, checks])
    for (const job of Object.values(workflow.jobs)) {
      assert.ok(!job["continue-on-error"])
      assert.ok(!job.if?.includes("always()"))
      for (const step of job.steps ?? []) {
        assert.ok(!step["continue-on-error"])
        assert.ok(!step.if, "必需步骤不能被条件跳过")
        assert.ok(!/\|\|\s*(true|:)|exit 0/.test(step.run ?? ""))
        if (step.uses?.startsWith("actions/checkout"))
          assert.ok(!step.with?.ref, "同一提交 checkout，不能改 ref")
      }
    }
  const commands = checks.jobs.verify.steps.map((s) => s.run)
  for (const command of ["npm ci", "npm run kb:verify", "npm test"])
    assert.ok(commands.includes(command))
  assert.ok(publish.jobs.build.steps.some((s) => s.run === "npm run kb:output"))
}

test("部署显式依赖同提交可复用门禁，且破坏依赖会被检测", () => {
  const publish = read(".github/workflows/publish-knowledge-base.yml")
  const checks = read(".github/workflows/knowledge-base-checks.yml")
  assertProtected(publish, checks)
  const broken = structuredClone(publish)
  delete broken.jobs.build.needs
  assert.throws(() => assertProtected(broken, checks))
  const skipped = structuredClone(checks)
  skipped.jobs.verify.steps.find((s) => s.run === "npm run kb:verify")["continue-on-error"] = true
  assert.throws(() => assertProtected(publish, skipped))
})
test("校验器假设与配置保持一致，过滤与主题保护不变", () => {
  const config = read("quartz.config.yaml")
  for (const name of ["remove-draft", "explicit-publish", "github-flavored-markdown"])
    assert.equal(config.plugins.find((p) => p.source === "@quartz-community/" + name).enabled, true)
  assert.equal(config.plugins.find((p) => p.source === "@quartz-themes/core").enabled, false)
  assert.equal(
    config.plugins.find((p) => p.source === "@quartz-community/crawl-links").options
      .markdownLinkResolution,
    "shortest",
  )
  assert.deepEqual(config.configuration.ignorePatterns, [
    "private",
    "templates",
    ".obsidian",
    ".trash",
  ])
  assert.equal(config.configuration.baseUrl, "patricklfdm.github.io/knowledge-base")
  assert.equal(
    fs.readFileSync(".node-version", "utf8").trim(),
    fs.readFileSync(".nvmrc", "utf8").trim(),
  )
})
