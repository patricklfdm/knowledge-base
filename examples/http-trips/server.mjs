import { createServer } from "node:http"

// Fixed, public synthetic responses for HTTP lessons; not a production API.
export async function startFixture() {
  const requests = []
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1")
    requests.push({ method: request.method, target: request.url, accept: request.headers.accept })
    request.resume()
    const json = (status, value) => {
      response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
      response.end(JSON.stringify(value))
    }
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET")
      json(405, { error: "此演示只允许GET" })
      return
    }
    if (url.pathname === "/disconnect") {
      // Deliberately close before sending HTTP headers: no status code is received.
      request.socket.destroy()
      return
    }
    if (url.pathname === "/broken-json") {
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end('{"destination":')
      return
    }
    if (url.pathname === "/html-error") {
      response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" })
      response.end("<p>合成服务错误</p>")
      return
    }
    if (url.pathname === "/wrong-shape") {
      json(200, { id: "t1", destination: "山城", days: "3" })
      return
    }
    if (url.pathname === "/trips/t1") {
      const view = url.searchParams.get("view") ?? "full"
      if (view === "summary") {
        json(200, { id: "t1", destination: "山城" })
      } else if (view === "full") {
        json(200, { id: "t1", destination: "山城", days: 3 })
      } else {
        json(400, { error: "view只接受full或summary" })
      }
      return
    }
    json(404, { error: "找不到行程或演示路径" })
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    baseUrl: "http://127.0.0.1:" + server.address().port,
    requests,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}
