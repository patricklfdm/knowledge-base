// Run maintained examples on the separately pinned patch runtimes in owned copies.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../", import.meta.url))
const pins = path.join(root, "docs/knowledge-base/maintenance/runtimes")
const pythonVersion = fs.readFileSync(path.join(pins, ".python-version"), "utf8").trim()
const javaVersion = fs.readFileSync(path.join(pins, ".java-version"), "utf8").trim()
assert.match(pythonVersion, /^\d+\.\d+\.\d+$/)
assert.match(javaVersion, /^\d+\.\d+\.\d+(?:\.\d+)?$/)
assert.equal(process.argv.length, 2, "No arbitrary command or package arguments")
const python = process.env.KB_PYTHON || "python3"
const javaHome = process.env.KB_JAVA_HOME || process.env.JAVA_HOME
assert.ok(javaHome, "Set KB_JAVA_HOME or JAVA_HOME to the compatibility JDK")
const env = { ...process.env, KB_PYTHON: python, KB_JAVA_HOME: javaHome }
for (const key of ["JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS", "JDK_JAVA_OPTIONS", "JDK_JAVAC_OPTIONS", "CLASSPATH"])
  delete env[key]
function run(command, args, cwd, inherit = false) {
  const result = spawnSync(command, args, {
    cwd, env, encoding: "utf8", timeout: 180000,
    ...(inherit ? { stdio: "inherit" } : {}),
  })
  if (result.error) throw result.error
  assert.equal(result.signal, null, "Runtime child terminated by a signal")
  return result
}
const info = run(python, ["-I", "-B", "-c", "import sys,json;print(json.dumps([sys.implementation.name,'.'.join(map(str,sys.version_info[:3]))]))"])
assert.equal(info.status, 0, info.stderr)
assert.deepEqual(JSON.parse(info.stdout), ["cpython", pythonVersion], "Wrong compatibility Python")
const javaInfo = run(path.join(javaHome, "bin/java"), ["--version"])
assert.equal(javaInfo.status, 0, javaInfo.stderr)
assert.match(javaInfo.stdout + javaInfo.stderr, /Microsoft/, "Expected Microsoft JDK")
assert.ok((javaInfo.stdout + javaInfo.stderr).split("\n")[0].split(/\s+/).includes(javaVersion))
console.log(`Compatibility runtimes: CPython ${pythonVersion}; Microsoft OpenJDK ${javaVersion}`)
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kb-runtime-compat-"))
try {
  for (const name of ["python-basics", "data-pipeline", "search-lab", "java-basics"]) {
    const source = path.join(root, "examples", name), copy = path.join(directory, name)
    fs.cpSync(source, copy, { recursive: true, filter: (file) => {
      if (["node_modules", "__pycache__", ".venv", ".git"].includes(path.basename(file))) return false
      assert.ok(!fs.lstatSync(file).isSymbolicLink(), "Example source must not contain symlinks")
      return true
    } })
    const isJava = name === "java-basics"
    const pin = path.join(copy, isJava ? ".java-version" : ".python-version")
    const baseline = fs.readFileSync(pin, "utf8").trim(), target = isJava ? javaVersion : pythonVersion
    assert.notEqual(baseline, target, "Compatibility lane must exercise a different pin")
    const rejected = isJava
      ? run(process.execPath, ["demo.mjs"], copy)
      : run(python, ["-I", "-B", "run.py", "test"], copy)
    assert.equal(rejected.status, 1, `${name}: baseline version guard must reject target runtime`)
    assert.ok((rejected.stdout + rejected.stderr).includes(`Expected ${isJava ? "JDK" : "CPython"} ${baseline}`))
    fs.writeFileSync(pin, target + "\n")
    const tests = fs.readdirSync(copy).filter((f) => f.endsWith(".test.mjs")).sort()
    assert.ok(tests.length, `${name}: no maintained tests`)
    assert.equal(run(process.execPath, ["--test", ...tests], copy, true).status, 0, `${name}: compatibility failed`)
    console.log(`${name}: baseline rejection and target tests PASS`)
  }
} finally {
  fs.rmSync(directory, { recursive: true, force: true })
}
