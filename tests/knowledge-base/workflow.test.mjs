import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { parse } from "yaml"

const read = (file) => parse(fs.readFileSync(file, "utf8"))

test("只读内容复核是部署门禁必经命令，遗漏或绕过会失败", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
  const verify = (scripts) => {
    const commands = scripts["kb:verify"].split(" && ")
    assert.equal(scripts["kb:review"], "node scripts/knowledge-base/review.mjs")
    assert.equal(commands.filter((c) => c === "npm run kb:review").length, 1)
    assert.ok(commands.indexOf("npm run kb:review") > commands.indexOf("npm run kb:check"))
    assert.ok(commands.indexOf("npm run kb:review") < commands.indexOf("npm run kb:build"))
  }
  verify(pkg.scripts)
  for (const replacement of ["", "npm run kb:review || true && "]) {
    const changed = structuredClone(pkg.scripts)
    changed["kb:verify"] = changed["kb:verify"].replace("npm run kb:review && ", replacement)
    assert.throws(() => verify(changed))
  }
})

test("教材反馈表单包含可定位、可复现的必填项，删除观察字段会被检出", () => {
  const form = read(".github/ISSUE_TEMPLATE/content_feedback.yml")
  const validate = (value) => {
    assert.ok(value.name && value.description && Array.isArray(value.body))
    const fields = value.body.filter((f) => f.type !== "markdown")
    assert.equal(new Set(fields.map((f) => f.id)).size, fields.length)
    for (const id of ["article", "category", "observation"]) {
      const field = fields.find((f) => f.id === id)
      assert.equal(field?.validations?.required, true)
      assert.ok(field.attributes.label)
    }
    assert.ok(fields.some((f) => f.id === "reproduction"))
  }
  validate(form)
  const broken = structuredClone(form)
  broken.body = broken.body.filter((f) => f.id !== "observation")
  assert.throws(() => validate(broken))
})
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
  assert.ok(commands.includes("npm ci --prefix examples/reliable-app"))
  assert.ok(commands.indexOf("npm ci --prefix examples/reliable-app") < commands.indexOf("npm run kb:verify"))
  for (const file of ["package.json", "package-lock.json"])
    assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/reliable-app/" + file)))
  assert.ok(commands.includes("npm ci --prefix examples/distributed-lab"))
  assert.ok(commands.indexOf("npm ci --prefix examples/distributed-lab") < commands.indexOf("npm run kb:verify"))
  for (const file of ["package.json", "package-lock.json"])
    assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/distributed-lab/" + file)))
  assert.ok(commands.includes("npm ci --prefix examples/data-pipeline"))
  assert.ok(commands.indexOf("npm ci --prefix examples/data-pipeline") < commands.indexOf("npm run kb:verify"))
  for (const file of ["package.json", "package-lock.json", ".python-version"])
    assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/data-pipeline/" + file)))
  assert.ok(commands.includes("npm ci --prefix examples/search-lab"))
  assert.ok(commands.indexOf("npm ci --prefix examples/search-lab") < commands.indexOf("npm run kb:verify"))
  for (const file of ["package.json", "package-lock.json", ".python-version"])
    assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/search-lab/" + file)))
  const pythonIndex = checks.jobs.verify.steps.findIndex((s) => s.uses === "actions/setup-python@v6")
  assert.ok(pythonIndex >= 0 && pythonIndex < commands.indexOf("npm run kb:verify"))
  const pythonOptions = checks.jobs.verify.steps[pythonIndex].with
  assert.equal(pythonOptions["python-version-file"], "examples/python-basics/.python-version")
  assert.ok(!Object.hasOwn(pythonOptions, "python-version"))
  assert.ok(commands.includes("npm ci --prefix examples/python-basics"))
  assert.ok(commands.indexOf("npm ci --prefix examples/python-basics") < commands.indexOf("npm run kb:verify"))
  assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/python-basics/package-lock.json") && c.includes("examples/python-basics/.python-version")))
  const javaIndex = checks.jobs.verify.steps.findIndex((s) => s.uses === "actions/setup-java@v6")
  assert.ok(javaIndex >= 0, "Java 示例必须安装固定 JDK，不能依赖 runner 偶然预装")
  assert.ok(javaIndex < commands.indexOf("npm run kb:verify"))
  const javaOptions = checks.jobs.verify.steps[javaIndex].with
  assert.equal(javaOptions.distribution, "microsoft")
  assert.equal(javaOptions["java-version-file"], "examples/java-basics/.java-version")
  assert.ok(!Object.hasOwn(javaOptions, "java-version"), "不能用额外版本参数覆盖版本文件")
  for (const command of [
    "npm ci",
    "npm ci --prefix examples/typed-trips",
    "npm ci --prefix examples/systems-basics",
    "npm run kb:verify",
    "npm test",
  ])
    assert.ok(commands.includes(command))
  assert.ok(
    commands.indexOf("npm ci --prefix examples/typed-trips") <
      commands.indexOf("npm run kb:verify"),
  )
  assert.ok(
    commands.some(
      (command) =>
        command?.startsWith("git diff --exit-code") &&
        command.includes("examples/typed-trips/package-lock.json"),
    ),
  )
  assert.ok(commands.indexOf("npm ci --prefix examples/systems-basics") < commands.indexOf("npm run kb:verify"))
  assert.ok(commands.some((c) => c?.startsWith("git diff --exit-code") && c.includes("examples/systems-basics/package-lock.json")))
  assert.ok(publish.jobs.build.steps.some((s) => s.run === "npm run kb:output"))
  assert.ok(
    commands.some(
      (c) =>
        c?.startsWith("git diff --exit-code") &&
        c.includes("examples/java-basics/package-lock.json") &&
        c.includes("examples/java-basics/.java-version"),
    ),
  )
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
  const missingInstall = structuredClone(checks)
  missingInstall.jobs.verify.steps = missingInstall.jobs.verify.steps.filter(
    (step) => step.run !== "npm ci --prefix examples/typed-trips",
  )
  assert.throws(() => assertProtected(publish, missingInstall))
  const missingSystems = structuredClone(checks)
  missingSystems.jobs.verify.steps = missingSystems.jobs.verify.steps.filter((s) => s.run !== "npm ci --prefix examples/systems-basics")
  assert.throws(() => assertProtected(publish, missingSystems))
  const missingSystemsLock = structuredClone(checks)
  const lockStep = missingSystemsLock.jobs.verify.steps.find((s) => s.run?.startsWith("git diff --exit-code"))
  lockStep.run = lockStep.run.replace(" examples/systems-basics/package-lock.json", "")
  assert.throws(() => assertProtected(publish, missingSystemsLock))
  for (const mutation of ["runtime", "late", "override", "install", "version-lock"]) {
    const changed = structuredClone(checks)
    const steps = changed.jobs.verify.steps
    const index = steps.findIndex((s) => s.uses === "actions/setup-python@v6")
    if (mutation === "runtime") steps.splice(index, 1)
    if (mutation === "late") steps.push(...steps.splice(index, 1))
    if (mutation === "override") steps[index].with["python-version"] = "3.14"
    if (mutation === "install") steps.splice(steps.findIndex((s) => s.run === "npm ci --prefix examples/python-basics"), 1)
    if (mutation === "version-lock") {
      const lock = steps.find((s) => s.run?.startsWith("git diff --exit-code"))
      lock.run = lock.run.replace(" examples/python-basics/.python-version", "")
    }
    assert.throws(() => assertProtected(publish, changed), mutation)
  }
  for (const mutation of ["install", "late", "manifest", "lock"]) {
    const changed = structuredClone(checks)
    const steps = changed.jobs.verify.steps
    const index = steps.findIndex((s) => s.run === "npm ci --prefix examples/reliable-app")
    if (mutation === "install") steps.splice(index, 1)
    if (mutation === "late") steps.push(...steps.splice(index, 1))
    if (["manifest", "lock"].includes(mutation)) {
      const lock = steps.find((s) => s.run?.startsWith("git diff --exit-code"))
      lock.run = lock.run.replace(" examples/reliable-app/" + (mutation === "lock" ? "package-lock.json" : "package.json"), "")
    }
    assert.throws(() => assertProtected(publish, changed), mutation)
  }
  for (const mutation of ["install", "late", "manifest", "lock"]) {
    const changed = structuredClone(checks)
    const steps = changed.jobs.verify.steps
    const index = steps.findIndex((s) => s.run === "npm ci --prefix examples/distributed-lab")
    if (mutation === "install") steps.splice(index, 1)
    if (mutation === "late") steps.push(...steps.splice(index, 1))
    if (["manifest", "lock"].includes(mutation)) {
      const lock = steps.find((s) => s.run?.startsWith("git diff --exit-code"))
      lock.run = lock.run.replace(" examples/distributed-lab/" + (mutation === "lock" ? "package-lock.json" : "package.json"), "")
    }
    assert.throws(() => assertProtected(publish, changed), mutation)
  }
  for (const mutation of ["install", "late", "manifest", "lock", "version"]) {
    const changed = structuredClone(checks)
    const steps = changed.jobs.verify.steps
    const index = steps.findIndex((s) => s.run === "npm ci --prefix examples/data-pipeline")
    if (mutation === "install") steps.splice(index, 1)
    if (mutation === "late") steps.push(...steps.splice(index, 1))
    if (["manifest", "lock", "version"].includes(mutation)) {
      const lock = steps.find((s) => s.run?.startsWith("git diff --exit-code"))
      lock.run = lock.run.replace(" examples/data-pipeline/" + (mutation === "version" ? ".python-version" : mutation === "lock" ? "package-lock.json" : "package.json"), "")
    }
    assert.throws(() => assertProtected(publish, changed), mutation)
  }
  for (const mutation of ["install", "late", "manifest", "lock", "version"]) {
    const changed = structuredClone(checks)
    const steps = changed.jobs.verify.steps
    const index = steps.findIndex((s) => s.run === "npm ci --prefix examples/search-lab")
    if (mutation === "install") steps.splice(index, 1)
    if (mutation === "late") steps.push(...steps.splice(index, 1))
    if (["manifest", "lock", "version"].includes(mutation)) {
      const lock = steps.find((s) => s.run?.startsWith("git diff --exit-code"))
      lock.run = lock.run.replace(" examples/search-lab/" + (mutation === "version" ? ".python-version" : mutation === "lock" ? "package-lock.json" : "package.json"), "")
    }
    assert.throws(() => assertProtected(publish, changed), mutation)
  }
  const missingJava = structuredClone(checks)
  missingJava.jobs.verify.steps = missingJava.jobs.verify.steps.filter(
    (s) => !s.uses?.startsWith("actions/setup-java"),
  )
  assert.throws(() => assertProtected(publish, missingJava))
  const lateJava = structuredClone(checks)
  const javaIndex = lateJava.jobs.verify.steps.findIndex((s) =>
    s.uses?.startsWith("actions/setup-java"),
  )
  lateJava.jobs.verify.steps.push(...lateJava.jobs.verify.steps.splice(javaIndex, 1))
  assert.throws(() => assertProtected(publish, lateJava))
  const overrideJava = structuredClone(checks)
  overrideJava.jobs.verify.steps.find((s) => s.uses?.startsWith("actions/setup-java")).with[
    "java-version"
  ] = "22"
  assert.throws(() => assertProtected(publish, overrideJava))
})
test("校验器假设与配置保持一致，过滤与主题保护不变", () => {
  const config = read("quartz.config.yaml")
  for (const name of ["remove-draft", "explicit-publish", "github-flavored-markdown"])
    assert.equal(config.plugins.find((p) => p.source === "@quartz-community/" + name).enabled, true)
  assert.equal(config.plugins.find((p) => p.source === "@quartz-themes/core").enabled, false)
  assert.equal(
    config.plugins.find((p) => p.source === "@quartz-community/crawl-links").options
      .markdownLinkResolution,
    "relative",
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

test("教学示例单独登记，Quartz 类型范围不包含示例", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
  assert.equal(
    pkg.scripts["kb:examples"],
    "npm test --prefix examples/foundations && npm test --prefix examples/typed-trips && npm test --prefix examples/web-forms && npm test --prefix examples/http-trips && npm test --prefix examples/trip-api && npm test --prefix examples/sql-trips && npm test --prefix examples/trip-app && npm test --prefix examples/java-basics && npm test --prefix examples/systems-basics && npm test --prefix examples/python-basics && npm test --prefix examples/reliable-app && npm test --prefix examples/distributed-lab && npm test --prefix examples/data-pipeline && npm test --prefix examples/search-lab",
  )
  assert.ok(pkg.scripts["kb:verify"].includes("npm run kb:examples"))
  const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"))
  assert.deepEqual(tsconfig.include, [
    "quartz/**/*.ts",
    "quartz/**/*.tsx",
    "*.ts",
    "*.tsx",
    "./package.json",
  ])
  const examples = JSON.parse(fs.readFileSync("examples/foundations/package.json", "utf8"))
  assert.equal(examples.scripts.test, "node --test foundations.test.mjs")
})

function assertPythonVersionsMatch(basics, pipeline) {
  assert.equal(pipeline.trim(), basics.trim(), "one CI runtime must match both examples")
}
test("所有Python教学包运行时一致，版本漂移必失败", () => {
  const basics = fs.readFileSync("examples/python-basics/.python-version", "utf8")
  assertPythonVersionsMatch(basics, fs.readFileSync("examples/data-pipeline/.python-version", "utf8"))
  assertPythonVersionsMatch(basics, fs.readFileSync("examples/search-lab/.python-version", "utf8"))
  assert.throws(() => assertPythonVersionsMatch(basics, "3.14.0"))
})
