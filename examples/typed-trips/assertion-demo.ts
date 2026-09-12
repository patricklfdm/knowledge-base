import type { Trip } from "./trip.ts"

const input: unknown = { destination: "海边", days: "3" }
const trip = input as Trip
console.log(typeof trip.days)
console.log(trip.days + 1)
