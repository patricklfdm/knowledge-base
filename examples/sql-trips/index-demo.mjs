import { comparePlans } from "./index-plans.mjs"

const { sqlite, ...states } = comparePlans()
console.log("SQLite", sqlite)
for (const [state, { plan, rows }] of Object.entries(states)) {
  console.log(JSON.stringify({ state, plan, rows: rows.length }))
}
