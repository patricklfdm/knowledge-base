import { DatabaseSync } from "node:sqlite"
export function producer(path = ":memory:") {
  const db = new DatabaseSync(path)
  db.exec("CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY,title TEXT NOT NULL) STRICT; CREATE TABLE IF NOT EXISTS outbox(id INTEGER PRIMARY KEY REFERENCES notes(id),title TEXT NOT NULL,sent INTEGER NOT NULL DEFAULT 0 CHECK(sent IN (0,1))) STRICT")
  return {
    db,
    create(title, afterWrite = () => {}) {
      if (typeof title !== "string" || !title || title.length > 80) throw new TypeError("invalid title")
      db.exec("BEGIN IMMEDIATE")
      try {
        const id = Number(db.prepare("INSERT INTO notes(title) VALUES (?)").run(title).lastInsertRowid)
        afterWrite(); db.prepare("INSERT INTO outbox(id,title) VALUES (?,?)").run(id, title)
        db.exec("COMMIT"); return id
      } catch (error) { db.exec("ROLLBACK"); throw error }
    },
    next() { const row = db.prepare("SELECT id,title FROM outbox WHERE sent=0 ORDER BY id LIMIT 1").get(); return row && { id: `producer-a:${row.id}`, title: row.title } },
    ack(event) {
      if (!/^producer-a:[1-9][0-9]*$/.test(event.id)) throw new TypeError("invalid event id")
      const changed = db.prepare("UPDATE outbox SET sent=1 WHERE id=? AND title=? AND sent=0").run(Number(event.id.split(":")[1]), event.title).changes
      if (changed !== 1) throw new Error("ack did not match pending event")
    },
    close() { db.close() },
  }
}
export function consumer(path = ":memory:") {
  const db = new DatabaseSync(path)
  db.exec("CREATE TABLE IF NOT EXISTS inbox(id TEXT PRIMARY KEY,title TEXT NOT NULL) STRICT; CREATE TABLE IF NOT EXISTS summary(id INTEGER PRIMARY KEY CHECK(id=1),n INTEGER NOT NULL) STRICT; INSERT OR IGNORE INTO summary VALUES(1,0)")
  return {
    db,
    apply(event, afterEffect = () => {}) {
      if (!event || typeof event.id !== "string" || !/^producer-a:[1-9][0-9]*$/.test(event.id) || typeof event.title !== "string" || !event.title || event.title.length > 80) throw new TypeError("invalid event")
      db.exec("BEGIN IMMEDIATE")
      try {
        const old = db.prepare("SELECT title FROM inbox WHERE id=?").get(event.id)
        if (old) {
          if (old.title !== event.title) throw new Error("event identity conflict")
          db.exec("COMMIT"); return false
        }
        db.prepare("INSERT INTO inbox VALUES (?,?)").run(event.id, event.title)
        db.exec("UPDATE summary SET n=n+1 WHERE id=1"); afterEffect()
        db.exec("COMMIT"); return true
      } catch (error) { db.exec("ROLLBACK"); throw error }
    },
    count() { return db.prepare("SELECT n FROM summary WHERE id=1").get().n },
    close() { db.close() },
  }
}
