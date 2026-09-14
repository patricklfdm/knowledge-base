import { randomBytes } from "node:crypto"
export function createSessions(now = Date.now) {
  const entries = new Map()
  return {
    // Trusted fixture seam only, never an HTTP endpoint accepting a user id.
    issueFixture(owner, ttl = 60000) {
      if (!["alice", "bob"].includes(owner) || !Number.isSafeInteger(ttl) || ttl <= 0) throw new Error("invalid fixture")
      const token = randomBytes(32).toString("hex")
      entries.set(token, { owner, expires: now() + ttl }); return token
    },
    authenticate(header) {
      if (typeof header !== "string" || !/^Bearer [a-f0-9]{64}$/i.test(header)) return null
      const token = header.slice(7), entry = entries.get(token)
      if (!entry) return null
      if (now() >= entry.expires) { entries.delete(token); return null }
      return entry.owner
    },
    revoke(token) { entries.delete(token) },
  }
}
