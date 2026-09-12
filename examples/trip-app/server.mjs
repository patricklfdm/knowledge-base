import { createServer } from "node:http"
import { readFileSync } from "node:fs"
import { parseTrip, readJson, inputError } from "./input.mjs"
import { openStore } from "./store.mjs"

export async function startApp(dbPath) {
  const files = new Map(
    [
      ["/", ["index.html", "text/html; charset=utf-8"]],
      ...["app.js", "client.js", "controller.js", "fields.js"].map((name) => [
        "/" + name,
        [name, "text/javascript; charset=utf-8"],
      ]),
    ].map(([path, [name, type]]) => [
      path,
      { type, body: readFileSync(new URL("./web/" + name, import.meta.url)) },
    ]),
  )
  const store = openStore(dbPath)
  let baseUrl
  const server = createServer(async (request, response) => {
    const send = (status, value, headers = {}) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...headers,
      })
      response.end(JSON.stringify(value))
    }
    try {
      if (
        request.headers.host !== new URL(baseUrl).host ||
        (request.headers.origin && request.headers.origin !== baseUrl)
      ) {
        throw inputError(403, "ORIGIN_DENIED", "请从当前本机应用地址访问")
      }
      const path = new URL(request.url, baseUrl).pathname
      const file = files.get(path)
      if (file) {
        if (request.method !== "GET") {
          response.setHeader("Allow", "GET")
          throw inputError(405, "METHOD_NOT_ALLOWED", "静态资源只支持GET")
        }
        response.writeHead(200, {
          "Content-Type": file.type,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        })
        response.end(file.body)
        return
      }
      const collection = path === "/api/trips"
      const match = /^\/api\/trips\/([1-9][0-9]*)$/.exec(path)
      const id = match ? Number(match[1]) : null
      if (!collection && (!match || !Number.isSafeInteger(id)))
        throw inputError(404, "NOT_FOUND", "找不到路径")
      const allowed = collection ? ["GET", "POST"] : ["GET", "PUT"]
      if (!allowed.includes(request.method)) {
        response.setHeader("Allow", allowed.join(", "))
        throw inputError(405, "METHOD_NOT_ALLOWED", "此路径不支持该方法")
      }
      if (request.method === "POST" || request.method === "PUT") {
        const fields = parseTrip(await readJson(request))
        const trip = collection ? store.create(fields) : store.update(id, fields)
        if (!trip) throw inputError(404, "NOT_FOUND", "找不到行程")
        send(collection ? 201 : 200, trip, collection ? { Location: "/api/trips/" + trip.id } : {})
      } else {
        const result = collection ? store.list() : store.get(id)
        if (!result) throw inputError(404, "NOT_FOUND", "找不到行程")
        send(200, result)
      }
    } catch (error) {
      if (response.destroyed) return
      if (error instanceof Error && [400, 403, 404, 405, 413, 415, 422].includes(error.status))
        send(error.status, { error: { code: error.code, message: error.message } })
      else send(500, { error: { code: "INTERNAL_ERROR", message: "服务暂时无法完成请求" } })
    } finally {
      request.resume()
    }
  })
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", resolve)
    })
    baseUrl = "http://127.0.0.1:" + server.address().port
  } catch (error) {
    store.close()
    throw error
  }
  let closing
  return {
    baseUrl,
    close() {
      closing ??= new Promise((resolve, reject) => {
        server.close((error) => {
          try {
            store.close()
          } catch (e) {
            reject(e)
            return
          }
          error ? reject(error) : resolve()
        })
        server.closeAllConnections()
      })
      return closing
    },
  }
}
