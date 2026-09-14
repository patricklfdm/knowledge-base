import { createSessions } from "./session.mjs"
import { openStore } from "./store.mjs"
import { startService } from "./server.mjs"
if (!process.send) throw new Error("owned IPC rehearsal only")
const store = openStore(); store.seed(); const sessions = createSessions()
let release
const pending = new Promise((resolve) => { release = resolve })
const service = await startService({ store, sessions, deadlineMs: 10000, readDependency: () => { process.send({ type: "entered" }); return pending } })
const token = sessions.issueFixture("alice")
process.on("message", (message) => { if (message.type === "release") release() })
let stopping = false
process.on("SIGTERM", async () => {
  if (stopping) return
  stopping = true; service.beginDrain(); process.send({ type: "draining" })
  // Forced exit is deliberately a failure, never reported as graceful success.
  const timer = setTimeout(() => process.exit(2), process.argv.includes("--force") ? 1000 : 5000)
  try {
    await service.close(); store.close(); clearTimeout(timer)
    process.send({ type: "stopped" }, () => process.disconnect())
  } catch { clearTimeout(timer); process.exitCode = 1; process.disconnect() }
})
process.send({ type: "ready", url: service.url, token })
