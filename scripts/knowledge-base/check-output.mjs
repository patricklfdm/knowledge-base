import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { fromHtml } from "hast-util-from-html"
import { visit } from "unist-util-visit"
import { filesIn } from "./check.mjs"

export function checkOutput(root, base = "https://patricklfdm.github.io/knowledge-base/") {
  const errors = []
  const files = filesIn(root).map((f) => path.relative(root, f).split(path.sep).join("/"))
  const inventory = new Set(files)
  const pages = new Map()
  const site = new URL(base.endsWith("/") ? base : base + "/")
  for (const f of files.filter((f) => f.endsWith(".html"))) {
    const tree = fromHtml(fs.readFileSync(path.join(root, f), "utf8"))
    const ids = new Set(),
      links = []
    visit(tree, "element", (n) => {
      if (n.properties.id) ids.add(String(n.properties.id))
      for (const attr of ["href", "src"])
        if (n.properties[attr]) links.push(String(n.properties[attr]))
      if (n.properties.srcSet) errors.push(`${f}: UNSUPPORTED_SRCSET: 需扩展产物检查`)
    })
    pages.set(f, { ids, links })
  }
  if (
    !inventory.has("index.html") ||
    !inventory.has("404.html") ||
    !inventory.has("static/contentIndex.json")
  )
    errors.push("OUTPUT_REQUIRED: 缺首页、404 或搜索索引")
  for (const [file, { links }] of pages)
    for (const link of links) {
      if (/^(mailto:|tel:|data:|javascript:)/i.test(link)) continue
      let url
      try {
        url = new URL(link, new URL(file, site))
      } catch {
        errors.push(`${file}: OUTPUT_URL: ${link}`)
        continue
      }
      if (url.origin !== site.origin) continue
      if (url.pathname === site.pathname.slice(0, -1)) url.pathname += "/"
      if (!url.pathname.startsWith(site.pathname)) {
        errors.push(`${file}: BASE_PATH: ${link}`)
        continue
      }
      let rel
      try {
        rel = decodeURIComponent(url.pathname.slice(site.pathname.length))
      } catch {
        errors.push(`${file}: OUTPUT_ENCODING: ${link}`)
        continue
      }
      const target = [
        rel || "index.html",
        rel + ".html",
        rel.replace(/\/$/, "") + "/index.html",
      ].find((f) => inventory.has(f))
      if (!target) {
        errors.push(`${file}: OUTPUT_LINK: ${link}`)
        continue
      }
      if (
        url.hash &&
        pages.has(target) &&
        !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))
      )
        errors.push(`${file}: OUTPUT_ANCHOR: ${link}`)
    }
  return { errors, pages: pages.size, files: files.length }
}

export function findMarkers(root, markers) {
  return filesIn(root).flatMap((f) => {
    const bytes = fs.readFileSync(f)
    return markers
      .filter((m) => bytes.includes(Buffer.from(m)) || path.relative(root, f).includes(m))
      .map((m) => `${path.relative(root, f)}: LEAK: ${m}`)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = checkOutput(path.resolve(process.argv[2] ?? "public"))
    result.errors.forEach((e) => console.error(e))
    console.log(
      `KB output: ${result.pages} pages, ${result.files} files, ${result.errors.length} errors`,
    )
    process.exitCode = result.errors.length ? 1 : 0
  } catch (e) {
    console.error(e.message)
    process.exitCode = 1
  }
}
