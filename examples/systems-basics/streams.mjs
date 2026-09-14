import { Readable, Writable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

export function utf8Transform(maxBytes = 1024) {
  if (!Number.isInteger(maxBytes) || maxBytes < 0) throw new RangeError("nonnegative byte limit")
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let bytes = 0
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        bytes += chunk.length
        if (bytes > maxBytes) throw new RangeError("byte limit exceeded")
        callback(null, decoder.decode(chunk, { stream: true }))
      } catch (error) { callback(error) }
    },
    flush(callback) {
      try { callback(null, decoder.decode()) } catch (error) { callback(error) }
    },
  })
}

// A small bounded collector for assertions, not an unbounded production sink.
export async function decodeChunks(chunks, maxBytes = 1024, failSink = false) {
  let output = ""
  const source = Readable.from(chunks, { objectMode: false })
  const sink = new Writable({ write(chunk, encoding, callback) {
    if (failSink) callback(new Error("synthetic sink failure"))
    else { output += chunk.toString("utf8"); callback() }
  } })
  await pipeline(source, utf8Transform(maxBytes), sink)
  return output
}

export async function backpressureDemo() {
  let finishWrite
  const sink = new Writable({ highWaterMark: 4, write(chunk, encoding, callback) { finishWrite = callback } })
  const drained = new Promise((resolve, reject) => { sink.once("drain", resolve); sink.once("error", reject) })
  const accepted = sink.write(Buffer.alloc(4))
  const queued = sink.writableLength
  finishWrite()
  await drained
  await new Promise((resolve, reject) => { sink.once("error", reject); sink.end(resolve) })
  return { accepted, queued, ended: sink.writableFinished }
}
