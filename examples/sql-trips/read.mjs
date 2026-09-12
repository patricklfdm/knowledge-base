import { DatabaseSync } from "node:sqlite"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

export function readTrips(path) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    return db.prepare("SELECT id, destination, days FROM trips ORDER BY id").all()
  } finally {
    db.close()
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error("需要本例创建的数据库文件路径")
  console.log(JSON.stringify(readTrips(process.argv[2])))
}
