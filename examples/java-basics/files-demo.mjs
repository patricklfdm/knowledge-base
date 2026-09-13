import { runLesson } from "./lesson.mjs"
runLesson("FileLesson", [])
if (!process.exitCode) runLesson("ResourceLesson", [])
