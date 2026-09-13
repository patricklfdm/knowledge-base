import { copyFileSync } from "node:fs"
import { join } from "node:path"
import { javaFixture } from "./tools.mjs"

export function lessonSource(f, name) {
  if (
    ![
      "NumericValues",
      "DaysInput",
      "TripModel",
      "ObjectLesson",
      "CollectionLesson",
      "ContractLesson",
    ].includes(name)
  )
    throw new Error("Unknown maintained lesson")
  const source = join(f.dir, `${name}.java`)
  copyFileSync(new URL(`./${name}.java`, import.meta.url), source)
  return source
}
export function runLesson(name, args) {
  const f = javaFixture()
  try {
    const dependencies = ["ObjectLesson", "CollectionLesson", "ContractLesson"].includes(name)
      ? [lessonSource(f, "TripModel")]
      : []
    const compiled = f.compile([...dependencies, lessonSource(f, name)])
    if (compiled.status !== 0) throw new Error(compiled.stderr)
    const result = f.run(name, args)
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    process.exitCode = result.status
  } finally {
    f.close()
  }
}
