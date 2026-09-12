export async function loadTrip(id) {
  await Promise.resolve()
  if (id !== "t1") {
    throw new Error("找不到行程")
  }
  return { id: "t1", destination: "山城", days: 3 }
}
