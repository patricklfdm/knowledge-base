// F07 field conversion snapshot, extended to match F09 length.
export function parseTripFields(destinationText, daysText) {
  if (typeof destinationText !== "string" || typeof daysText !== "string") {
    throw new Error("目的地和天数必须是文字字段")
  }
  const destination = destinationText.trim()
  const digits = daysText.trim()
  if (destination.length === 0 || destination.length > 80) {
    throw new Error("目的地长度必须为1到80个UTF-16代码单元")
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
