// contentIndex uses Quartz's five HTML escapes. Decode exactly one layer;
// a literal "&lt;" in the article must stay literal rather than become markup.
export function decodeIndexText(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
  }
  return value.replace(/&(?:amp|lt|gt|quot|#039);/g, (entity) => entities[entity])
}

export type PreviewPart = { text: string; highlight: boolean }

export function searchPreview(encoded: string, query: string, limit = 100): PreviewPart[] {
  if (!Number.isInteger(limit) || limit < 20) throw new Error("preview limit must be >= 20")
  const text = decodeIndexText(encoded).replace(/\s+/gu, " ").trim()
  const needle = query.trim().replace(/\s+/gu, " ")
  // Prefer the entire literal phrase. If it is absent, show the opening excerpt;
  // this presentation helper makes no claim about fuzzy retrieval relevance.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = needle ? new RegExp(escaped, "iu").exec(text) : null
  const chars = Array.from(text)
  const hit = match ? Array.from(text.slice(0, match.index)).length : -1
  const start = hit < 0 || chars.length <= limit ? 0 : Math.max(0, hit - 20)
  const end = Math.min(chars.length, start + limit)
  const body = chars.slice(start, end).join("")
  const displayedMatch = needle ? new RegExp(escaped, "iu").exec(body) : null
  const parts: PreviewPart[] = []
  const plain = (s: string) => {
    if (s) parts.push({ text: s, highlight: false })
  }
  if (start) plain("…")
  if (displayedMatch) {
    plain(body.slice(0, displayedMatch.index))
    parts.push({ text: displayedMatch[0], highlight: true })
    plain(body.slice(displayedMatch.index + displayedMatch[0].length))
  } else plain(body)
  if (end < chars.length) plain("…")
  return parts
}
