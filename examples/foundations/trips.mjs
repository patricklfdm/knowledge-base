import { validateDays } from "./rules.mjs"

export function createTrip(destination, days) {
  const reason = validateDays(days)
  if (reason !== "通过") {
    throw new Error(reason)
  }
  return { destination: destination, days: days }
}
