import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { buildNote } from "./build-note.mjs"
import { openStore } from "../store.mjs"
import { createClient } from "../web/client.js"
const c = buildNote(),
  path = join(c.dir, "trips.sqlite")
try {
  const old = openStore(path)
  try {
    old.create({ destination: "山城", days: 3 })
  } finally {
    old.close()
  }
  const { launch } = await import(pathToFileURL(join(c.app, "process.mjs")).href)
  let app = await launch(path)
  try {
    const api = createClient(app.baseUrl)
    console.log("迁移旧行", JSON.stringify(await api.list()))
    console.log(
      "保存备注",
      JSON.stringify(await api.update(1, { destination: "山城", days: 3, note: "靠窗" })),
    )
  } finally {
    await app.close()
  }
  app = await launch(path)
  try {
    console.log("重启备注", JSON.stringify(await createClient(app.baseUrl).list()))
  } finally {
    await app.close()
  }
} finally {
  c.cleanup()
}
