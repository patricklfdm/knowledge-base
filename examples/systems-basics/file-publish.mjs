import { mkdtempSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, rmSync } from "node:fs"
import { join } from "node:path"

// One writer, own directory, small JSON state. Phase hook is only for controlled failures.
export function publishState(dir, state, onPhase = () => {}) {
  const text = JSON.stringify(state)
  if (typeof text !== "string" || Buffer.byteLength(text) > 4096) throw new Error("small JSON state required")
  const temp = mkdtempSync(join(dir, ".candidate-"))
  const candidate = join(temp, "state.json")
  try {
    const fd = openSync(candidate, "wx", 0o600)
    try { writeFileSync(fd, text); fsyncSync(fd) } finally { closeSync(fd) }
    onPhase("before-rename")
    renameSync(candidate, join(dir, "state.json"))
    onPhase("after-rename")
    const directory = openSync(dir, "r")
    try { fsyncSync(directory) } finally { closeSync(directory) }
  } finally { rmSync(temp, { recursive: true, force: true }) }
}
