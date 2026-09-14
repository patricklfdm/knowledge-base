import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { checkContent } from "./check.mjs"

const DAY = 86_400_000
const nonempty = (v) => typeof v === "string" && v.trim().length > 0

function day(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new Error(`REVIEW_DATE: 无效ISO日期 ${value}`)
  return Date.parse(value) / DAY
}

// All referenced files must stay in the repository; reject symlinks before reading.
function localFile(root, relative) {
  if (
    !nonempty(relative) ||
    relative.includes("\\") ||
    path.isAbsolute(relative) ||
    relative.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error(`REVIEW_PATH: 非法相对路径 ${relative}`)
  let current = root
  for (const part of relative.split("/")) {
    current = path.join(current, part)
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`REVIEW_PATH: 符号链接 ${relative}`)
  }
  if (!fs.statSync(current).isFile()) throw new Error(`REVIEW_PATH: 不是文件 ${relative}`)
  return current
}

const runtimeFiles = {
  node: [".nvmrc", ".node-version"],
  python: [
    "examples/python-basics/.python-version",
    "examples/data-pipeline/.python-version",
    "examples/search-lab/.python-version",
  ],
  java: ["examples/java-basics/.java-version"],
}
const runtimePatterns = [
  ["node", /^Node\.js (\d+\.\d+\.\d+)(?:$|\s)/],
  ["python", /^(?:CPython|Python) (\d+\.\d+\.\d+)(?:$|\s)/],
  ["java", /^Microsoft OpenJDK (\d+\.\d+\.\d+(?:\.\d+)?)(?:\+\d+)?(?:$|\s)/],
]

export function reviewContent(
  root,
  { asOf = new Date().toISOString().slice(0, 10), maxAgeDays = 180 } = {},
) {
  root = fs.realpathSync(root)
  const today = day(asOf)
  if (!Number.isSafeInteger(maxAgeDays) || maxAgeDays < 1)
    throw new Error("REVIEW_INTERVAL: maxAgeDays需为正安全整数")
  if (fs.lstatSync(path.join(root, "content")).isSymbolicLink())
    throw new Error("REVIEW_PATH: content根目录不能是符号链接")
  const checked = checkContent(path.join(root, "content"), { inventory: true })
  if (checked.errors.length) throw new Error(checked.errors.join("\n"))
  const pins = Object.fromEntries(
    Object.entries(runtimeFiles).map(([name, files]) => {
      const versions = files.map((f) => fs.readFileSync(localFile(root, f), "utf8").trim())
      const pattern = name === "java" ? /^\d+\.\d+\.\d+(?:\.\d+)?$/ : /^\d+\.\d+\.\d+$/
      if (versions.some((v) => !pattern.test(v)) || new Set(versions).size !== 1)
        throw new Error(`REVIEW_RUNTIME: ${name}固定版本缺失、非法或不一致`)
      return [name, versions[0]]
    }),
  )
  const notesById = new Map(checked.notes.map((n) => [n.meta.id, n]))
  const candidates = [],
    unCompared = [],
    links = new Map()
  let teachingNotes = 0
  for (const { meta, links: noteLinks, file } of checked.notes) {
    for (const { url, location } of noteLinks) {
      if (!/^https?:/i.test(url)) continue
      let parsed
      try {
        parsed = new URL(url)
      } catch {
        throw new Error(`REVIEW_URL: ${file}: ${url}`)
      }
      if (!parsed.hostname || parsed.username || parsed.password)
        throw new Error(`REVIEW_URL: 不接受缺主机或含凭证的URL ${file}`)
      if (!links.has(url)) links.set(url, [])
      links.get(url).push({ note_id: meta.id, location })
    }
    if (meta.note_type === "navigation") continue
    teachingNotes++
    if (meta.verified_on != null) {
      const age = today - day(meta.verified_on)
      if (age < 0) throw new Error(`REVIEW_FUTURE: ${meta.id}核验日期晚于as-of`)
      if (meta.status === "reviewed" && age >= maxAgeDays)
        candidates.push({
          kind: "age",
          note_id: meta.id,
          verified_on: meta.verified_on,
          age_days: age,
        })
    }
    if (meta.status === "needs-update") candidates.push({ kind: "needs-update", note_id: meta.id })
    for (const tested of meta.tested_with ?? []) {
      const matched = runtimePatterns
        .map(([name, pattern]) => [name, tested.match(pattern)])
        .find(([, match]) => match)
      if (!matched) {
        unCompared.push({ note_id: meta.id, tested_with: tested })
        continue
      }
      const [name, match] = matched
      if (match[1] !== pins[name])
        candidates.push({
          kind: "runtime",
          note_id: meta.id,
          runtime: name,
          tested: match[1],
          pinned: pins[name],
        })
    }
  }
  const backlog = JSON.parse(
    fs.readFileSync(localFile(root, "docs/knowledge-base/codex/BACKLOG.json"), "utf8"),
  )
  const taskIds = new Set(backlog.tasks.map((t) => t.id))
  const receipts = JSON.parse(
    fs.readFileSync(localFile(root, "docs/knowledge-base/maintenance/observations.json"), "utf8"),
  )
  if (receipts.schema_version !== 1 || !Array.isArray(receipts.observations))
    throw new Error("REVIEW_SCHEMA: observations需为v1数组")
  const seen = new Set()
  for (const entry of receipts.observations) {
    if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id ?? "") || seen.has(entry.id))
      throw new Error("REVIEW_OBSERVATION: id缺失、非法或重复")
    seen.add(entry.id)
    if (
      !["external-link", "version", "feedback"].includes(entry.kind) ||
      !nonempty(entry.summary) ||
      Object.keys(entry).some(
        (k) =>
          ![
            "id",
            "kind",
            "observed_on",
            "note_ids",
            "summary",
            "evidence",
            "backlog_id",
            "url",
          ].includes(k),
      )
    )
      throw new Error(`REVIEW_OBSERVATION: ${entry.id}类型/摘要/字段非法（不设置任务状态）`)
    if (day(entry.observed_on) > today) throw new Error(`REVIEW_FUTURE: ${entry.id}观测来自未来`)
    if (
      !Array.isArray(entry.note_ids) ||
      !entry.note_ids.length ||
      new Set(entry.note_ids).size !== entry.note_ids.length ||
      entry.note_ids.some((id) => !notesById.has(id))
    )
      throw new Error(`REVIEW_OBSERVATION: ${entry.id}引用不存在或重复的笔记`)
    if (!Array.isArray(entry.evidence) || !entry.evidence.length)
      throw new Error(`REVIEW_EVIDENCE: ${entry.id}需有仓库内回执`)
    for (const evidence of entry.evidence) {
      if (!/^reports\/[^/]+\.md$/.test(evidence))
        throw new Error(`REVIEW_EVIDENCE: ${entry.id}应引用reports内Markdown回执`)
      if (!fs.readFileSync(localFile(root, evidence), "utf8").trim())
        throw new Error(`REVIEW_EVIDENCE: 空回执 ${evidence}`)
    }
    if (entry.backlog_id !== null && !taskIds.has(entry.backlog_id))
      throw new Error(`REVIEW_BACKLOG: ${entry.id}需引用实际任务或显式null等待分诊`)
    if (entry.kind === "external-link") {
      if (
        !links.has(entry.url) ||
        entry.note_ids.some((id) => !links.get(entry.url).some((ref) => ref.note_id === id))
      )
        throw new Error(`REVIEW_SOURCE: ${entry.id}来源不在所指笔记的外链中`)
    } else if (entry.url !== undefined)
      throw new Error(`REVIEW_OBSERVATION: ${entry.id}非外链观测无需url`)
    if (entry.backlog_id === null)
      candidates.push({
        kind: "untriaged-observation",
        observation_id: entry.id,
        note_ids: entry.note_ids,
      })
  }
  return {
    as_of: asOf,
    max_age_days: maxAgeDays,
    notes: checked.count,
    teaching_notes: teachingNotes,
    pins,
    candidates,
    observations: receipts.observations,
    unCompared,
    external_links: [...links]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([url, references]) => ({ url, references })),
    network: "NOT_RUN",
    writes: "NONE",
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2),
      options = {},
      seen = new Set()
    let root = ".",
      json = false
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (seen.has(arg)) throw new Error(`REVIEW_ARGUMENT: 重复参数 ${arg}`)
      seen.add(arg)
      if (arg === "--json") {
        json = true
        continue
      }
      if (
        !["--root", "--as-of", "--max-age-days"].includes(arg) ||
        !args[i + 1] ||
        args[i + 1].startsWith("--")
      )
        throw new Error(`REVIEW_ARGUMENT: 未知参数或缺值 ${arg}`)
      const value = args[++i]
      if (arg === "--root") root = value
      if (arg === "--as-of") options.asOf = value
      if (arg === "--max-age-days") options.maxAgeDays = /^\d+$/.test(value) ? Number(value) : NaN
    }
    const report = reviewContent(root, options)
    if (json) console.log(JSON.stringify(report, null, 2))
    else {
      console.log(
        `KB review: ${report.notes} notes, ${report.candidates.length} candidates, ${report.external_links.length} unique external links, ${report.observations.length} observations; as-of ${report.as_of}`,
      )
      for (const candidate of report.candidates) console.log(JSON.stringify(candidate))
      console.log(
        `Network NOT_RUN; writes NONE; ${report.unCompared.length} tested_with entries outside fixed runtime comparison. Candidates require human review; exit 0 does not certify content freshness.`,
      )
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
