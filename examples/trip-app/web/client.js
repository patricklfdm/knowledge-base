export function createClient(baseUrl = "", request = fetch) {
  async function json(path, options) {
    const response = await request(baseUrl + path, options)
    if (!response.ok)
      throw new Error("HTTP " + response.status + "：请求未成功，请核对输入或稍后重试")
    return response.json()
  }
  const send = (path, method, fields) =>
    json(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    })
  return {
    list: () => json("/api/trips"),
    create: (fields) => send("/api/trips", "POST", fields),
    update: (id, fields) => send("/api/trips/" + id, "PUT", fields),
  }
}
