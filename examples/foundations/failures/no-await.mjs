import { loadTrip } from "../async-trips.mjs"
const trip = loadTrip("t1")
console.log(trip.destination)
console.log((await trip).destination)
