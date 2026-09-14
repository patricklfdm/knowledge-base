export class LocalCache {
  #items = new Map()
  #epoch = 0n
  #capacity
  constructor(capacity = 2) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) throw new RangeError("capacity 1..1000")
    this.#capacity = capacity
  }
  get size() { return this.#items.size }
  invalidate(key) { this.#epoch++; this.#items.delete(key) }
  async read(key, load) {
    if (this.#items.has(key)) {
      const value = this.#items.get(key)
      this.#items.delete(key); this.#items.set(key, value)
      return value
    }
    const epoch = this.#epoch
    const value = await load(key)
    // This lesson caches only immutable strings/numbers, not arbitrary mutable object graphs.
    if (value !== undefined && typeof value !== "string" &&
        !(typeof value === "number" && Number.isFinite(value))) throw new TypeError("immutable scalar required")
    if (epoch === this.#epoch && value !== undefined) {
      this.#items.delete(key); this.#items.set(key, value)
      while (this.#items.size > this.#capacity) this.#items.delete(this.#items.keys().next().value)
    }
    return value
  }
}

export async function cacheRace() {
  const cache = new LocalCache(2)
  let store = "old", release, started
  const gate = new Promise((resolve) => { release = resolve })
  const reading = new Promise((resolve) => { started = resolve })
  const pending = cache.read("trip", async () => {
    const captured = store
    started()
    await gate
    return captured
  })
  await reading
  store = "new"
  cache.invalidate("trip")
  const fresh = await cache.read("trip", async () => store)
  release()
  const oldCaller = await pending
  const cached = await cache.read("trip", async () => { throw new Error("expected cache hit") })
  return { oldCaller, fresh, cached, size: cache.size }
}
