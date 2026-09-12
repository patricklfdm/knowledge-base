export function parseTripFields(destinationText, daysText) {
  if (typeof destinationText !== "string" || typeof daysText !== "string") {
    throw new Error("目的地和天数必须是文字字段")
  }
  const destination = destinationText.trim()
  const digits = daysText.trim()
  if (destination.length === 0) {
    throw new Error("目的地不能为空")
  }
  if (!/^[0-9]+$/.test(digits)) {
    throw new Error("天数请填写十进制整数文字，例如3")
  }
  const days = Number(digits)
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error("天数必须是1到30的整数")
  }
  return { destination: destination, days: days }
}
