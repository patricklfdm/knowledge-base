export class DeadlineError extends Error {}
// The budget limits waiting, not CPU time or remote side effects.
export async function withDeadline(work, milliseconds) {
  if (!Number.isInteger(milliseconds) || milliseconds <= 0) throw new Error("invalid budget")
  const controller = new AbortController()
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new DeadlineError("deadline")) }, milliseconds)
  })
  try { return await Promise.race([Promise.resolve().then(() => work(controller.signal)), timeout]) }
  finally { clearTimeout(timer) }
}
export function createRecorder() {
  const events = [], counts = { eligible: 0, bad: 0 }
  return {
    events, counts,
    record({ requestId, route, method, status, durationMs }) {
      const event = { requestId, route, method, status, durationMs }
      events.push(event); if (events.length > 100) events.shift()
      if (route === "/notes/:id") { counts.eligible++; if (status >= 500) counts.bad++ }
    },
  }
}
