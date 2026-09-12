const button = document.querySelector("#preview")
const summary = document.querySelector("#summary")
if (button === null || summary === null) {
  throw new Error("页面缺少预览按钮或结果段落，请核对id")
}
button.addEventListener("click", () => {
  summary.textContent = "山城：3天（仅预览）"
})
button.disabled = false
