import { producer, consumer } from "./outbox.mjs"
const [sourcePath, targetPath, fault = "none"] = process.argv.slice(2)
if (!sourcePath || !targetPath || !["none", "before-consume", "after-consume"].includes(fault)) throw new Error("owned rehearsal paths and supported fault required")
const source = producer(sourcePath), target = consumer(targetPath)
try {
  const event = source.next()
  if (!event) console.log(JSON.stringify({ empty: true }))
  else {
    if (fault === "before-consume") process.exit(31)
    const applied = target.apply(event)
    if (fault === "after-consume") process.exit(32)
    source.ack(event)
    console.log(JSON.stringify({ applied, acknowledged: true }))
  }
} finally { source.close(); target.close() }
