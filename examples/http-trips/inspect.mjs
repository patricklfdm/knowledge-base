import { startFixture } from "./server.mjs"

const fixture = await startFixture()
try {
  const url = new URL("/trips/t1?view=full#preview", fixture.baseUrl)
  const response = await fetch(url, { headers: { Accept: "application/json" } })
  console.log("URL", url.href)
  console.log("请求", fixture.requests[0].method, fixture.requests[0].target)
  console.log("Accept", fixture.requests[0].accept)
  console.log("响应", response.status, response.ok)
  console.log("Content-Type", response.headers.get("content-type"))
  const text = await response.text()
  console.log("正文文字", text)
  const trip = JSON.parse(text)
  console.log("解析后", trip.destination, trip.days, typeof trip.days)
} finally {
  await fixture.close()
}
