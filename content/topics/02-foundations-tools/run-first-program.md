---
id: f00-run-first-program
title: 如何运行并观察第一个程序？
description: 用 Node.js 运行一个小程序，区分输出、运行错误和文件路径错误。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: []
topics: [command-line, javascript]
tags: [javascript, nodejs]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · **无需编程先修** · 目标：运行文件、预测三行输出，并找到一处错误所在行。

核验：2026-09-11 · Node.js 24.21.0 · macOS arm64。

## 从一张行程便笺开始

假设你想记录一次短途行程。现在先不做网页，也不保存数据，只让电脑显示一段话和一个计算结果。这一步的成果很具体：你知道代码放在哪里、由谁执行，以及去哪里观察结果。

程序（program）是一组给运行环境执行的指令。JavaScript 是本路线使用的语言；Node.js 是在浏览器之外运行 JavaScript 的环境。编辑器负责修改文件，终端负责发出运行命令，Node 负责执行代码。这三个角色先分清，排错时就不会把“文件没保存”误认为语言出了问题。

## 准备一个可观察的环境

如果电脑尚未安装 Node，从 [Node.js 官方下载页](https://nodejs.org/en/download) 选择适合操作系统的 24 系列。本文实际测试的是 **24.21.0**；安装方法随操作系统不同，安装界面没有纳入本文测试。已有其他项目时，不要为了本练习覆盖它们的全局环境，可以使用已安装的 24 系列版本。

打开终端，输入下面的命令，再按回车。不要把这行写进 JavaScript 文件：

```sh
node --version
```

本次输出为 `v24.21.0`。如果出现 `command not found` 或“不是内部或外部命令”，说明终端还找不到 Node；先检查安装并重新打开终端，暂时不用调试下面的代码。

准备一个自己的练习目录，用纯文本编辑器新建 `hello.mjs`，确认文件没有被保存成 `hello.mjs.txt`。`.mjs` 是这里采用的 JavaScript 模块文件后缀，Node 可以直接执行。此时还不需要理解跨文件模块组合。

## 保存，然后运行

把以下三行完整保存到 `hello.mjs`：

```js
console.log("开始记录行程")
console.log(2 + 3)
console.log("程序结束")
```

`console.log(...)` 把括号内的值打印到终端。引号内是文字，`2 + 3` 则是需要计算的表达式（expression）。普通半角括号和引号属于代码语法，输入法的全角符号不能直接替代它们。

下面以本次实测的 macOS 终端为例：输入 `pwd` 查看当前目录，输入 `ls` 列出其中的文件。若文件保存在别处，输入 `cd `（末尾有空格），再将保存 `hello.mjs` 的文件夹拖入终端，按回车进入。`cd` 表示切换目录，拖入文件夹可避免手工拼错带空格的路径。再次执行 `ls`，确认列表中出现 `hello.mjs`，然后运行：

```sh
node hello.mjs
```

命令中 `node` 指定执行环境，`hello.mjs` 指定入口文件。相对路径从终端的当前目录开始找，而不是从编辑器当前打开的标签页开始找。[Node 官方运行说明](https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line) 也采用这一调用方式。

运行前先预测结果。本次实际输出是：

```text
开始记录行程
5
程序结束
```

这段没有异步操作的直线程序按顺序执行；到文件末尾就结束。修改文件后要保存并重新运行，终端里的旧结果不会自动变化。`console.log` 只显示内容，不会自动创建行程数据库。

完整受测文件位于 [本知识库仓库](https://github.com/patricklfdm/knowledge-base) 的 `examples/foundations/hello.mjs`。已经取得仓库的人可以从根目录执行 `node examples/foundations/hello.mjs`；与上面的独立文件运行结果相同。

## 故意制造一次运行错误

在自己的练习副本中，把第二行的 `log` 改成 `loog`：

```js
console.log("开始记录行程")
console.loog(2 + 3)
console.log("程序结束")
```

再次运行，本次先输出第一行文字，然后出现：

```text
TypeError: console.loog is not a function
```

错误信息里还包含文件路径与第二行的位置。错误的意思是：代码试图调用 `console` 上名为 `loog` 的功能，但它不是一个可调用的函数。第三行没有执行，因为这个运行错误没有被处理。修复拼写后重新运行，三行输出恢复。

错误栈（stack trace）后面的内部调用路径因环境而不同。初学时先找**自己的文件名、行号和第一条错误原因**，不要试图逐个修改 Node 内部文件。仓库的 `failures/typo.mjs` 故意保留这个错误；测试确认它非零退出，并且没有打印“程序结束”。

另一个常见问题是从错误目录运行，或把文件名写错。运行 `node intentionally-absent.mjs` 时，Node 在进入你的代码前就报告找不到模块，包含 `MODULE_NOT_FOUND`。这与第二行拼写错误不同：先查当前目录、文件名和后缀，而不是修改 `console.log`。

## 改变一个条件再试

练习：把程序改为输出“预计天数”，再显示 `2 * 3`。运行前写下预期结果；接着把表达式改为 `"2 * 3"`，比较两次输出。最后让第二行拼写错误再次发生，预测第三行是否出现。

提示与解释：`*` 表示乘法，所以前一种计算得到 `6`；加上引号后它是一段文字，输出 `2 * 3`。第二行未处理的运行错误会中断当前程序，第三行不会出现。能解释这个差别，比只看到一个成功画面更有用。

## 核验与下一步

2026-09-11 在 Node 24.21.0、macOS arm64 实际运行；正常输出、拼写失败、找不到文件三条路径由 `examples/foundations/foundations.test.mjs` 验证。运行 `npm test --prefix examples/foundations` 可复查。本教程没有测试 Windows 安装界面，也没有浏览器代码、联网或持久化行为。

现在你能运行和观察文件了。下一篇 [值、变量和类型](../01-languages/values-variables-types.md) 将解释程序处理的值，以及引号为什么改变结果。

[返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
