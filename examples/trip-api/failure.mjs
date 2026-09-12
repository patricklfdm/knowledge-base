import { startApi } from "./server.mjs"
const api = await startApi()
try {
  const response = await fetch(api.baseUrl + "/trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"destination":"山城","days":31}',
  })
  await response.text()
  if (!response.ok) throw new Error("HTTP " + response.status)
} finally {
  await api.close()
}
