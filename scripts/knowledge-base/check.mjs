import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { parseDocument } from "yaml"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"
import GithubSlugger from "github-slugger"
import { GitHubFlavoredMarkdown } from "@quartz-community/github-flavored-markdown"
import { slugifyFilePath, transformLink } from "@quartz-community/utils"

const types = ["navigation", "concept", "tutorial", "how-to", "reference", "case-study", "lab"]
const text = (v) => typeof v === "string" && v.trim().length > 0
const strings = (v) => Array.isArray(v) && v.every(text)
const published = (n) => n.meta.publish === true && n.meta.draft === false
const parser = unified()
  .use(remarkParse)
  .use(GitHubFlavoredMarkdown({ enableSmartyPants: false }).markdownPlugins())

export function filesIn(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`SYMLINK: ${file}；不跟随 content 内符号链接`)
    return entry.isDirectory() ? filesIn(file) : [file]
  })
}

export function checkContent(
  root,
  { ignore = ["private", "templates", ".obsidian", ".trash"] } = {},
) {
  const errors = []
  const fail = (file, code, message) => errors.push(`${file}: ${code}: ${message}`)
  const allFiles = filesIn(root)
    .map((f) => path.relative(root, f).split(path.sep).join("/"))
    .filter((f) => !f.split("/").some((part) => ignore.includes(part)))
  const notes = []
  for (const file of allFiles) {
    if (!file.endsWith(".md")) {
      // H1 has no accepted content attachments. Require an explicit H4 policy before adding any.
      fail(file, "UNSUPPORTED_ASSET", "H1 尚未开放附件；请先建立附件允许清单和产物测试")
      continue
    }
    const source = fs.readFileSync(path.join(root, file), "utf8")
    const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    if (!front) {
      fail(file, "FRONTMATTER", "需要 YAML frontmatter")
      continue
    }
    const doc = parseDocument(front[1])
    if (doc.errors.length) {
      fail(file, "YAML", doc.errors.map((e) => e.message).join("; "))
      continue
    }
    const meta = doc.toJSON()
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
      fail(file, "METADATA", "需要字段映射")
      continue
    }
    const body = source.slice(front[0].length)
    const tree = parser.parse(body)
    const slugger = new GithubSlugger()
    const anchors = new Set()
    const links = []
    const definitions = new Map()
    const getText = (n) => n.value ?? n.children?.map(getText).join("") ?? ""
    visit(tree, "heading", (n) => anchors.add(slugger.slug(getText(n))))
    visit(tree, "definition", (n) => definitions.set(n.identifier, n.url))
    visit(tree, (n) => {
      const location = `${file}:${(n.position?.start.line ?? 1) + front[0].split("\n").length - 1}`
      if (n.type === "link" || n.type === "image") links.push({ url: n.url, location })
      if (n.type === "linkReference" || n.type === "imageReference") {
        const url = definitions.get(n.identifier)
        if (url) links.push({ url, location })
        else fail(location, "REFERENCE", `未定义引用 ${n.identifier}`)
      }
      if (n.type.startsWith("footnote"))
        fail(location, "UNSUPPORTED_FOOTNOTE", "脚注尚未支持，请使用正文来源链接")
      if (n.type === "html")
        fail(location, "UNSUPPORTED_HTML", "原始 HTML 尚未纳入链接检查；请使用 Markdown")
      if (n.type === "text" && /\[\[|\]\]|\[\^|\^\w+\s*$|%%/.test(n.value)) {
        fail(
          location,
          "UNSUPPORTED_OBSIDIAN",
          "wiki/block/footnote/comment 语法尚未支持；请使用普通 Markdown 链接",
        )
      }
    })
    const note = { file, meta, anchors, links, slug: slugifyFilePath(file) }
    notes.push(note)
    for (const key of ["id", "title", "description"])
      if (!text(meta[key])) fail(file, "REQUIRED", `${key} 必须是非空字符串`)
    if (text(meta.id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id))
      fail(file, "ID", "id 只能使用小写字母、数字和连字符")
    if (!types.includes(meta.note_type)) fail(file, "NOTE_TYPE", "未知 note_type")
    if (!["seed", "draft", "reviewed", "needs-update"].includes(meta.status))
      fail(file, "STATUS", "未知 status")
    for (const key of ["draft", "publish"]) {
      if (!(key === "publish" && meta[key] === undefined) && typeof meta[key] !== "boolean")
        fail(file, "BOOLEAN", `${key} 必须为 YAML boolean`)
    }
    if (meta.status === "seed" && meta.note_type !== "navigation")
      fail(file, "SEED", "seed 仅用于 navigation")
    if (meta.status === "draft" && (meta.draft !== true || meta.publish === true))
      fail(file, "DRAFT_STATE", "draft 必须 draft=true 且 publish=false（或省略 publish）")
    if (meta.status === "needs-update" && meta.publish === true)
      fail(file, "UPDATE_STATE", "needs-update 默认撤下；当前未实现维护例外")
    if (
      meta.publish === true &&
      (meta.draft !== false ||
        !(
          meta.status === "reviewed" ||
          (meta.note_type === "navigation" && meta.status === "seed")
        ))
    )
      fail(file, "PUBLISH_STATE", "发布需 reviewed 或 navigation+seed，且 draft=false")
    for (const key of ["tags", "aliases", "prerequisites", "topics", "tested_with"]) {
      if (meta[key] !== undefined && !strings(meta[key]))
        fail(file, "ARRAY", `${key} 必须为非空字符串元素的数组（数组可空）`)
    }
    if (meta.note_type !== "navigation") {
      if (!/^L[0-5]$/.test(meta.level ?? "")) fail(file, "LEVEL", "正文 level 必须为 L0–L5")
      for (const key of ["prerequisites", "topics", "tested_with"])
        if (!strings(meta[key])) fail(file, "REQUIRED_ARRAY", `正文必须填写 ${key} 数组`)
      if (meta.status === "reviewed") {
        const date = meta.verified_on
        if (
          typeof date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(date)) ||
          new Date(date).toISOString().slice(0, 10) !== date
        )
          fail(file, "VERIFIED_DATE", "reviewed 正文需真实 ISO 日期 verified_on")
      }
      if (meta.status === "draft" && meta.verified_on !== null)
        fail(file, "DRAFT_DATE", "草稿 verified_on 必须为 null")
    }
  }
  const ids = new Map()
  const slugs = new Map()
  const aliases = new Map()
  for (const n of notes) {
    if (ids.has(n.meta.id))
      fail(n.file, "DUPLICATE_ID", `${n.meta.id} 与 ${ids.get(n.meta.id).file} 重复`)
    if (!ids.has(n.meta.id)) ids.set(n.meta.id, n)
    if (slugs.has(n.slug))
      fail(n.file, "SLUG_COLLISION", `与 ${slugs.get(n.slug).file} 的 Quartz URL 重复`)
    slugs.set(n.slug, n)
  }
  for (const n of notes)
    for (const alias of strings(n.meta.aliases) ? n.meta.aliases : []) {
      const slug = slugifyFilePath(path.posix.join(path.posix.dirname(n.file), alias))
      if (
        alias.startsWith("/") ||
        alias.split("/").includes("..") ||
        aliases.has(slug) ||
        slugs.has(slug)
      )
        fail(n.file, "ALIAS_COLLISION", `${alias} 越界、重复或与页面路径冲突`)
      aliases.set(slug, n)
    }
  for (const n of notes) {
    const prereqs = strings(n.meta.prerequisites) ? n.meta.prerequisites : []
    if (new Set(prereqs).size !== prereqs.length) fail(n.file, "DUPLICATE_PREREQUISITE", "先修重复")
    for (const id of prereqs) {
      if (!ids.has(id)) fail(n.file, "UNKNOWN_PREREQUISITE", `不存在 ${id}`)
      else if (id === n.meta.id) fail(n.file, "SELF_PREREQUISITE", "不能依赖自身")
      else if (published(n) && !published(ids.get(id)))
        fail(n.file, "UNPUBLISHED_PREREQUISITE", `${id} 尚未发布`)
    }
    for (const { url, location } of n.links) {
      if (/^(https?:|mailto:|tel:)/i.test(url)) continue
      if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) {
        fail(location, "UNSUPPORTED_URL", url)
        continue
      }
      let decoded
      try {
        decoded = decodeURI(url)
      } catch {
        fail(location, "URL_ENCODING", url)
        continue
      }
      if (decoded.includes("?")) {
        fail(location, "UNSUPPORTED_QUERY", "内部链接暂不支持 query")
        continue
      }
      if (decoded.startsWith("/")) {
        fail(location, "ABSOLUTE_LINK", "请使用相对路径，避免绕过 /knowledge-base/")
        continue
      }
      const [targetPath, anchor] = decoded.split("#")
      let target = n
      if (targetPath) {
        const named = targetPath.replace(/^(\.\.\/|\.\/)+/, "")
        const variants = allFiles.filter(
          (f) =>
            f.toLowerCase() === named.toLowerCase() ||
            f.toLowerCase().endsWith("/" + named.toLowerCase()),
        )
        if (variants.length && !variants.some((f) => f === named || f.endsWith("/" + named))) {
          fail(location, "CASE_MISMATCH", `${url} 与源文件大小写不一致`)
          continue
        }
        // Match installed Quartz's `shortest` resolver, then map its browser-relative result.
        const allSlugs = [...slugs.keys(), ...aliases.keys()]
        const basename = slugifyFilePath(targetPath).replace(/^(\.\.\/|\.\/)+/, "")
        const matches = allSlugs.filter((s) => s === basename || s.endsWith("/" + basename))
        if (!targetPath.startsWith(".") && matches.length > 1) {
          fail(location, "AMBIGUOUS_LINK", url)
          continue
        }
        const transformed = transformLink(n.slug, url, { strategy: "shortest", allSlugs }).split(
          "#",
        )[0]
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(n.slug), transformed),
        )
        target = slugs.get(resolved) ?? slugs.get(resolved + "/index") ?? aliases.get(resolved)
        if (!target && (resolved === "." || resolved === "./" || resolved === "/"))
          target = slugs.get("index")
        if (!target) {
          fail(location, "MISSING_LINK", `${url}（Quartz 目标 ${resolved}）`)
          continue
        }
      }
      if (published(n) && !published(target))
        fail(location, "UNPUBLISHED_LINK", `${url} 指向未发布正文`)
      if (anchor) {
        const normalized = new GithubSlugger().slug(decodeURIComponent(anchor))
        if (!target.anchors.has(normalized))
          fail(location, "MISSING_ANCHOR", `${url}；目标标题锚点不存在`)
      }
    }
  }
  const active = new Set(),
    done = new Set()
  const walk = (n) => {
    if (active.has(n)) {
      fail(n.file, "PREREQUISITE_CYCLE", "必要先修存在环")
      return
    }
    if (done.has(n)) return
    active.add(n)
    for (const id of strings(n.meta.prerequisites) ? n.meta.prerequisites : [])
      if (ids.has(id)) walk(ids.get(id))
    active.delete(n)
    done.add(n)
  }
  notes.forEach(walk)
  return { errors, count: notes.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = checkContent(path.resolve(process.argv[2] ?? "content"))
    result.errors.forEach((e) => console.error(e))
    console.log(`KB check: ${result.count} notes, ${result.errors.length} errors`)
    process.exitCode = result.errors.length ? 1 : 0
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
