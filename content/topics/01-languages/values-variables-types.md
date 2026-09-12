---
id: f01-values-variables-types
title: 值、变量和类型分别是什么？
description: 区分值与变量，预测赋值、字符串相加和严格相等的结果。
note_type: concept
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f00-run-first-program]
topics: [javascript, values, types]
tags: [javascript]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[运行第一个程序](../02-foundations-tools/run-first-program.md) · 目标：预测值和类型，解释一次不符合直觉的相加。

核验：2026-09-11 · Node.js 24.21.0 · macOS arm64。

## 行程改了，程序怎样表示变化？

便笺上写着“山城，2 天”，后来改为 3 天。程序需要处理两种不同的信息：目的地的文字，以及可以计算的天数。值（value）是程序实际处理的数据；变量（variable）是代码中用来访问值的名字。类型（type）决定一种值可以怎样参与运算。

先看两行：

```js
const destination = "山城"
let days = 2
```

`destination` 与 `days` 是名字；`"山城"` 与 `2` 是值。`const` 和 `let` 用来声明变量，也就是建立名字。等号在这里表示赋值（assignment），把右侧计算出的值交给左侧的名字；它不是数学中的“两边永远相等”。[MDN 的语法与类型指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types) 介绍了声明与这些基础值。

## 先算右边，再更新名字

```js
let days = 2
days = days + 1
console.log(days)
```

第二行先读取原来的 `days`，算出 `2 + 1` 得到 `3`，然后把 `days` 更新为 `3`。所以最后输出 `3`。这里没有永远解不开的方程，只有一次有先后顺序的操作。

`let` 允许后续重新赋值，`const` 不允许。优先选择不需要重新赋值的 `const`，确实有变化再使用 `let`，能让阅读者看出哪里会更新。本篇只处理基础值；以后遇到对象时，要区分“重新给变量赋值”和“修改对象内部内容”，不能把 const 理解成所有内容都永久冻结。

## 文字、数字和真假值

本篇主要使用三种类型：字符串（string）表示文字，数字（number）参与数值运算，布尔值（boolean）表示 `true` 或 `false`。`typeof` 可以观察一个值的类型名称。

在自己的文件中保存以下代码，或运行仓库 `examples/foundations/values.mjs`：

```js
const destination = "山城"
let days = 2
days = days + 1
console.log(destination, days)
console.log(typeof days)
console.log("2" + 1)
console.log(2 + 1)
console.log("2" === 2)
console.log(0.1 + 0.2 === 0.3)
```

运行命令从仓库根目录开始：

```sh
node examples/foundations/values.mjs
```

本次实际输出：

```text
山城 3
number
21
3
false
false
```

逐项解释：第一行打印两个值，中间由 `console.log` 分隔；第二行告诉我们 `days` 当前是数字。第三行的 `"2"` 是文字，`+` 在这里做字符串拼接，得到文字 `"21"`，而第四行的两个数字相加得到数字 `3`。

`===` 是严格相等（strict equality）运算符，用于判断而不是赋值。`"2"` 和 `2` 的类型不同，因此第五行是 `false`。这也是为什么不能只看终端里显示的字符来推断类型：打印字符串 `"3"` 和数字 `3` 都可能只看到 `3`。在有疑问的位置同时打印 `typeof`，能看到关键差别。[MDN 严格相等说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality) 给出了比较规则。

最后一行提醒我们，常见十进制小数并非都能由二进制浮点数精确表示。此处相加结果不是恰好 `0.3`，严格比较得到 `false`。这不是把 `===` 改成宽松相等就能修复的金额计算问题。天数在下一篇限定为小整数；金额、测量误差和舍入策略需要另行设计，不应从这个入门例子推导“所有小数都不可靠”。[MDN Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) 说明了 JavaScript 数字的表示范围和精度。

## 一个报错与一个不报错的失败

下面会报错：

```js
const days = 2
days = 3
```

实测为 `TypeError: Assignment to constant variable.`，因为代码试图重新赋值一个 const 声明。需求确实允许变化时，把声明改为 `let`；如果天数本不应变化，应删除不合理的赋值，而不是机械替换所有 const。

另一种失败更容易漏掉：用 `"2" + 1` 计算下一天。程序正常退出，但业务期望是数字 `3`，实际得到文字 `"21"`。所以“没有红色错误”不能证明计算符合需求。要先明确输入类型，再检查实际结果。仓库测试既检查异常，也检查这些正常退出却可能被误解的输出。

## 迁移练习

把初始天数改为文字 `"4"`，预测执行 `days = days + 1` 后的值和类型。然后把需求改为“记录目的地是否已经确认”，选择一种类型，并打印它的类型。

提示与解释：第一题得到字符串 `"41"`，类型是 `string`；不是数字 `5`。第二题可以写 `const confirmed = false`，类型为 `boolean`。不要用字符串 `"false"` 代替布尔值 false，下一篇的条件判断会把两者区别开。

## 核验与下一步

2026-09-11 在 Node 24.21.0/macOS arm64 实测；完整文件见 [本知识库仓库](https://github.com/patricklfdm/knowledge-base) 的 `examples/foundations/values.mjs` 与 `failures/reassign.mjs`。`npm test --prefix examples/foundations` 验证输出、类型比较边界和 const 重新赋值失败。本篇不覆盖对象复制、全部类型和完整数值计算策略。

下一篇 [条件与函数](conditions-and-functions.md) 把“必须是 1–30 的整数天数”写成可重复使用的规则。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
