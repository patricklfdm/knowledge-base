import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export function processFixture() {
  const dir = mkdtempSync(join(tmpdir(), "kb-process space-"))
  writeFileSync(join(dir, "value.txt"), "合成内容")
  return {
    dir,
    run(mode = "echo", argument = "海湾 城", timeout = 5000) {
      if (!["echo", "fail", "partial", "wait"].includes(mode)) throw new Error("unknown mode")
      return spawnSync(process.execPath, [fileURLToPath(new URL("./process-worker.mjs", import.meta.url)), mode, argument], {
        cwd: dir, env: { KB_DEMO_NAME: "child-only" }, input: JSON.stringify({ days: 3 }),
        encoding: "utf8", shell: false, timeout, maxBuffer: 8192,
      })
    },
    close() { rmSync(dir, { recursive: true, force: true }) },
  }
}

export function readReply(result) {
  if (result.error) throw result.error
  if (result.signal || result.status !== 0) throw new Error(`child failed: ${result.status}/${result.signal}`)
  const data = JSON.parse(result.stdout)
  if (data.input?.days !== 3 || typeof data.file !== "string") throw new Error("invalid reply")
  return data
}
