import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

// No project checkout or remote is touched. All writes belong to this fixture.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-revert-fixture-"))
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: os.devNull }
function run(command, args, expected = 0) {
  const result = spawnSync(command, args, { cwd: dir, env, encoding: "utf8", timeout: 20000 })
  assert.ifError(result.error)
  assert.equal(
    result.status,
    expected,
    `${command} ${args.join(" ")}\n${result.stderr}\n${result.stdout}`,
  )
  return result.stdout.trim()
}
try {
  fs.writeFileSync(
    path.join(dir, "rule.mjs"),
    "export const valid = n => Number.isInteger(n) && n >= 1 && n <= 30\n",
  )
  fs.writeFileSync(
    path.join(dir, "rule.test.mjs"),
    "import assert from 'node:assert/strict';import {valid} from './rule.mjs';assert.equal(valid(30),true);assert.equal(valid(31),false)\n",
  )
  run("git", ["init", "--initial-branch=fixture", "--template="])
  for (const [key, value] of [
    ["user.name", "KnowledgeBase Fixture"],
    ["user.email", "fixture@example.invalid"],
    ["commit.gpgsign", "false"],
    ["core.hooksPath", os.devNull],
  ]) {
    run("git", ["config", "--local", key, value])
  }
  run("git", ["add", "rule.mjs", "rule.test.mjs"])
  run("git", ["commit", "-m", "fixture: valid range"])
  run(process.execPath, ["--test", "rule.test.mjs"])
  console.log("Recovery fixture: baseline PASS")
  fs.writeFileSync(
    path.join(dir, "rule.mjs"),
    "export const valid = n => Number.isInteger(n) && n >= 1 && n <= 300\n",
  )
  run("git", ["add", "rule.mjs"])
  run("git", ["commit", "-m", "fixture: introduce invalid range"])
  const bad = run("git", ["rev-parse", "HEAD"])
  run(process.execPath, ["--test", "rule.test.mjs"], 1)
  console.log("Recovery fixture: introduced defect detected (expected exit 1)")
  run("git", ["revert", "--no-edit", bad])
  run(process.execPath, ["--test", "rule.test.mjs"])
  assert.equal(run("git", ["status", "--short"]), "")
  assert.equal(run("git", ["remote"]), "")
  console.log("Recovery fixture: ordinary revert PASS; clean; no remote")
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
