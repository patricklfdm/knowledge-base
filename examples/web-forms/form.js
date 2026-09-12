import { parseTripFields } from "./fields.js"

const form = document.querySelector("#trip-form")
const feedback = document.querySelector("#feedback")
const summary = document.querySelector("#summary")
const submit = document.querySelector("#submit")
if (form === null || feedback === null || summary === null || submit === null) {
  throw new Error("页面缺少表单、反馈或提交按钮，请核对id")
}
form.addEventListener("submit", (event) => {
  event.preventDefault()
  const data = new FormData(form)
  try {
    const trip = parseTripFields(data.get("destination"), data.get("days"))
    feedback.textContent = ""
    summary.textContent = trip.destination + "：" + trip.days + "天（仅预览，未保存）"
  } catch (error) {
    if (!(error instanceof Error)) throw error
    summary.textContent = ""
    feedback.textContent = "未生成预览：" + error.message
    feedback.focus()
  }
})
submit.disabled = false
