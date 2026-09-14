export class NotCaughtUp extends Error {}
// One ordered, authoritative stream. No leader election or cross-shard ordering.
export function replica() {
  let applied = 0
  const history = new Map(), rows = new Map()
  return {
    apply(event) {
      if (!event || !Number.isSafeInteger(event.sequence) || event.sequence < 1 || !Number.isSafeInteger(event.id) || event.id < 1 || typeof event.title !== "string") throw new TypeError("invalid event")
      const canonical = JSON.stringify([event.id, event.title])
      if (event.sequence <= applied) {
        if (history.get(event.sequence) !== canonical) throw new Error("sequence conflict")
        return false
      }
      if (event.sequence !== applied + 1) throw new Error("gap")
      rows.set(event.id, event.title); history.set(event.sequence, canonical); applied = event.sequence; return true
    },
    read(minimum = 0) {
      if (!Number.isSafeInteger(minimum) || minimum < 0) throw new TypeError("invalid minimum")
      if (minimum > applied) throw new NotCaughtUp("required version unavailable")
      return { applied, rows: [...rows].sort((a,b) => a[0]-b[0]).map(([id,title]) => ({ id, title })) }
    },
  }
}
