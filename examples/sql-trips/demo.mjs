import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { openTrips } from "./store.mjs"

const dir = mkdtempSync(join(tmpdir(), "kb-sql-demo-"))
const path = join(dir, "trips.sqlite")
try {
  const store = openTrips(path)
  try {
    console.log("创建", JSON.stringify(store.create("山城", 3)))
    store.create("海湾", 1)
    console.log("至少3天", JSON.stringify(store.atLeast(3)))
    try {
      store.create("坏行程", 31)
    } catch (error) {
      if (!String(error.message).includes("CHECK constraint failed")) throw error
      console.log("31天被CHECK拒绝")
    }
    console.log("条数", store.list().length)
  } finally {
    store.close()
  }
  const reader = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./read.mjs", import.meta.url)), path],
    {
      encoding: "utf8",
      timeout: 5000,
    },
  )
  if (reader.error) throw reader.error
  if (reader.status !== 0) throw new Error(reader.stderr)
  console.log("新进程读取", reader.stdout.trim())
} finally {
  rmSync(dir, { recursive: true, force: true })
}
