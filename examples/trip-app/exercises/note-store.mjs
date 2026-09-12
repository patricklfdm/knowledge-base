import { DatabaseSync } from "node:sqlite"
import { openStore as openBase } from "./base-store.mjs"
export function migrate(db, failAfterAlter = false) {
  const version = db.prepare("PRAGMA user_version").get().user_version
  const names = db
    .prepare("PRAGMA table_info(trips)")
    .all()
    .map((x) => x.name)
    .join(",")
  if (version === 1 && names === "id,destination,days,note") return
  if (version !== 0 || names !== "id,destination,days")
    throw new Error("不支持的教学数据库版本/结构")
  db.exec("BEGIN IMMEDIATE")
  try {
    db.exec("ALTER TABLE trips ADD COLUMN note TEXT NOT NULL DEFAULT ''")
    if (failAfterAlter) throw new Error("故意中断迁移")
    db.exec("PRAGMA user_version=1")
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
export function openStore(path) {
  const base = openBase(path)
  base.close()
  const db = new DatabaseSync(path)
  try {
    migrate(db)
    const insert = db.prepare("INSERT INTO trips(destination,days,note) VALUES(?,?,?)")
    const get = db.prepare("SELECT id,destination,days,note FROM trips WHERE id=?")
    const list = db.prepare("SELECT id,destination,days,note FROM trips ORDER BY id")
    const update = db.prepare("UPDATE trips SET destination=?,days=?,note=? WHERE id=?")
    return {
      create: ({ destination, days, note }) =>
        get.get(insert.run(destination, days, note).lastInsertRowid),
      get: (id) => get.get(id),
      list: () => list.all(),
      update(id, { destination, days, note }) {
        const r = update.run(destination, days, note, id)
        return r.changes === 0 ? undefined : get.get(id)
      },
      close: () => db.close(),
    }
  } catch (error) {
    db.close()
    throw error
  }
}
