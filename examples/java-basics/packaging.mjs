import { mkdirSync, copyFileSync } from "node:fs"
import { join, dirname } from "node:path"
export function buildJar(f) {
  const sources = ["kb/app/Main.java", "kb/trips/TripText.java"].map((path) => {
    const dest = join(f.dir, "src", path)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(new URL(`./packaged/${path}`, import.meta.url), dest)
    return dest
  })
  const r = f.compile(sources)
  if (r.status !== 0) throw new Error(r.stderr)
  const artifact = join(f.dir, "travel app.jar")
  const packed = f.jar([
    "--create",
    "--file",
    artifact,
    "--main-class",
    "kb.app.Main",
    "-C",
    f.out,
    ".",
  ])
  if (packed.status !== 0) throw new Error(packed.stderr)
  return artifact
}
