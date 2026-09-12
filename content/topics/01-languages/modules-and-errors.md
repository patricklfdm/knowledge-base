---
id: f04-modules-errors
title: 如何用模块组织代码并传递错误？
description: 用 import/export 复用行程校验，区分返回值、抛出异常和模块加载失败。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f03-objects-arrays]
topics: [javascript, modules, errors]
tags: [javascript]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[对象和数组](objects-and-arrays.md) · 目标：拆分文件后仍复用同一规则，并解释错误在哪一层处理。

核验环境：Node.js 24.21.0 · macOS arm64。本篇只处理同步调用，异步任务的失败另有后续单元。

## 文件多了，谁负责什么？

行程创建需要天数规则，终端入口需要显示创建结果。如果把所有代码复制到每个入口，改一次限制就容易漏掉一份。模块（module）给代码提供明确的导出和导入边界，让调用者使用某个函数，而不用复制它的实现。

本篇沿用 F02 的规则文件，用三个文件串起一次调用：`modules-demo.mjs` 负责入口显示，`trips.mjs` 负责创建行程，`rules.mjs` 负责天数校验。它们都位于 `examples/foundations/`，没有安装第三方包。

## export 和 import 配对

`rules.mjs` 完整内容是：

```js
export function validateDays(days) {
  if (!Number.isInteger(days)) {
    return "天数必须是整数"
  }
  if (days < 1 || days > 30) {
    return "天数必须在 1 到 30 之间"
  }
  return "通过"
}
```

`export` 把 validateDays 作为命名导出提供给其他模块。没有导出的顶层名字仍可在当前模块使用，但不能仅凭知道名字就从另一个文件导入它。导出函数声明本身也不会创建行程，调用才会执行业务函数体。

新建的 `trips.mjs` 完整内容如下：

```js
import { validateDays } from "./rules.mjs"

export function createTrip(destination, days) {
  const reason = validateDays(days)
  if (reason !== "通过") {
    throw new Error(reason)
  }
  return { destination: destination, days: days }
}
```

`import { validateDays }` 中的名字对应命名导出。这里的花括号是导入语法，不是创建一个对象。`./rules.mjs` 相对于**当前导入文件**的位置解析，不是相对于终端的工作目录。Node 的 ES 模块相对路径需要写明文件扩展名；本例用 `.mjs` 明确采用 ES 模块。[Node 模块文档](https://nodejs.org/api/esm.html#mandatory-file-extensions) 解释了相对导入的路径规则。文档当前主版本高于教学环境，这条基础规则另已在 Node 24.21.0 运行验证。

`return { destination: destination, days: days }` 创建并返回一个对象，冒号左边是属性名，右边是参数值。以后可写同名属性简写，但这里先保留完整对应关系。

## 返回错误文字与抛出错误有什么差别？

F02 的 validateDays 对非法值正常返回一条原因，调用者必须检查它。createTrip 的约定不同：成功就返回行程，校验失败就抛出异常（exception）。`new Error(reason)` 创建带 message 属性的错误对象；`throw` 中断当前执行路径，把错误交给沿调用链能处理它的 catch。[MDN throw 参考](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw) 说明了这种控制流。

所以这不是把错误字符串换个包装而已。`createTrip("海边", 0)` 不会返回一个“不合法行程”，也不会继续执行到后面的 return。用返回结果还是异常是接口设计选择；这个教学函数约定采用异常，调用者就应遵守约定。错误处理方式并非只能二选一，我们已经在两层之间把返回原因转换成了异常。

## 在能决定反馈方式的入口捕获

`modules-demo.mjs` 完整内容如下：

```js
import { createTrip } from "./trips.mjs"

try {
  const trip = createTrip("山城", 3)
  console.log(trip.destination, trip.days)
  createTrip("海边", 0)
  console.log("这行不会执行")
} catch (error) {
  console.log("创建失败：" + error.message)
}
console.log("入口结束")
```

从仓库根目录执行：

```sh
node examples/foundations/modules-demo.mjs
npm test --prefix examples/foundations
```

演示实测输出：

```text
山城 3
创建失败：天数必须在 1 到 30 之间
入口结束
```

`try` 包住我们准备处理错误的操作。第二次创建抛错后，控制流跳到 catch；同一个 try 内剩下的打印被跳过。catch 的 error 参数接收抛出的值；这里已知本函数抛 Error，所以读取 error.message。catch 结束后，程序继续执行整个 try/catch 后面的“入口结束”。[MDN try/catch 参考](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) 描述了这条执行顺序。

不要写一个空 catch 再一律提示成功。本例显式显示失败，也没有伪造一个默认行程。真实接口通常还需要区分输入错误与程序缺陷，而不是把所有异常都当成用户输错。JavaScript 允许抛出其他值，因此对未知来源的错误也不能无条件假设它具有 message 属性。

## 两个故意失败的入口

`failures/uncaught.mjs` 导入正确函数后，直接创建 0 天行程，没有 try/catch。运行 `node examples/foundations/failures/uncaught.mjs`，实测出现 `Error: 天数必须在 1 到 30 之间` 并非零退出，后面的打印没有执行。错误没有在内层消失，而是传播到入口，最终由 Node 报告。

另一个文件 `failures/wrong-export.mjs` 故意把导入名写成不存在的复数：

```js
import { createTrips } from "../trips.mjs"
console.log("入口开始")
createTrips("海边", 3)
```

运行它实测非零退出，提示 `does not provide an export named 'createTrips'`，连“入口开始”都没打印。这发生在模块加载与链接阶段，入口里的业务代码还没执行；在调用周围加 try/catch 不能修复这个静态导入错误。应先对照导出名、相对路径、文件名大小写和扩展名，修正为 createTrip。

## 练习与边界

把演示第二次创建的 0 改成 30，预测哪几行会打印；再改成字符串 `"3"`。先在副本运行，再和测试对照。

参考结果：30 合法，原本标注“这行不会执行”的打印这次会执行，因此提示文字也该随场景调整；catch 不执行，最后仍打印“入口结束”。`"3"` 则被整数校验拒绝，显示“天数必须是整数”，不会执行 try 中剩下的打印。测试覆盖 1、30、0、31、小数、字符串与空值等输入。

这个创建函数只校验天数，没有校验目的地，也没有生成唯一编号或保存数据。后续输入校验单元会补齐外部数据的完整契约。模块只是组织代码，不能凭拆文件就获得数据隔离、安全校验或持久化保证。

源码与测试位于 [foundations 示例目录](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/foundations)。下一篇是[异步与 Promise](async-and-promises.md)，继续观察等待与拒绝；开始前先完成本篇同步执行路径练习。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
