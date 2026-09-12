import { loadTrip } from "../async-trips.mjs"
try {
  loadTrip("missing")
} catch (error) {
  console.log("同步 catch：" + error.message)
}
console.log("入口已离开 try")
