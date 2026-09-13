import { writerContention, readerBlocksCommit, staleSnapshot } from "./connections.mjs"

for (const mode of ["DELETE", "WAL"]) {
  console.log("写竞争", JSON.stringify(writerContention(mode)))
}
console.log("读锁阻止提交", JSON.stringify(readerBlocksCommit()))
console.log("旧快照", JSON.stringify(staleSnapshot()))
