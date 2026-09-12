import { parseTripFields } from "./fields.js"
const trip = parseTripFields(" 山城 ", "3")
console.log(trip.destination, trip.days, typeof trip.days)
try {
  parseTripFields("山城", "3e0")
} catch (error) {
  console.log("拒绝：" + error.message)
}
