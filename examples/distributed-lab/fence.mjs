import { DatabaseSync } from "node:sqlite"
// Epoch issuance is a trusted single-authority fixture, not a lease service.
export function fencedResource(path = ":memory:") {
  const db = new DatabaseSync(path)
  db.exec("CREATE TABLE IF NOT EXISTS resource(id INTEGER PRIMARY KEY CHECK(id=1),epoch INTEGER NOT NULL,value TEXT NOT NULL) STRICT; INSERT OR IGNORE INTO resource VALUES(1,0,'initial')")
  return {
    write(epoch, value) {
      if (!Number.isSafeInteger(epoch) || epoch <= 0 || typeof value !== "string" || value.length > 80) throw new TypeError("invalid write")
      return db.prepare("UPDATE resource SET epoch=?,value=? WHERE id=1 AND epoch <= ?").run(epoch, value, epoch).changes === 1
    },
    read() { return { ...db.prepare("SELECT epoch,value FROM resource WHERE id=1").get() } },
    close() { db.close() },
  }
}
