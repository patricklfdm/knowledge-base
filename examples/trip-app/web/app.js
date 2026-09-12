import { createClient } from "./client.js"
import { createController } from "./controller.js"
const get = (id) => {
  const node = document.getElementById(id)
  if (!node) throw new Error("缺少页面元素：" + id)
  return node
}
const form = get("trip-form"),
  destination = get("destination"),
  days = get("days"),
  feedback = get("feedback"),
  list = get("trips"),
  mode = get("mode")
let editing = null
function reset() {
  editing = null
  form.reset()
  mode.textContent = "新增行程"
}
const controller = createController(createClient(), {
  busy(value) {
    for (const node of document.querySelectorAll("input,button")) node.disabled = value
    form.setAttribute("aria-busy", String(value))
  },
  message(text) {
    feedback.textContent = text
  },
  saved: reset,
  rows(trips) {
    list.replaceChildren()
    for (const trip of trips) {
      const li = document.createElement("li"),
        label = document.createElement("span"),
        button = document.createElement("button")
      label.textContent = trip.destination + "：" + trip.days + "天 "
      button.type = "button"
      button.textContent = "修改 " + trip.destination
      button.disabled = true
      button.addEventListener("click", () => {
        editing = trip.id
        destination.value = trip.destination
        days.value = String(trip.days)
        mode.textContent = "修改行程 #" + trip.id
        destination.focus()
      })
      li.append(label, button)
      list.append(li)
    }
  },
})
form.addEventListener("submit", (event) => {
  event.preventDefault()
  void controller.save(editing, destination.value, days.value)
})
get("cancel").addEventListener("click", reset)
get("refresh").addEventListener("click", () => void controller.load())
void controller.load()
