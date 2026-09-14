import test from "node:test"
import assert from "node:assert/strict"
import { decodeIndexText, searchPreview } from "./kb-search-preview"

const text = (parts: ReturnType<typeof searchPreview>) => parts.map((part) => part.text).join("")

test("decode exactly one Quartz escape layer, preserving literal entity examples", () => {
  assert.equal(decodeIndexText("&lt;b&gt;&quot;山城&quot;&#039;&amp;&lt;/b&gt;"), "<b>\"山城\"'&</b>")
  assert.equal(decodeIndexText("&amp;lt;b&amp;gt;"), "&lt;b&gt;")
  assert.equal(decodeIndexText("&#x3c; &unknown;"), "&#x3c; &unknown;")
})

test("Chinese late match is visible near the start rather than a whitespace-sized tail", () => {
  const parts = searchPreview("旧内容".repeat(500) + "请求校验" + "后续".repeat(200), "请求校验")
  assert.ok(text(parts).startsWith("…"))
  assert.ok(text(parts).indexOf("请求校验") <= 21)
  assert.ok(Array.from(text(parts)).length <= 102)
  assert.deepEqual(
    parts.filter((p) => p.highlight),
    [{ text: "请求校验", highlight: true }],
  )
})

test("English match is case insensitive; regex syntax stays literal", () => {
  assert.deepEqual(
    searchPreview("使用SQLite查询", "sqlite").filter((p) => p.highlight),
    [{ text: "SQLite", highlight: true }],
  )
  assert.equal(
    searchPreview("普通文字", ".*").some((p) => p.highlight),
    false,
  )
  assert.equal(searchPreview("使用a+b()", "a+b()").find((p) => p.highlight)?.text, "a+b()")
})

test("no exact phrase or empty query uses a bounded opening without fake highlights", () => {
  for (const query of ["未命中", " "]) {
    const result = searchPreview("首段".repeat(100), query)
    assert.equal(
      result.some((p) => p.highlight),
      false,
    )
    assert.equal(Array.from(text(result)).length, 101)
    assert.ok(text(result).startsWith("首段"))
  }
  assert.deepEqual(searchPreview("", "test"), [])
  assert.throws(() => searchPreview("text", "t", 0))
})

test("code point slicing does not split emoji, and whitespace is normalized", () => {
  const result = text(searchPreview("😀".repeat(150) + "备注" + "😀".repeat(150), "备注"))
  assert.ok(result.includes("备注"))
  assert.ok(Array.from(result).every((c) => c === "😀" || c === "备" || c === "注" || c === "…"))
  assert.equal(text(searchPreview(" a\n\t b ", "a b")), "a b")
})

test("HTML-like input remains text parts; matching does not generate HTML strings", () => {
  const source = "&lt;img src=x onerror=alert(1)&gt; &quot;备注&quot;"
  const result = searchPreview(source, "备注")
  assert.equal(text(result), '<img src=x onerror=alert(1)> "备注"')
  assert.ok(result.every((p) => typeof p.text === "string" && typeof p.highlight === "boolean"))
})
