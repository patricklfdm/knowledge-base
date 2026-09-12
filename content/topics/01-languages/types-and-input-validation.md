---
id: f06-types-input-validation
title: 有 TypeScript 类型，为什么还要校验输入？
description: 用实际编译和运行结果区分类型标注、as 断言、unknown 与运行时业务校验。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f05-async-promises]
topics: [typescript, validation, types]
tags: [typescript]
aliases: []
tested_with: [Node.js 24.21.0, TypeScript 5.9.3, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[异步与 Promise](async-and-promises.md)，并能理解对象、条件、函数与模块 · 目标：让类型检查发现代码错误，让运行时检查拒绝不合法输入。

核验环境：Node.js 24.21.0 · TypeScript 5.9.3 · macOS arm64。示例使用合成数据，不调用接口，不保存行程。

## 两个检查发生在不同时间

假设外部给了我们 `{ destination: "海边", days: "3" }`。天数看起来是3，但值实际上是字符串。F01 已证明字符串加1会得到 `"31"`。能否给变量声明一个 TypeScript 类型，就让它变成数字？不能。

TypeScript 在执行之前分析代码中的类型关系，帮助发现可静态识别的错误。运行时校验则是真正在程序执行过程中检查当前值。网络、文件、用户输入等外部数据，不会因为我们在源码里写了类型就自动符合它。

| 写法                    | 在本例中的作用           | 不会替你做什么         |
| ----------------------- | ------------------------ | ---------------------- |
| `days: number`          | 声明变量/属性应为数字    | 不把字符串转换成数字   |
| `input as Trip`         | 告诉检查器按Trip看待输入 | 不检查字段、类型或范围 |
| `input: unknown`        | 要求先获取证据再使用值   | 本身不拒绝任何输入     |
| `typeof`、`if`、`throw` | 运行时检查和拒绝         | 不自动覆盖所有业务规则 |

## 先认识最少的 TypeScript 语法

`.ts` 是本例 TypeScript 源文件的扩展名。下面的类型别名（type alias）给一个对象形状起名：

```ts
export type Trip = {
  destination: string
  days: number
}
```

这里声明两项必需属性，string 和 number 是类型，不是字符串值。`type Trip = ...` 没有创建任何行程对象；`export type` 让其他模块能够使用这个类型。[TypeScript Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) 介绍了对象类型、别名与类型断言。

函数 `parseTrip(input: unknown): Trip` 中，参数后的冒号标注输入类型，括号后的冒号标注返回类型。函数成功时应返回Trip；也可以在失败时throw。unknown 表示“尚不知道是什么”，对它不能未经检查就调用字符串方法或读取行程字段。它与放弃相关检查的 any 不同。[TypeScript unknown 说明](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown) 给出了使用限制。

## 用真实命令区分检查与执行

独立示例位于 `examples/typed-trips/`，有自己的package.json和锁。使用Node24，从仓库根目录执行：

```sh
cd examples/typed-trips
npm ci
npm run check
npm run demo
npm test
```

此处 npm ci 安装固定的TypeScript5.9.3；npm run check调用tsc做静态检查，不生成JavaScript文件；npm run demo用Node24直接执行本例可擦除类型语法。Node移除类型语法后运行，不做类型检查，也不读取tsconfig来替你校验。[Node TypeScript说明](https://nodejs.org/api/typescript.html) 区分了类型擦除和完整工具链；本文命令另外在24.21.0实测。

不要省略check。故意错误的 `failures/type-error.ts` 是：

```ts
const days: number = "3"
console.log(days + 1)
export {}
```

`export {}` 使这个独立反例成为模块，没有导出业务功能。在示例目录执行 `node node_modules/typescript/bin/tsc --project tsconfig.negative.json`，实测以非零退出并报TS2322：不能将string赋给number；报错定位第一行。执行 `node failures/type-error.ts` 却成功打印31。声明仍会被擦除，字符串没有变成数字。

正常check排除这个故意错误文件；测试专门调用负面配置，并断言编译失败。测试通过包含“确实拒绝错误”的证据，不是悄悄跳过反例。

## as 断言也不是验证器

`assertion-demo.ts` 的完整内容如下：

```ts
import type { Trip } from "./trip.ts"

const input: unknown = { destination: "海边", days: "3" }
const trip = input as Trip
console.log(typeof trip.days)
console.log(trip.days + 1)
```

`import type` 只导入类型信息，运行时会移除。as断言让检查器相信我们的判断；它不读取输入来验证判断是否正确。本文件能通过check，却实测打印 `string` 和 `31`。这里为了显示危险，故意给出了不真实的断言；修复方向是检查数据，不是再写一个更强的断言。

## unknown 通过哪些检查成为 Trip？

`trip.ts` 在前面的Trip定义之后，完整实现如下函数：

```ts
export function parseTrip(input: unknown): Trip {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("输入必须是行程对象")
  }
  if (!("destination" in input) || typeof input.destination !== "string") {
    throw new Error("目的地必须是文字")
  }
  if (!("days" in input) || typeof input.days !== "number") {
    throw new Error("天数必须是数字")
  }
  const destination = input.destination.trim()
  if (destination.length === 0) {
    throw new Error("目的地不能为空")
  }
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 30) {
    throw new Error("天数必须是1到30的整数")
  }
  return { destination: destination, days: input.days }
}
```

先检查对象形状。`typeof null` 也是object，数组也属于对象，因此分别排除null和数组。`"days" in input` 问对象中是否存在这个属性；`||` 短路求值意味着左侧已确定要拒绝时，右侧不用执行。随后typeof确认属性值的类型。TypeScript会沿这些条件，把可能的类型范围逐步缩小，这叫缩窄（narrowing），依据的是实际检查，而非as承诺。[TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) 解释了typeof、null与in检查。

接着执行业务规则。trim移除文字首尾空白，空目的地被拒绝；天数还要是1–30整数。单纯number类型不能保证整数、范围或不是NaN。我们明确拒绝字符串 `"3"`，没有偷偷转换它。未来表单输入默认是文字时，需要在明确的边界制定转换规则，而不是把所有数据都强转。

返回时创建新对象，只保留目的地和天数，额外字段被丢弃，原输入不修改。这里处理的是类似JSON解析结果的普通数据对象；它不是任意JavaScript对象的安全沙箱，也没防御恶意getter或Proxy。目的地长度上限、唯一编号、权限等也尚未实现。

## 入口如何显示错误？

demo.ts先把 `{ destination: " 山城 ", days: 3 }` 交给parseTrip，成功打印 `山城 3`；然后传入字符串天数，打印 `拒绝：天数必须是数字`。catch里的核心处理是：

```ts
if (error instanceof Error) {
  console.log("拒绝：" + error.message)
} else {
  throw error
}
```

这段是catch内部摘录，不是独立程序。严格模式下catch参数按unknown处理；instanceof在此检查是否为Error实例，通过后才能读取message。无法识别的值重新抛出，不假装成功。完整入口见 [typed-trips示例目录](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/typed-trips)。

## 练习：把目的地也变成空白

在自己的demo副本中传入 `{ destination: "   ", days: 3 }`，先预测哪个检查会失败，再运行。随后比较 `days: 30`、31、2.5和 `"30"`。不要只改类型别名来改变规则。

参考结果：空白目的地在trim后被拒绝；30通过，31和2.5违反整数/范围规则，字符串 `"30"` 违反数字类型要求。测试还覆盖缺失属性、null、数组、NaN/Infinity、额外字段与输入不变。每个要求都需要对应实际条件，类型和条件各自承担一部分责任。

下一篇：[一段HTML怎样变成可以操作的页面？](../04-frontend/html-css-dom.md)，先补齐HTML/CSS/DOM，再解释表单的文字转换边界。API仍待后续路线实现。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
