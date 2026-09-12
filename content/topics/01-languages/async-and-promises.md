---
id: f05-async-promises
title: 异步任务为什么不能当同步代码？
description: 观察 async 和 await 的执行顺序，区分 Promise 与结果，并正确处理拒绝。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f04-modules-errors]
topics: [javascript, async, promises]
tags: [javascript]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[模块与错误传递](modules-and-errors.md) · 目标：预测异步输出顺序，并让失败沿着等待关系回到调用入口。

核验环境：Node.js 24.21.0 · macOS arm64。本篇不联网，用确定性的合成行程观察语言行为，不测网络速度。

## 调用返回了，结果可能还没回来

F04 的 createTrip 在调用时完成校验并返回行程。将来从接口读取行程，需要等待响应；调用者先拿到的通常是一个 Promise，而不是行程本身。Promise 表示一次操作最终完成或失败的结果。它可能尚在等待（pending）、成功兑现（fulfilled），或被拒绝（rejected）。拒绝带有原因，不能把它当作“返回了一条空行程”。

这使调用者能够先处理其他工作，再在适当位置使用结果。异步不代表代码自动跑到另一个线程，也不保证耗时操作更快。长时间的普通计算仍可能阻塞当前 JavaScript 执行。本篇只观察等待前后代码怎样衔接。

## 一个可预测的异步函数

`examples/foundations/async-trips.mjs` 的完整内容如下：

```js
export async function loadTrip(id) {
  await Promise.resolve()
  if (id !== "t1") {
    throw new Error("找不到行程")
  }
  return { id: "t1", destination: "山城", days: 3 }
}
```

`async` 放在 function 前面。调用 async 函数总会得到 Promise：return 的行程成为它的成功结果，函数内没有被捕获的异常则成为拒绝原因。[MDN async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) 说明了这种返回约定。

`Promise.resolve()` 这里创建一个已经成功、值为 undefined 的 Promise。我们不需要这个值，只利用 await 观察调度。即使等待的 Promise 已经成功，await 后面的代码也不会紧接着在当前同步调用栈中执行；当前函数暂停，后续部分被安排为微任务（microtask）继续执行。可以先把微任务理解为“当前同步工作结束后要处理的后续工作”，详细事件循环另学。[MDN await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) 给出了这个边界。

因此这不是一次真实远程读取，也没有用定时器假装网络延迟。将来替换为真实接口时，成功与拒绝的等待方式仍适用，但超时、取消、状态码等问题需要另行处理。

## 把入口和结果排在一条时间线上

同目录的 `async-demo.mjs` 完整内容如下：

```js
import { loadTrip } from "./async-trips.mjs"

async function showTrip() {
  console.log("开始读取")
  try {
    const trip = await loadTrip("t1")
    console.log(trip.destination, trip.days)
    await loadTrip("missing")
    console.log("这行不会执行")
  } catch (error) {
    console.log("读取失败：" + error.message)
  }
  console.log("读取结束")
}
const task = showTrip()
console.log("入口继续")
await task
```

从仓库根目录执行：

```sh
node examples/foundations/async-demo.mjs
npm test --prefix examples/foundations
```

实测输出依次为：

```text
开始读取
入口继续
山城 3
读取失败：找不到行程
读取结束
```

调用 showTrip 后，它先打印“开始读取”，直到遇到第一个 await 才把控制权交回调用处。入口拿到代表 showTrip 完成情况的 task，继续打印“入口继续”。之后 loadTrip 的后续工作完成，showTrip 恢复执行，取得行程并打印。

第二次读取 missing 会拒绝。`await loadTrip("missing")` 把拒绝原因变成当前等待位置可捕获的异常，所以进入 catch，跳过同一 try 中剩余的打印。我们知道这个教学函数用 Error 拒绝，才能直接读取 message；面对未知错误值，应先识别类型，下一篇会演示。

最后的 `await task` 位于 `.mjs` 模块顶层，是模块允许的顶层 await；普通非 async 函数体里不能随意使用它。顶层等待也不会把 showTrip 提前开始的工作倒回去，更不会改变此前已经打印的“入口继续”。

## 错把 Promise 当行程，会怎样？

`failures/no-await.mjs` 保留这个反例：

```js
import { loadTrip } from "../async-trips.mjs"
const trip = loadTrip("t1")
console.log(trip.destination)
console.log((await trip).destination)
```

它实测打印 `undefined`，再打印“山城”。第一处 trip 是 Promise，对象没有本例行程的 destination 属性；第二处先等待成功值，再读取属性。第一行没有抛错，所以“程序退出码为零”依然不能证明业务正确。

修复时应在需要行程值的位置 await，并让所在函数或模块允许等待。不要靠给变量改名、加入更多打印或固定等待几秒来代替正确的数据依赖。

## 同步 try 为什么漏掉拒绝？

`failures/unhandled-rejection.mjs` 故意省略等待：

```js
import { loadTrip } from "../async-trips.mjs"
try {
  loadTrip("missing")
} catch (error) {
  console.log("同步 catch：" + error.message)
}
console.log("入口已离开 try")
```

用明确的严格拒绝策略运行：

```sh
node --unhandled-rejections=strict examples/foundations/failures/unhandled-rejection.mjs
```

实测先打印“入口已离开 try”，随后 Node 报 `Error: 找不到行程` 并非零退出，没有打印“同步 catch”。try 中只是取得了 Promise；没有等待它，也没有给它登记拒绝处理。等失败到来时，同步 try 已经结束。

在本例模块中改为 `await loadTrip("missing")`，catch 就能接住拒绝。另一种方式是返回 Promise 给上层等待，但上层仍必须处理失败。这里只展示 await 与 try/catch；Promise 的 then/catch 链式写法可以以后学习，不需要同时背下两套语法。

## 练习：改变等待的位置

复制 async-demo.mjs，把结尾改成先 `await task`，再打印“入口继续”。预测输出，再运行。提示：启动任务的 `showTrip()` 调用仍在前面，改变的是入口何时继续打印。

参考顺序是“开始读取 → 山城 3 → 读取失败：找不到行程 → 读取结束 → 入口继续”。仓库测试与核验还覆盖找不到编号、空字符串、错误类型等拒绝路径；这不代表已经实现了网络错误、并发竞态或取消。

完整源码位于 [foundations 示例目录](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/foundations)。本批未推送时，新文件以本地仓库为准。下一篇：[有 TypeScript 类型，为什么还要校验输入？](types-and-input-validation.md)，继续区分“代码里声明的类型”与“外部实际传来的值”。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
