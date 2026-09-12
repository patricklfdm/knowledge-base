import { fork } from "node:child_process"
import { fileURLToPath } from "node:url"
export async function launch(path) {
  const child = fork(fileURLToPath(new URL("./serve.mjs", import.meta.url)), [path], {
    execArgv: [],
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  })
  let stderr = ""
  child.stderr.on("data", (chunk) => {
    stderr += chunk
  })
  child.stdout.resume()
  const ended = new Promise((resolve) =>
    child.once("exit", (code, signal) => resolve({ code, signal })),
  )
  const baseUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM")
      reject(new Error("启动超时"))
    }, 5000)
    child.once("message", (message) => {
      clearTimeout(timer)
      resolve(message.baseUrl)
    })
    child.once("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once("exit", (code) => {
      clearTimeout(timer)
      reject(new Error("启动退出 " + code + " " + stderr))
    })
  })
  return {
    baseUrl,
    async close() {
      if (child.connected) child.send("stop")
      const timer = setTimeout(() => child.kill("SIGKILL"), 5000)
      try {
        const result = await ended
        if (result.code !== 0) throw new Error("停止失败 " + JSON.stringify(result) + stderr)
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
