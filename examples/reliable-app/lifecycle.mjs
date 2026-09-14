export function createLifecycle() {
  let draining = false, active = 0
  const waiters = []
  return {
    get draining() { return draining }, get active() { return active },
    enter() { if (draining) return false; active++; return true },
    leave() {
      if (active <= 0) throw new Error("unbalanced leave")
      active--; if (active === 0) for (const resolve of waiters.splice(0)) resolve()
    },
    drain() { draining = true },
    idle() { return active === 0 ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve)) },
  }
}
