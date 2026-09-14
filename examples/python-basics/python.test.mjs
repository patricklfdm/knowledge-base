import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
test("Python maintained unittest suite must execute and succeed", () => {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL("./python.mjs", import.meta.url)), "test"], {
    encoding: "utf8", timeout: 65000, maxBuffer: 1024 * 1024,
  })
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stderr, /Ran [1-9]\d* tests/)
  assert.match(r.stderr, /\nOK\s*$/)
})
