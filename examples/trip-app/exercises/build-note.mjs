import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
// Only build a new temporary copy from the explicit teaching runtime list.
export function buildNote() {
  const dir = mkdtempSync(join(tmpdir(), "kb-note space-")),
    app = join(dir, "app")
  try {
    mkdirSync(join(app, "web"), { recursive: true })
    for (const name of [
      "package.json",
      "server.mjs",
      "serve.mjs",
      "process.mjs",
      "input.mjs",
      "store.mjs",
      "web/app.js",
      "web/client.js",
      "web/controller.js",
      "web/fields.js",
      "web/index.html",
    ])
      copyFileSync(new URL("../" + name, import.meta.url), join(app, name))
    for (const [from, to] of [
      ["input.mjs", "base-input.mjs"],
      ["store.mjs", "base-store.mjs"],
      ["web/fields.js", "web/base-fields.js"],
    ])
      copyFileSync(join(app, from), join(app, to))
    for (const [from, to] of [
      ["note-input.mjs", "input.mjs"],
      ["note-store.mjs", "store.mjs"],
      ["note-fields.js", "web/fields.js"],
    ])
      copyFileSync(new URL(from, import.meta.url), join(app, to))
    function replace(file, before, after) {
      const path = join(app, file),
        s = readFileSync(path, "utf8")
      if (s.split(before).length !== 2) throw new Error("练习补丁匹配失效：" + file + " " + before)
      writeFileSync(path, s.replace(before, after))
    }
    replace(
      "server.mjs",
      '"app.js", "client.js", "controller.js", "fields.js"',
      '"app.js", "client.js", "controller.js", "fields.js", "base-fields.js"',
    )
    replace(
      "web/controller.js",
      "save: (id, destination, days)",
      'save: (id, destination, days, note = "")',
    )
    replace(
      "web/controller.js",
      "parseTripFields(destination, days)",
      "parseTripFields(destination, days, note)",
    )
    replace(
      "web/index.html",
      '<button id="save"',
      '<label for="note">备注（最多120代码单元）</label><input id="note" name="note" maxlength="120" />\n      <button id="save"',
    )
    replace("web/app.js", 'days = get("days"),', 'days = get("days"),\n  note = get("note"),')
    replace("web/app.js", 'trip.days + "天 "', 'trip.days + "天 " + trip.note + " "')
    replace(
      "web/app.js",
      "days.value = String(trip.days)",
      "days.value = String(trip.days)\n        note.value = trip.note",
    )
    replace(
      "web/app.js",
      "controller.save(editing, destination.value, days.value)",
      "controller.save(editing, destination.value, days.value, note.value)",
    )
    return { dir, app, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
  } catch (error) {
    rmSync(dir, { recursive: true, force: true })
    throw error
  }
}
