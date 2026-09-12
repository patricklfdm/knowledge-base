import { parseTripFields as parseBase } from "./base-fields.js"
export function parseTripFields(destination, days, note = "") {
  const base = parseBase(destination, days)
  if (typeof note !== "string" || note.length > 120)
    throw new Error("备注必须为不超过120个UTF-16代码单元的文字")
  return { ...base, note }
}
