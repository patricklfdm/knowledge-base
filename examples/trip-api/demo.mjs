import { startApi } from "./server.mjs"

const api = await startApi()
try {
  const created = await fetch(api.baseUrl + "/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ destination: " 山城 ", days: 3 }),
  })
  console.log("创建", created.status, created.headers.get("location"))
  console.log("正文", await created.text())
  const saved = await fetch(new URL(created.headers.get("location"), api.baseUrl))
  console.log("读取", saved.status, await saved.text())
  const invalid = await fetch(api.baseUrl + "/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination: "山城", days: "3" }),
  })
  console.log("非法输入", invalid.status, (await invalid.json()).error.code)
  const list = await fetch(api.baseUrl + "/trips")
  console.log("条数", (await list.json()).length)
} finally {
  await api.close()
}
const restarted = await startApi()
try {
  const list = await fetch(restarted.baseUrl + "/trips")
  console.log("新实例条数", (await list.json()).length)
} finally {
  await restarted.close()
}
