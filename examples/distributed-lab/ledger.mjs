import { DatabaseSync } from "node:sqlite"
export class Conflict extends Error {}
export function openLedger(path = ":memory:") {
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS requests(owner TEXT NOT NULL, request_key TEXT NOT NULL, title TEXT NOT NULL, note_id INTEGER NOT NULL REFERENCES notes(id), PRIMARY KEY(owner,request_key)) STRICT;`)
  return {
    db,
    create(owner, key, title, beforeReceipt = () => {}) {
      if (!["alice", "bob"].includes(owner) || typeof key !== "string" || !/^[a-z0-9-]{1,40}$/.test(key) || typeof title !== "string" || !title.trim() || title.length > 80) throw new TypeError("invalid command")
      const normalized = title.trim()
      db.exec("BEGIN IMMEDIATE")
      try {
        const prior = db.prepare("SELECT title,note_id FROM requests WHERE owner=? AND request_key=?").get(owner, key)
        if (prior) {
          if (prior.title !== normalized) throw new Conflict("same key, different intent")
          db.exec("COMMIT"); return { id: prior.note_id, title: prior.title }
        }
        const id = Number(db.prepare("INSERT INTO notes(owner,title) VALUES (?,?)").run(owner, normalized).lastInsertRowid)
        beforeReceipt()
        db.prepare("INSERT INTO requests VALUES (?,?,?,?)").run(owner, key, normalized, id)
        db.exec("COMMIT"); return { id, title: normalized }
      } catch (error) { db.exec("ROLLBACK"); throw error }
    },
    count() { return db.prepare("SELECT count(*) AS n FROM notes").get().n },
    close() { db.close() },
  }
}
