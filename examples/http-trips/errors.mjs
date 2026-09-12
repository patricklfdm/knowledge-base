import { startFixture } from "./server.mjs"
import { getJson } from "./client.mjs"

const fixture = await startFixture()
try {
  const missing = await fetch(fixture.baseUrl + "/trips/missing")
  console.log("原始fetch", missing.status, missing.ok)
  await missing.text()
  for (const path of [
    "/trips/t1",
    "/trips/missing",
    "/html-error",
    "/broken-json",
    "/disconnect",
  ]) {
    try {
      const data = await getJson(fixture.baseUrl + path)
      console.log(path, "成功", data.destination, data.days)
    } catch (error) {
      if (!(error instanceof Error)) throw error
      // Messages for JSON/socket failures vary by runtime; only print their class names.
      console.log(path, "失败", error.name, error.name === "Error" ? error.message : "")
    }
  }
} finally {
  await fixture.close()
}
