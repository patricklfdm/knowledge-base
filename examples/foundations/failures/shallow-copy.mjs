const trip = { days: 3, stop: { name: "山脚" } }
const copy = { ...trip }
copy.stop.name = "山顶"
console.log(trip.stop.name)
