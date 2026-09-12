import { createServer } from "node:http"
import { parseTrip, readJson, inputError } from "./input.mjs"

export async function startApi() {
  const trips = []
  let nextId = 1
  const server = createServer(async (request, response) => {
    const send = (status, value, headers = {}) => {
      response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers })
      response.end(JSON.stringify(value))
    }
    try {
      const url = new URL(request.url, "http://127.0.0.1")
      const collection = url.pathname === "/trips"
      const item = /^\/trips\/(t[1-9][0-9]*)$/.exec(url.pathname)
      if (!collection && !item) throw inputError(404, "NOT_FOUND", "找不到路径")
      const allowed = collection ? ["GET", "POST"] : ["GET"]
      if (!allowed.includes(request.method)) {
        response.setHeader("Allow", allowed.join(", "))
        throw inputError(405, "METHOD_NOT_ALLOWED", "此路径不支持该方法")
      }
      if (request.method === "POST") {
        const input = await readJson(request)
        const fields = parseTrip(input)
        const trip = { id: "t" + nextId, ...fields }
        nextId += 1
        trips.push(trip)
        send(201, trip, { Location: "/trips/" + trip.id })
      } else if (collection) {
        send(200, trips)
      } else {
        const trip = trips.find((candidate) => candidate.id === item[1])
        if (!trip) throw inputError(404, "NOT_FOUND", "找不到行程")
        send(200, trip)
      }
    } catch (error) {
      if (response.destroyed) return
      if (error instanceof Error && [400, 404, 405, 413, 415, 422].includes(error.status)) {
        send(error.status, { error: { code: error.code, message: error.message } })
      } else {
        // Unexpected implementation errors must not expose stack traces to callers.
        send(500, { error: { code: "INTERNAL_ERROR", message: "服务暂时无法完成请求" } })
      }
    } finally {
      // Early route/media errors still drain this teaching request.
      request.resume()
    }
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    baseUrl: "http://127.0.0.1:" + server.address().port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}
