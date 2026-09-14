---
id: e00-react-state-ownership
title: React组件怎样共享状态而不互相覆盖？
description: 用便笺筛选器解释props、状态快照、纯reducer与派生结果。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [f11b-page-api-feedback]
topics: [react, state]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, React 19.3.0, esbuild 0.27.2, macOS arm64]
verified_on: 2026-09-13
---

先修：[页面与API反馈](page-api-feedback.md)。读完能把“输入、列表、提示”分给组件，解释为什么原地修改数组会破坏更新与缓存。

## 从一个筛选框开始

旧页面直接找DOM并赋值。组件方法先描述“给定当前数据，页面应是什么样”：App保存数据，Board接收props（父组件传入的参数），再生成输入、列表与提示。props不是子组件可以随意修改的共享仓库；子组件通过回调报告意图，由父组件改变状态。选择共同使用者最近的父组件保存共享状态，可以避免两个组件分别保存一份查询词。[React组件拆分与状态归属](https://react.dev/learn/thinking-in-react) 给出了这种设计过程。

维护代码位于[reliable-app](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/reliable-app)。它是独立React实验，不会把Quartz改为React；前端读取两条本地合成便笺，不是已经接通后端认证的产品。

## 状态应该保存哪些东西？

`state.mjs`保存query、rows、phase、error。query是用户输入；rows是读取结果；phase用于区分idle/loading/success/error。显示条数由筛选结果的length计算，不再另存count。如果同时保存rows和count，每次刷新都要维护一致性，漏掉一次就会出现“0条但列表有内容”。[不必要的Effect](https://react.dev/learn/you-might-not-need-an-effect) 也说明了为什么渲染所需的派生值通常可以直接计算。

App使用`useReducer(reducer, initialState)`取得当前快照和dispatch。每次输入发出`{type: "query", value}`，reducer返回下一个对象。下面是维护文件的完整query分支，并非独立应用：

```js
case "query": return { ...state, query: action.value }
```

旧对象不变，其他字段保留。dispatch安排下一次渲染；当前事件处理函数手中的state仍是这次渲染的快照。不要在dispatch下一行立刻读state并当成更新后的值。[useReducer规则](https://react.dev/reference/react/useReducer) 对纯函数、只读状态与更新时机作了明确说明。

## 输入与列表怎样连接？

Board的input接收`value: state.query`和onChange回调。这是受控输入：React状态决定文字，事件让状态跟上输入。只有value而没有正确的更新回调，会令输入无法按预期编辑。列表用稳定的row.id作为key；它帮助React识别兄弟项，不是数据库授权凭据，也不会作为普通props自动传给子组件。[列表与key](https://react.dev/learn/rendering-lists) 解释了插入和重排时的身份问题。

示例用`createElement`避免Node测试额外转换JSX；`h("li", {key: row.id}, row.title)`与相应JSX表达同一元素结构。它不是直接操作真实DOM。实际DOM创建留给react-dom/client的createRoot入口。

## 运行与反例

使用仓库固定Node24.21.0，在根目录运行：

```sh
npm ci --prefix examples/reliable-app
npm test --prefix examples/reliable-app
npm run frontend --prefix examples/reliable-app
npm run build --prefix examples/reliable-app
```

frontend入口输出一次确定性筛选计数和静态HTML；build在自建临时目录生成bundle和HTML，再清理。这些命令不启动浏览器。测试冻结旧state，验证新对象的query改变而旧对象仍为空，并拒绝未知action；若把分支改成`state.query = action.value; return state`，冻结检查会失败。别把“对象内容看起来变了”当成React已安排正确更新。

适用：一个局部界面存在相互关联的状态转换。几个简单独立字段可用useState，不必为每个输入建立全局状态库。本例没有路由、跨页缓存或协作同步，不能据此宣称解决了所有状态管理问题。

## 迁移练习

添加“只显示标题超过两个字”的开关。先决定它是否必须保存，再说明列表和条数如何计算。提示：开关是用户选择，属于状态；筛选后数组及length属于派生结果。修改一条便笺时创建新数组和新行对象，补一个“旧数组内容不变”的断言。

来源与非浏览器代码复核已完成；真实输入事件、重排后的焦点和移动端阅读 **NOT_RUN**。下一篇：[旧请求晚到时怎样处理](react-request-lifecycle.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
