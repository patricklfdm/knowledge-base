export class UnknownOutcome extends Error {}
// Deterministic omission model, not a real socket or a wall-clock timeout.
export function deliver(operation, fault = "none") {
  if (!["none", "request-lost", "response-lost"].includes(fault)) throw new TypeError("unknown fault")
  if (fault === "request-lost") throw new UnknownOutcome("no response")
  const result = operation()
  if (fault === "response-lost") throw new UnknownOutcome("no response")
  return result
}
