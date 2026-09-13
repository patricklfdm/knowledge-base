import { javaFixture } from "./tools.mjs"
import { buildJar } from "./packaging.mjs"
const f = javaFixture()
try {
  const jar = buildJar(f)
  const r = f.launch(["-jar", jar, "海湾 城"])
  process.stdout.write(r.stdout)
  process.stderr.write(r.stderr)
  process.exitCode = r.status
} finally {
  f.close()
}
