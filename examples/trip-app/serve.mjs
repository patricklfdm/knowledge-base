import { resolve } from "node:path"
import { startApp } from "./server.mjs"
if (!process.argv[2]) throw new Error("请指定自行创建的教学数据库路径；不会默认打开现有数据库")
const app = await startApp(resolve(process.argv[2]))
console.log(app.baseUrl)
if (process.send) process.send({ baseUrl: app.baseUrl })
const stop = async () => {
  await app.close()
  process.exit(0)
}
process.once("SIGINT", stop)
process.once("SIGTERM", stop)
process.on("message", (message) => {
  if (message === "stop") void stop()
})
