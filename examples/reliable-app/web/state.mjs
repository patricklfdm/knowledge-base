export const initialState = { query: "", rows: [], phase: "idle", error: "" }
export function reducer(state, action) {
  switch (action.type) {
    case "query": return { ...state, query: action.value }
    case "loading": return { ...state, phase: "loading", error: "" }
    case "success": return { ...state, phase: "success", rows: action.rows, error: "" }
    case "error": return { ...state, phase: "error", rows: [], error: "读取失败，请重试" }
    default: throw new Error("unknown action")
  }
}
export function selectRows(rows, query, visit = () => {}) {
  const needle = query.trim().toLowerCase()
  return rows.filter((row) => { visit(); return row.title.toLowerCase().includes(needle) })
}
// One-entry cache: correctness requires immutable rows; this is not React useMemo.
export function createSelector(visit = () => {}) {
  let previousRows, previousQuery, result
  return (rows, query) => {
    if (rows !== previousRows || query !== previousQuery) {
      result = selectRows(rows, query, visit)
      previousRows = rows; previousQuery = query
    }
    return result
  }
}
