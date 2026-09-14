export class RetryBudgetExceeded extends Error {}
// operation must itself honor remainingMs; this scheduler cannot preempt it.
export async function retry(operation, { now, sleep, random, retryable, maxAttempts = 3, budgetMs = 100, baseMs = 10, capMs = 40 }) {
  for (const value of [maxAttempts, budgetMs, baseMs, capMs]) if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError("invalid retry policy")
  const started = now()
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remainingMs = budgetMs - (now() - started)
    if (remainingMs <= 0) throw new RetryBudgetExceeded("budget exhausted")
    try { return await operation({ attempt, remainingMs }) }
    catch (error) {
      if (!retryable(error) || attempt === maxAttempts) throw error
      const jitter = random()
      if (!(jitter >= 0 && jitter < 1)) throw new TypeError("invalid random sample")
      const delay = Math.floor(Math.min(capMs, baseMs * 2 ** Math.min(attempt - 1, 52)) * jitter)
      if (delay >= budgetMs - (now() - started)) throw new RetryBudgetExceeded("no room to retry")
      await sleep(delay)
    }
  }
}
