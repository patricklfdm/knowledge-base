export function prepare(values) {
  if (!Array.isArray(values) || !values.every(Number.isFinite)) throw new TypeError("finite numbers")
  return Object.freeze([...values].sort((a, b) => a - b))
}

// Input contract: an ascending finite-number array, prepared once before queries.
export function lowerBound(sorted, target) {
  if (!Number.isFinite(target)) throw new TypeError("finite target")
  let lo = 0, hi = sorted.length, probes = 0
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    probes++
    if (sorted[mid] < target) lo = mid + 1
    else hi = mid
  }
  return { index: lo, probes }
}

export function linearBound(sorted, target) {
  if (!Number.isFinite(target)) throw new TypeError("finite target")
  let probes = 0
  for (let index = 0; index < sorted.length; index++) {
    probes++
    if (sorted[index] >= target) return { index, probes }
  }
  return { index: sorted.length, probes }
}

export function searchDemo() {
  return [16, 1024].map((n) => {
    const data = prepare(Array.from({ length: n }, (_, i) => i * 2))
    return { n, target: n * 2, linear: linearBound(data, n * 2), binary: lowerBound(data, n * 2) }
  })
}
