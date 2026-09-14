import { publishState } from "./file-publish.mjs"
const [dir, stopAt] = process.argv.slice(2)
if (!["before-rename", "after-rename"].includes(stopAt)) throw new Error("unknown phase")
publishState(dir, { seq: 1, value: 20 }, (phase) => {
  if (phase === stopAt) process.exit(17)
})
