import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { launch } from "./process.mjs"
import { createClient } from "./web/client.js"
const dir = mkdtempSync(join(tmpdir(), "kb-app-demo-")),
  path = join(dir, "trips.sqlite")
try {
  let app = await launch(path)
  try {
    const api = createClient(app.baseUrl)
    const trip = await api.create({ destination: " 山城 ", days: 3 })
    console.log("创建", JSON.stringify(trip))
    console.log("修改", JSON.stringify(await api.update(trip.id, { destination: "海湾", days: 5 })))
    const bad = await fetch(app.baseUrl + "/api/trips/" + trip.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "坏数据", days: 31 }),
    })
    console.log("非法修改", bad.status)
    await bad.text()
  } finally {
    await app.close()
  }
  app = await launch(path)
  try {
    console.log("重启后", JSON.stringify(await createClient(app.baseUrl).list()))
  } finally {
    await app.close()
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}
