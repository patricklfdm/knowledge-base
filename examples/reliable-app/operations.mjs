import assert from "node:assert/strict"
import { fork, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { mkdtemp, copyFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { DatabaseSync, backup } from "node:sqlite"
import { openStore } from "./store.mjs"
export async function rehearseShutdown(force = false) {
  const child = fork(fileURLToPath(new URL("./service-worker.mjs", import.meta.url)), force ? ["--force"] : [], { stdio: ["ignore", "ignore", "pipe", "ipc"] })
  const messages = [], waiters = []
  let stderr = "", exitResult
  child.stderr.on("data", (data) => { stderr += data })
  child.on("message", (m) => { const i = waiters.findIndex((w) => w.type === m.type); if (i >= 0) waiters.splice(i, 1)[0].resolve(m); else messages.push(m) })
  const closed = new Promise((resolve) => child.once("close", (code, signal) => {
    exitResult = { code, signal }; for (const w of waiters.splice(0)) w.reject(new Error("worker exited: " + stderr)); resolve(exitResult)
  }))
  const wait = (type) => {
    const i = messages.findIndex((m) => m.type === type)
    if (i >= 0) return Promise.resolve(messages.splice(i, 1)[0])
    if (exitResult) return Promise.reject(new Error("worker already exited"))
    return new Promise((resolve, reject) => waiters.push({ type, resolve, reject }))
  }
  const watchdog = setTimeout(() => child.kill("SIGKILL"), 15000)
  try {
    const ready = await wait("ready"), headers = { authorization: `Bearer ${ready.token}` }
    const response = fetch(ready.url + "/notes/1", { headers }).then(async (res) => ({ status: res.status, body: await res.json() }), () => ({ status: "disconnected" }))
    await wait("entered"); child.kill("SIGTERM"); await wait("draining")
    if (force) {
      const exit = await closed; assert.equal(exit.code, 2); assert.equal((await response).status, "disconnected")
      return { mode: "forced", exit: 2, graceful: false }
    }
    assert.equal((await fetch(ready.url + "/ready")).status, 503)
    assert.equal((await fetch(ready.url + "/notes/1", { headers })).status, 503)
    child.send({ type: "release" })
    assert.equal((await response).status, 200)
    await wait("stopped"); const exit = await closed; assert.equal(exit.code, 0)
    return { mode: "graceful", readiness: 503, newWork: 503, admitted: 200, exit: 0 }
  } finally {
    clearTimeout(watchdog)
    if (!exitResult) child.kill("SIGKILL")
    await closed
  }
}
export async function rehearseRestore(dropRow = false) {
  const directory = await mkdtemp(join(tmpdir(), "kb-engineering-restore-"))
  const store = openStore(join(directory, "live.sqlite"))
  try {
    store.db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0")
    store.seed(); assert.equal(store.update(1, "alice", 1, "备份前已更新"), true)
    const expected = store.db.prepare("SELECT id,owner,title,revision FROM notes ORDER BY id").all().map((row) => ({ ...row }))
    const snapshot = join(directory, "snapshot.sqlite"), restored = join(directory, "restored.sqlite")
    await backup(store.db, snapshot)
    await copyFile(snapshot, restored)
    if (dropRow) {
      const broken = new DatabaseSync(restored)
      try { broken.exec("DELETE FROM notes WHERE id=2"); assert.equal(broken.prepare("PRAGMA integrity_check").get().integrity_check, "ok") }
      finally { broken.close() }
    }
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./restore-worker.mjs", import.meta.url)), restored, JSON.stringify(expected)], { encoding: "utf8", timeout: 10000 })
    assert.ifError(result.error)
    if (dropRow) { assert.notEqual(result.status, 0); return { incompleteDetected: true, structure: "ok" } }
    assert.equal(result.status, 0, result.stderr)
    assert.equal(store.get(1, "alice").title, "备份前已更新")
    const untouched = new DatabaseSync(snapshot, { readOnly: true })
    try { assert.equal(untouched.prepare("SELECT revision FROM notes WHERE id=1").get().revision, 2) }
    finally { untouched.close() }
    return JSON.parse(result.stdout)
  } finally { store.close(); await rm(directory, { recursive: true, force: true }) }
}
