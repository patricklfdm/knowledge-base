import { DatabaseSync } from "node:sqlite"
export function openStore(path) {
  const db = new DatabaseSync(path)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY,
      destination TEXT NOT NULL CHECK(destination <> ''),
      days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 30)
    ) STRICT`)
    const insert = db.prepare("INSERT INTO trips(destination,days) VALUES(?,?)")
    const get = db.prepare("SELECT id,destination,days FROM trips WHERE id=?")
    const list = db.prepare("SELECT id,destination,days FROM trips ORDER BY id")
    const update = db.prepare("UPDATE trips SET destination=?, days=? WHERE id=?")
    return {
      create: ({ destination, days }) => get.get(insert.run(destination, days).lastInsertRowid),
      get: (id) => get.get(id),
      list: () => list.all(),
      update(id, { destination, days }) {
        const result = update.run(destination, days, id)
        return result.changes === 0 ? undefined : get.get(id)
      },
      close: () => db.close(),
    }
  } catch (error) {
    db.close()
    throw error
  }
}
