import { parseTrip } from "./trip.ts"

const input: unknown = { destination: " 山城 ", days: 3 }
const trip = parseTrip(input)
console.log(trip.destination, trip.days)
try {
  parseTrip({ destination: "海边", days: "3" })
} catch (error) {
  if (error instanceof Error) {
    console.log("拒绝：" + error.message)
  } else {
    throw error
  }
}
