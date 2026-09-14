import assert from "node:assert/strict"
import { rehearseReplay } from "./replay.mjs"
import { replica, NotCaughtUp } from "./replica.mjs"
import { fencedResource } from "./fence.mjs"
console.log(JSON.stringify(await rehearseReplay()))
const r = replica(); r.apply({ sequence: 1, id: 1, title: "old" }); assert.throws(() => r.read(2), NotCaughtUp)
r.apply({ sequence: 2, id: 1, title: "new" }); console.log(JSON.stringify(r.read(2)))
const resource = fencedResource()
try { resource.write(2, "new-holder"); assert.equal(resource.write(1, "stale"), false); console.log(JSON.stringify(resource.read())) }
finally { resource.close() }
