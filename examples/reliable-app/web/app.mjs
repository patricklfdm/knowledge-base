import { createElement as h, useEffect, useMemo, useReducer } from "react"
import { createRoot } from "react-dom/client"
import { initialState, reducer, selectRows } from "./state.mjs"
import { createLoader } from "./request.mjs"
import { Board } from "./view.mjs"
const fixture = [{ id: 1, title: "海边散步" }, { id: 2, title: "山间徒步" }]
// Asynchronous local adapter only. It intentionally tolerates an aborted signal,
// so the generation guard remains necessary. No login or backend integration.
const read = async (_signal) => fixture
export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const loader = useMemo(() => createLoader(read, dispatch), [dispatch])
  useEffect(() => { void loader.load(); return loader.cancel }, [loader])
  const rows = useMemo(() => selectRows(state.rows, state.query), [state.rows, state.query])
  return h(Board, { state, rows, onQuery: (value) => dispatch({ type: "query", value }), onReload: loader.load })
}
createRoot(document.getElementById("root")).render(h(App))
