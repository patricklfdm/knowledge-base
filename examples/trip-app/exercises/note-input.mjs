import { parseTrip as parseBase, inputError } from "./base-input.mjs"
export { readJson, inputError } from "./base-input.mjs"
export function parseTrip(input) {
  const base = parseBase(input)
  const note = input.note === undefined ? "" : input.note
  if (typeof note !== "string" || note.length > 120)
    throw inputError(422, "INVALID_TRIP", "备注必须为不超过120个UTF-16代码单元的文字")
  return { ...base, note }
}
