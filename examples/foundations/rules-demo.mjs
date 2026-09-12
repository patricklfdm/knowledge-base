import { validateDays } from "./rules.mjs"

console.log(validateDays(3))
console.log(validateDays(0))
console.log(validateDays(30))
console.log(validateDays(31))
console.log(validateDays(2.5))
console.log(validateDays("3"))
