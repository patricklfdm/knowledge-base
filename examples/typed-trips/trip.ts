export type Trip = {
  destination: string
  days: number
}

export function parseTrip(input: unknown): Trip {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("输入必须是行程对象")
  }
  if (!("destination" in input) || typeof input.destination !== "string") {
    throw new Error("目的地必须是文字")
  }
  if (!("days" in input) || typeof input.days !== "number") {
    throw new Error("天数必须是数字")
  }
  const destination = input.destination.trim()
  if (destination.length === 0) {
    throw new Error("目的地不能为空")
  }
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 30) {
    throw new Error("天数必须是1到30的整数")
  }
  return { destination: destination, days: input.days }
}
