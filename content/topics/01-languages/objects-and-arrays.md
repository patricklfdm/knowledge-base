---
id: f03-objects-arrays
title: 对象和数组怎样表达一个行程？
description: 创建和查找多条行程，区分修改同一对象与复制新对象，并处理找不到记录的情况。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f02-conditions-functions]
topics: [javascript, objects, arrays]
tags: [javascript]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[条件与函数](conditions-and-functions.md) · 目标：创建、查找、修改行程，并预测哪些变量会看到同一次修改。

核验环境：Node.js 24.21.0 · macOS arm64。全部使用合成行程，数据只存在于这次程序运行的内存中。

## 一条记录和一组记录

只有天数还无法描述行程。目的地、天数、编号属于同一条记录，适合放进对象（object）。对象把属性名与值组织在一起；例如 `{ id: "t1", destination: "山城", days: 3 }` 中，`days` 是属性名，3 是值。`trip.days` 用点号读取该属性，`trip.days = 4` 修改它。[MDN 对象指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) 介绍了这种属性访问方式。

多条行程则放进数组（array）：用方括号包住按顺序排列的元素。本例每个元素都是对象。数组的第一个位置是 0，所以 `trips[1]` 是第二条；`trips.length` 是元素数量。编号 `"t2"` 是我们给记录起的标识，不是数组下标。插入或删除元素可能改变位置，按编号找记录能避免把“第二条”误当成永远同一个行程。本篇约定编号唯一，语言本身不会强制这个约定。

## 创建、查找，再修改

从仓库根目录运行完整示例：

```sh
node examples/foundations/trips-demo.mjs
```

对应文件的完整内容如下，也可另存为自己的 `.mjs` 文件运行：

```js
const trips = [
  { id: "t1", destination: "山城", days: 3 },
  { id: "t2", destination: "海边", days: 2 },
]
trips.push({ id: "t3", destination: "湖畔", days: 1 })
function isSecondTrip(trip) {
  return trip.id === "t2"
}
const found = trips.find(isSecondTrip)
if (found !== undefined) {
  found.days = 4
}
console.log(trips.length)
console.log(trips[1].days)
const alias = trips[0]
alias.days = 5
console.log(trips[0].days)
const edited = { ...trips[0], days: 7 }
console.log(trips[0].days, edited.days)
```

实测输出：

```text
3
4
5
5 7
```

`push` 把新元素加到原数组尾部，所以数量成为 3。`find` 接收一个函数，由它逐项判断是否匹配。这里传的是函数本身 `isSecondTrip`，没有在后面写调用括号；数组会把正在检查的元素作为参数交给它。这样被另一段代码调用的函数称为回调（callback）。不需要先学箭头函数，就能理解回调的作用。

`isSecondTrip` 对 t1 返回 false，对 t2 返回 true。`find` 返回第一个匹配元素；找不到则返回 `undefined`。它不会生成一份行程副本。[MDN find 参考](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find) 给出了匹配与缺失的规则。

`!==` 是严格不相等。只有找到记录，才进入 if 修改 `found.days`。因此第二行打印 4：通过 found 修改的，正是数组里原来的那条记录。

## const 为什么没挡住修改？

F01 说 const 不能重新赋值，这仍然成立。`const alias = trips[0]` 让 alias 和数组第一个元素引用同一个对象。`alias.days = 5` 修改对象的属性，没有把 alias 重新绑定到另一个对象；`trips.push(...)` 也没有重新绑定 trips。const 限制变量绑定，不会自动冻结它指向的数据。

可以把引用理解为访问同一个对象的路径，但不要把它理解成语言允许随意操作的内存地址。判断两处是否指向同一个对象，可以用 `===`；两个字段相同、分别创建的对象，也不因此成为同一个对象。

如果想保留旧值，`{ ...trips[0], days: 7 }` 会创建新对象，先复制原对象可枚举的自身属性，再用后面的 days 覆盖复制来的 days。本例是普通数据对象，因此新对象的天数为 7，原对象仍为 5。这个操作叫浅复制（shallow copy）：只复制一层属性值。[MDN 展开语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) 说明了它的浅复制边界。

## 两种失败要分开看

第一种是找不到记录却继续访问：

```js
const trips = []
function isMissing(trip) {
  return trip.id === "missing"
}
const found = trips.find(isMissing)
console.log(found.days)
```

这是 `failures/missing-trip.mjs`。实测非零退出，错误为 `TypeError: Cannot read properties of undefined (reading 'days')`。问题不是数组“坏了”，而是 find 正常返回缺失结果，调用者没有处理。前面的 if 可以避免访问错误；真正的产品还应在缺失分支给出反馈，而不是静默不做事。

第二种不会抛错，却违反“副本修改不影响原件”的期待：

```js
const trip = { days: 3, stop: { name: "山脚" } }
const copy = { ...trip }
copy.stop.name = "山顶"
console.log(trip.stop.name)
```

`failures/shallow-copy.mjs` 实测打印“山顶”。外层对象不同，stop 属性仍然引用同一个嵌套对象。复制数组 `[...trips]` 也有类似边界：得到新数组，里面的对象仍共享。不要把展开语法当成任意数据的深复制工具。

## 练习：给行程增加一个停靠点

给自己的行程增加 `stop: { name: "山脚" }`，创建一个停靠点改为“山顶”的新版行程。要求旧行程仍打印“山脚”，新版打印“山顶”。先预测只复制外层的结果，再运行，最后修复。

提示：需要沿着修改路径复制第二层。参考写法是 `const edited = { ...trip, stop: { ...trip.stop, name: "山顶" } }`。它适合本例已知结构，不能直接推广为循环引用、日期或所有复杂对象的通用复制。测试同时断言两个 stop 不是同一对象，以及新旧名字各自正确。

再试着放入两个 id 都为 t1 的记录，预测 find 取哪一个。答案是首个匹配项；如果业务不允许重复，应在创建时校验唯一性，后面的 API/数据库单元会继续展开。

## 核验与下一步

运行 `npm test --prefix examples/foundations`，能验证演示输出、空数组、缺失编号、编号类型不符、重复编号取首项，以及嵌套复制的反例和修复。源码位于 [foundations 示例目录](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/foundations)。这里没有保存数据；关闭程序后，下一次执行会重新创建这组示例。

下一篇：[如何用模块组织代码并传递错误？](modules-and-errors.md)。我们会把数据创建和入口显示分开，让不同调用者复用同一条天数规则。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
