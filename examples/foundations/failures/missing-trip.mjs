const trips = []
function isMissing(trip) {
  return trip.id === "missing"
}
const found = trips.find(isMissing)
console.log(found.days)
