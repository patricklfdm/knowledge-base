import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { initialState, reducer, createSelector } from "./web/state.mjs"
import { Board } from "./web/view.mjs"
const rows = [{ id: 1, title: "海边" }, { id: 2, title: "山间" }]
let visits = 0
const select = createSelector(() => visits++)
const state = reducer(initialState, { type: "success", rows })
assert.equal(select(rows, "海").length, 1)
assert.equal(select(rows, "海").length, 1)
assert.equal(visits, 2)
console.log(JSON.stringify({ matching: 1, visits, calls: 2 }))
console.log(renderToStaticMarkup(createElement(Board, { state, rows, onQuery() {}, onReload() {} })))
