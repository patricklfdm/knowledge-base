import { javaFixture } from "./tools.mjs"

const f = javaFixture()
try {
  const compiled = f.compile()
  if (compiled.status !== 0) throw new Error(compiled.stderr)
  const result = f.run("TripSummary", process.argv.slice(2))
  if (result.status !== 0) throw new Error(result.stderr)
  process.stdout.write(result.stdout)
} finally {
  f.close()
}
