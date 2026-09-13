import { javaFixture } from "./tools.mjs"
import { lessonSource } from "./lesson.mjs"
const f = javaFixture()
try {
  const c = f.compile(lessonSource(f, "ProcessLesson"))
  if (c.status !== 0) throw new Error(c.stderr)
  for (let i = 0; i < 2; i++) {
    const r = f.run("ProcessLesson")
    if (r.status !== 0) throw new Error(r.stderr)
    process.stdout.write(r.stdout)
  }
  const heap = f.launch(["-Xmx32m", "-cp", f.out, "ProcessLesson", "heap"])
  if (heap.status !== 0) throw new Error(heap.stderr)
  process.stdout.write(`maxHeapBytes=${heap.stdout.trim()}\n`)
  const oom = f.launch([
    "-Xmx32m",
    "-XX:-HeapDumpOnOutOfMemoryError",
    "-cp",
    f.out,
    "ProcessLesson",
    "oom",
  ])
  if (oom.status === 0 || !oom.stderr.includes("OutOfMemoryError"))
    throw new Error("Expected bounded heap failure")
  process.stdout.write("bounded allocation rejected\n")
} finally {
  f.close()
}
