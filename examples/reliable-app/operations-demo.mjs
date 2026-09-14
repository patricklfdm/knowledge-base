import { rehearseShutdown, rehearseRestore } from "./operations.mjs"
import { errorBudget } from "./budget.mjs"
console.log(JSON.stringify(await rehearseShutdown()))
console.log(JSON.stringify(await rehearseRestore()))
console.log(JSON.stringify(errorBudget({ eligible: 1000, bad: 1 })))
