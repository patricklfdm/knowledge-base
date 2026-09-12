import { parseTripFields } from "./fields.js"
export function createController(api, view) {
  let busy = false
  async function task(work) {
    if (busy) return false
    busy = true
    view.busy(true)
    try {
      await work()
      return true
    } catch (error) {
      view.message(error instanceof Error ? error.message : "操作失败")
      return false
    } finally {
      busy = false
      view.busy(false)
    }
  }
  return {
    load: () =>
      task(async () => {
        view.message("正在读取…")
        view.rows(await api.list())
        view.message("列表已读取")
      }),
    save: (id, destination, days) =>
      task(async () => {
        const fields = parseTripFields(destination, days)
        view.message("正在保存…")
        // If this request fails at the network boundary, its write outcome may be unknown.
        try {
          id === null ? await api.create(fields) : await api.update(id, fields)
        } catch (error) {
          throw new Error(
            (error instanceof Error ? error.message : "请求失败") +
              "；请刷新列表确认结果，勿盲目重复创建",
          )
        }
        view.saved()
        try {
          view.rows(await api.list())
          view.message("已保存并刷新列表")
        } catch {
          view.message("已保存，但列表刷新失败；请点击刷新，不要重复创建")
        }
      }),
  }
}
