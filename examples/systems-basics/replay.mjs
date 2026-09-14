import { openSync, writeFileSync, fsyncSync, closeSync } from "node:fs"

function shape(value, keys) {
  return value && !Array.isArray(value) && Object.keys(value).sort().join(",") === keys
}
export function validateState(state) {
  if (!shape(state, "seq,value") || !Number.isSafeInteger(state.seq) || state.seq < 0 ||
      !Number.isSafeInteger(state.value)) throw new Error("invalid snapshot")
}
function validateRecord(record) {
  if (!shape(record, "delta,seq") || !Number.isSafeInteger(record.seq) || record.seq < 1 ||
      !Number.isSafeInteger(record.delta)) throw new Error("invalid record")
}
export function encodeRecord(record) {
  validateRecord(record)
  return JSON.stringify(record) + "\n"
}
export function appendRecord(path, record) {
  const text = encodeRecord(record)
  const fd = openSync(path, "a", 0o600)
  try { writeFileSync(fd, text); fsyncSync(fd) } finally { closeSync(fd) }
}

export function replay(snapshot, text) {
  validateState(snapshot)
  if (Buffer.byteLength(text) > 65536) throw new Error("log limit exceeded")
  if (text && !text.endsWith("\n")) throw new Error("incomplete log tail")
  const state = { ...snapshot }
  let previous = null
  for (const line of text ? text.slice(0, -1).split("\n") : []) {
    const record = JSON.parse(line)
    validateRecord(record)
    if (previous !== null && record.seq !== previous + 1) throw new Error("nonconsecutive log")
    previous = record.seq
    if (record.seq <= state.seq) continue
    if (record.seq !== state.seq + 1) throw new Error("snapshot/log gap")
    const value = state.value + record.delta
    if (!Number.isSafeInteger(value)) throw new Error("unsafe total")
    state.seq = record.seq
    state.value = value
  }
  return state
}
