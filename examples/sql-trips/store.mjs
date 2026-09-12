import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"

export function openTrips(path) {
  const db = new DatabaseSync(path)
  try {
    db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"))
    const insert = db.prepare("INSERT INTO trips (destination, days) VALUES (?, ?)")
    const byId = db.prepare("SELECT id, destination, days FROM trips WHERE id = ?")
    const list = db.prepare("SELECT id, destination, days FROM trips ORDER BY id")
    const atLeast = db.prepare(
      "SELECT id, destination, days FROM trips WHERE days >= ? ORDER BY days, id",
    )
    return {
      // This storage lesson intentionally exposes SQL coercion, not API validation.
      create(destination, days) {
        const result = insert.run(destination, days)
        return byId.get(result.lastInsertRowid)
      },
      get: (id) => byId.get(id),
      list: () => list.all(),
      atLeast: (days) => atLeast.all(days),
      close: () => db.close(),
    }
  } catch (error) {
    db.close()
    throw error
  }
}
