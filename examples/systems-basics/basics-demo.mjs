import { searchDemo } from "./search.mjs"
import { processFixture, readReply } from "./processes.mjs"
import { decodeChunks, backpressureDemo } from "./streams.mjs"
console.log("search", JSON.stringify(searchDemo()))
const f = processFixture()
try {
  const { name, file, input, argument } = readReply(f.run())
  console.log("child", JSON.stringify({ name, file, input, argument, failureStatus: f.run("fail").status }))
} finally { f.close() }
const data = Buffer.from("山城\n")
console.log("decoded", JSON.stringify(await decodeChunks([...data].map((b) => Buffer.from([b])))))
console.log("backpressure", JSON.stringify(await backpressureDemo()))
