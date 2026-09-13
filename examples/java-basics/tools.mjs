import { spawnSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export const sourceText = readFileSync(new URL("./TripSummary.java", import.meta.url), "utf8")
const version = readFileSync(new URL("./.java-version", import.meta.url), "utf8").trim()
const env = { ...process.env }
// Per-child reproducibility only; never modify the user's shell or global Java settings.
for (const key of [
  "JAVA_TOOL_OPTIONS",
  "_JAVA_OPTIONS",
  "JDK_JAVA_OPTIONS",
  "JDK_JAVAC_OPTIONS",
  "CLASSPATH",
])
  delete env[key]

function execute(command, args, cwd) {
  const r = spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: 15000 })
  if (r.error) throw r.error
  if (r.signal) throw new Error(`${command} terminated by ${r.signal}`)
  return r
}

export function javaFixture() {
  const home = process.env.KB_JAVA_HOME || process.env.JAVA_HOME
  if (!home) throw new Error(`Set KB_JAVA_HOME or JAVA_HOME to JDK ${version}`)
  const java = join(home, "bin", "java")
  const javac = join(home, "bin", "javac")
  const jar = join(home, "bin", "jar")
  for (const command of [java, javac, jar]) {
    const r = execute(command, ["--version"])
    const firstLine = (r.stdout + r.stderr).split("\n")[0]
    if (r.status !== 0 || !firstLine.split(/\s+/).includes(version)) {
      throw new Error(`Expected JDK ${version}: ${firstLine}`)
    }
  }
  const dir = mkdtempSync(join(tmpdir(), "kb-java space-"))
  const out = join(dir, "classes")
  mkdirSync(out)
  const source = join(dir, "TripSummary.java")
  writeFileSync(source, sourceText)
  return {
    dir,
    out,
    source,
    compile(file = source) {
      return execute(
        javac,
        [
          "-J-Duser.language=en",
          "-encoding",
          "UTF-8",
          "--release",
          "21",
          "-d",
          out,
          ...(Array.isArray(file) ? file : [file]),
        ],
        dir,
      )
    },
    run(name = "TripSummary", args = [], classpath = out) {
      return execute(
        java,
        ["-Duser.language=en", "-Dfile.encoding=UTF-8", "-cp", classpath, name, ...args],
        dir,
      )
    },
    jar(args) {
      return execute(jar, args, dir)
    },
    launch(args) {
      return execute(java, ["-Duser.language=en", "-Dfile.encoding=UTF-8", ...args], dir)
    },
    close() {
      rmSync(dir, { recursive: true, force: true })
    },
  }
}
