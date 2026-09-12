import { loadTrip } from "./async-trips.mjs"

async function showTrip() {
  console.log("开始读取")
  try {
    const trip = await loadTrip("t1")
    console.log(trip.destination, trip.days)
    await loadTrip("missing")
    console.log("这行不会执行")
  } catch (error) {
    console.log("读取失败：" + error.message)
  }
  console.log("读取结束")
}
const task = showTrip()
console.log("入口继续")
await task
