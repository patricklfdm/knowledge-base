const trips = [
  { id: "t1", destination: "山城", days: 3 },
  { id: "t2", destination: "海边", days: 2 },
]
trips.push({ id: "t3", destination: "湖畔", days: 1 })
function isSecondTrip(trip) {
  return trip.id === "t2"
}
const found = trips.find(isSecondTrip)
if (found !== undefined) {
  found.days = 4
}
console.log(trips.length)
console.log(trips[1].days)
const alias = trips[0]
alias.days = 5
console.log(trips[0].days)
const edited = { ...trips[0], days: 7 }
console.log(trips[0].days, edited.days)
