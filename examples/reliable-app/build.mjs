import { build } from "esbuild"
import { mkdtemp, copyFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { pathToFileURL } from "node:url"
export async function buildClient() {
  const output = await mkdtemp(join(tmpdir(), "kb-react-build-"))
  const source = dirname(fileURLToPath(import.meta.url))
  try {
    await build({ entryPoints: [join(source, "web/app.mjs")], bundle: true, format: "esm", platform: "browser", outfile: join(output, "app.js"), define: { "process.env.NODE_ENV": '"production"' } })
    await copyFile(join(source, "web/index.html"), join(output, "index.html"))
    return output
  } catch (error) { await rm(output, { recursive: true, force: true }); throw error }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = await buildClient()
  console.log("Bundle and HTML built successfully (browser NOT_RUN)")
  await rm(output, { recursive: true, force: true })
}
