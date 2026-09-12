---
id: f02-conditions-functions
title: 如何用条件与函数表达一个规则？
description: 将行程天数限制写成可复用函数，并验证合法值、边界值和类型错误。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f01-values-variables-types]
topics: [javascript, functions, validation]
tags: [javascript]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[值、变量和类型](values-variables-types.md) · 目标：实现一条规则，并证明边界和错误输入会被拒绝。

核验：2026-09-11 · Node.js 24.21.0 · macOS arm64。

## 先把规则说清楚

行程清单允许填写天数。教学需求是：**只接受数字类型的整数，最少 1 天，最多 30 天**。`3` 合法，`0`、`31`、`2.5` 和文字 `"3"` 都不合法。30 是本练习的业务限制，不是 JavaScript 的限制。

把合法与不合法的输入先列出来，能防止“写完代码以后才猜规则”。接下来用条件（condition）决定走哪条路径，再用函数（function）给这段规则一个可重复调用的名字。

## 条件只负责选路

`if` 后面括号里的表达式决定是否执行花括号中的代码。比如 `days < 1` 问的是“天数是否小于 1”，结果为布尔值。

```js
const days = 0
if (days < 1) {
  console.log("天数太少")
}
```

此处打印“天数太少”；把 days 改为 3，花括号中的打印就不会执行。`<` 和 `>` 是大小比较；`||` 表示逻辑“或”，左右有一个条件成立即可。`!` 表示逻辑“非”，将真假判断反转。下一段利用这些运算把拒绝条件写清楚。

## 把规则封装成函数

可以在自己的 `.mjs` 文件里完整保存下面的代码并运行：

```js
function validateDays(days) {
  if (!Number.isInteger(days)) {
    return "天数必须是整数"
  }
  if (days < 1 || days > 30) {
    return "天数必须在 1 到 30 之间"
  }
  return "通过"
}

console.log(validateDays(3))
console.log(validateDays(0))
console.log(validateDays(30))
console.log(validateDays(31))
console.log(validateDays(2.5))
console.log(validateDays("3"))
```

`function` 声明函数；`validateDays` 是函数名字；声明括号中的 `days` 是参数（parameter），代表每次调用交给它的值。`validateDays(3)` 是一次调用，实际传入的 `3` 叫实参（argument）。声明函数不会自动验证某个行程，调用才会执行函数体。[MDN 函数指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) 介绍了声明、参数与调用的关系。

`Number.isInteger(days)` 是现成的检查函数。本例用它同时拒绝非整数和非 number 输入；它不会把字符串 `"3"` 偷偷转换成数字。前面的 `!` 表示“如果整数检查不通过，就返回错误”。[Number.isInteger 官方参考](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger) 也明确给出了字符串被拒绝的行为。

`return` 将一个值交还调用处，并立刻结束本次函数执行。所以输入 `"3"` 时，第一个 return 就结束了，后面的范围判断不再运行。合法整数进入第二个判断；超出范围则返回另一条原因；两个拒绝条件都不成立，才返回“通过”。

函数返回与终端打印是两件事。函数负责给出结果，外层 `console.log` 负责显示结果。如果只调用 `validateDays(3)` 而不打印，程序仍完成验证，只是终端没有这条可见输出。这种分开能让未来的页面或接口使用结果，而不被终端显示方式绑住。

## 运行与对照

仓库把同一函数放在 `examples/foundations/rules.mjs`，演示调用放在 `rules-demo.mjs`。源码中的 `export` 允许其他文件使用这个函数，演示文件的 `import` 把它引入；独立复制上面的完整代码时不需要这两行跨文件语法，模块组织将在后续专篇展开。

从仓库根目录执行：

```sh
node examples/foundations/rules-demo.mjs
npm test --prefix examples/foundations
```

演示实测输出：

```text
通过
天数必须在 1 到 30 之间
通过
天数必须在 1 到 30 之间
天数必须是整数
天数必须是整数
```

测试还检查 `1`、负数、空值、非数字值等边界。测试（test）在这里指一段把实际结果与预期结果比较的程序；只要不一致就失败。现阶段先会运行并解释结果，不需要理解测试文件用到的所有工具。

## 为什么“有值就通过”不够？

一种看似简洁的错误写法是：

```js
function acceptsDays(days) {
  if (days) {
    return "通过"
  }
  return "拒绝"
}
console.log(acceptsDays(-2))
console.log(acceptsDays("三天"))
```

两行实测都打印“通过”。`if` 在这里并没有执行天数校验，它把输入按语言规则转换为真假判断。负数和非空字符串都是真值（truthy）；即使字符串写的是 `"false"`，也不等于布尔值 false。[MDN 条件与错误处理指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling) 说明了条件中的真假转换。

这个程序退出码为零，但业务行为错误。修复方式是写出类型、整数和范围这几个明确条件，不能仅增加一次 `console.log` 就宣称验证完成。仓库 `failures/truthy.mjs` 保留反例，测试证明它会错误放行。

## 边界与练习

本函数返回中文字符串，便于入门观察。它没有保存行程，也不等于未来接口的完整错误协议。整数检查同样不意味着能精确表示任意巨大整数；这里范围上限只有 30，主动避开了大整数精度问题。未来表单传来字符串时，要另行决定如何转换与报错，不能未经约定自动接受所有文本。

练习：把规则改成“2–14 天，含两端”，先为 `1`、`2`、`14`、`15`、`2.5`、`"2"` 写出预期，再修改自己的练习文件运行。最后解释为什么只修改返回的中文提示还不够。

提示与解释：范围条件要同步改为 `days < 2 || days > 14`，提示也要改；只有数字 2 和 14 通过。2.5 与 `"2"` 仍应在整数检查处被拒绝。提示描述规则，条件执行规则，二者都要随需求更新。仓库原规则仍是 1–30，练习修改请放在自己的副本中。

## 核验与后续

2026-09-11 在 Node 24.21.0/macOS arm64 实测；完整文件位于 [本知识库仓库](https://github.com/patricklfdm/knowledge-base) 的 `examples/foundations/`。测试验证正常、边界、类型错误和真值反例；不声明任何浏览器表单或后端接口已经完成。

现在你能解释每条拒绝路径，并复用同一规则。后续计划学习对象和数组，表示包含多个字段的行程；该篇尚未完成。本批到这里可以先做上面的范围迁移练习。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
