import { createElement as h } from "react"
export function Board({ state, rows, onQuery, onReload }) {
  const busy = state.phase === "loading"
  return h("main", null,
    h("h1", null, "合成行程便笺"),
    h("form", { onSubmit: (event) => { event.preventDefault(); onReload() } },
      h("label", { htmlFor: "query" }, "筛选标题"),
      h("input", { id: "query", name: "query", value: state.query,
        onChange: (event) => onQuery(event.target.value), "aria-describedby": "query-help" }),
      h("p", { id: "query-help" }, "仅筛选已加载的合成数据，不提交个人信息。"),
      h("button", { type: "submit", disabled: busy }, "重新读取")),
    h("p", { role: "status" }, busy ? "读取中；下方可能为旧结果" : state.phase === "success" ? `找到 ${rows.length} 条` : "尚未得到最新结果"),
    state.error ? h("p", { role: "alert" }, state.error) : null,
    h("ul", { "aria-busy": busy }, rows.map((row) => h("li", { key: row.id }, row.title))))
}
