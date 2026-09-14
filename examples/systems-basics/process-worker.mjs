import { readFileSync } from "node:fs"
const mode = process.argv[2]
if (mode === "echo") {
  const input = JSON.parse(readFileSync(0, "utf8"))
  console.log(JSON.stringify({ name: process.env.KB_DEMO_NAME, cwd: process.cwd(),
    file: readFileSync("value.txt", "utf8"), input, argument: process.argv[3], pid: process.pid }))
} else if (mode === "fail") {
  console.error("synthetic validation failure")
  process.exitCode = 2
} else if (mode === "partial") {
  process.stdout.write('{"ok":')
} else if (mode === "wait") {
  setInterval(() => {}, 1000)
} else {
  throw new Error("unknown worker mode")
}
