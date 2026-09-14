import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
const result = spawnSync(process.env.KB_PYTHON || "python3", ["-I", "-B", fileURLToPath(new URL("./run.py", import.meta.url)), ...process.argv.slice(2)], {
  encoding: "utf8", timeout: 60000, maxBuffer: 1024 * 1024,
})
if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
if (result.error) process.stderr.write(result.error.message + "\n")
process.exitCode = result.error || result.signal ? 1 : (result.status ?? 1)
