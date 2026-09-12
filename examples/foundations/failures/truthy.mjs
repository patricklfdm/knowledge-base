function acceptsDays(days) {
  if (days) {
    return "通过"
  }
  return "拒绝"
}
console.log(acceptsDays(-2))
console.log(acceptsDays("三天"))
