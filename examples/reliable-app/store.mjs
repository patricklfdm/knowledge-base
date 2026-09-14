import { DatabaseSync } from "node:sqlite"
export function migrate(db, afterAlter = () => {}) {
  const version = db.prepare("PRAGMA user_version").get().user_version
  if (version > 2) throw new Error("unsupported schema")
  if (version === 2) return
  db.exec("BEGIN IMMEDIATE")
  try {
    if (version === 0) db.exec("CREATE TABLE notes (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL) STRICT; PRAGMA user_version=1")
    db.exec("ALTER TABLE notes ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0)")
    afterAlter()
    db.exec("PRAGMA user_version=2; COMMIT")
  } catch (error) { db.exec("ROLLBACK"); throw error }
}
export function openStore(path = ":memory:") {
  const db = new DatabaseSync(path)
  try { migrate(db) } catch (error) { db.close(); throw error }
  return {
    db,
    seed() { db.exec("INSERT INTO notes(id,owner,title) VALUES (1,'alice','海边'),(2,'bob','山间')") },
    get(id, owner) { return db.prepare("SELECT id,title,revision FROM notes WHERE id = ? AND owner = ?").get(id, owner) },
    update(id, owner, revision, title) {
      const result = db.prepare("UPDATE notes SET title = ?, revision = revision + 1 WHERE id = ? AND owner = ? AND revision = ?").run(title, id, owner, revision)
      return result.changes === 1
    },
    close() { db.close() },
  }
}
