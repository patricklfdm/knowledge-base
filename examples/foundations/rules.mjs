export function validateDays(days) {
  if (!Number.isInteger(days)) {
    return "天数必须是整数"
  }
  if (days < 1 || days > 30) {
    return "天数必须在 1 到 30 之间"
  }
  return "通过"
}
