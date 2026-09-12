import { createTrip } from "./trips.mjs"

try {
  const trip = createTrip("山城", 3)
  console.log(trip.destination, trip.days)
  createTrip("海边", 0)
  console.log("这行不会执行")
} catch (error) {
  console.log("创建失败：" + error.message)
}
console.log("入口结束")
