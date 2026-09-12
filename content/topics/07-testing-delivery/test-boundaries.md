---
id: f12a-test-boundaries
title: 怎样用测试证明修改没有悄悄破坏旧功能？
description: 用行程应用区分单元、HTTP数据库集成和进程测试，编写能检出故障的断言并说明未测范围。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f11b-page-api-feedback]
topics: [testing, regression, integration]
tags: [testing]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-12
---

难度 **L0** · 先修：[页面保存与反馈](../04-frontend/page-api-feedback.md) · 目标：为一个修改选择测试边界，解释断言失败意味着什么，以及绿灯没有证明什么。

核验：本机真实HTTP/SQLite、控制器和服务进程实验通过；真实DOM与浏览器端到端 **NOT_RUN：用户批准集中验收**。前面每篇已有测试，本篇归纳它们怎样一起保护功能。

## 先描述可观察的行为

假设你改了PUT更新语句。只看到服务器启动，没有证明修改正确；只断言状态200，也可能遗漏“返回200但days仍是旧值”。一个有效用例要同时描述输入、操作和结果，例如：先创建3天，修改为5天，读取仍只有一行且days=5。

回归测试（regression test）保存已经成立的行为，帮助发现后续改动破坏了它。测试不是另写一份同样算法，然后比较两份算法是否相同；应从调用者和存储结果观察契约。

## 每一层付出不同成本，回答不同问题

| 边界                | 本应用例子                               | 不能替代什么             |
| ------------------- | ---------------------------------------- | ------------------------ |
| 单元（unit）        | parseTripFields将文字03转为数字3、拒绝31 | 真实HTTP序列化与落库     |
| 集成（integration） | 客户端经HTTP创建/修改并查询SQLite        | 浏览器事件和渲染         |
| 进程生命周期        | 退出服务器，再用新进程打开同一文件       | 断电、磁盘与备份恢复     |
| 浏览器端到端        | 真实点击、输入、反馈、焦点               | 本轮未运行，不能冒称PASS |

控制器中注入api/view对象，可以稳定构造“写成功但刷新失败”；这些替代对象用于控制故障，并不让它自动成为真实浏览器测试。真实HTTP测试则确实启动本机监听、编码JSON、解析响应，并使用临时文件。

[Node测试运行器](https://nodejs.org/api/test.html) 提供test和失败汇总；[assert文档](https://nodejs.org/api/assert.html) 提供断言。这里使用的接口已在Node24.21.0执行，不以当前文档中更晚新增的功能作为先修。

## 失败路径还要检查副作用

[trip-app测试源码](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/trip-app/app.test.mjs) 中，非法更新后会再次读取列表。下面是同样思路的摘录，app与before由测试夹具准备：

```js
const response = await put(app, 1, JSON.stringify({ destination: "坏修改", days: 31 }))
assert.equal(response.status, 422)
await response.text()
assert.deepEqual(await app.api.list(), [before])
```

test fixture（测试夹具）在这里是可控制的临时目录、数据库和服务，结束后关闭并清理。每个测试获得自己的文件，避免顺序不同就相互影响。deepEqual比较内容，equal适合状态码等值；before来自已成功创建的记录。

不要把清理步骤只放在成功分支。finally或测试清理回调让断言失败时也释放本轮服务，防止下次测试因残留资源失败；清理范围只能是自己创建的目录。

## 测试本身也可能理解错环境

F11最初用fetch设置自定义Host头，预期403却得到200。不能立即修改服务器放宽检查；该次调用没有按测试预期发送头，改用node:http明确发送Host后原403断言通过。测试数据如何经过真实接口，是诊断的一部分。

另一个实验在隔离副本把UPDATE实际绑定的days固定为1，原本10组测试中4组失败。这说明已有断言能检出“请求成功但保存错值”，不是靠把预期也改成1取得绿灯。

## 怎样运行并读取失败？

从仓库根目录进入 `examples/trip-app`，执行 `npm ci` 后运行 `npm test`。当前包含基础应用与字段演进的13组测试；`npm run demo`演示F11，`npm run exercise`演示下一篇备注扩展。根知识库还有元数据、链接、产物和发布过滤门禁，它们回答的是教材能否正确发布。

失败时先看第一处实质断言：期望什么、实际什么、由哪个输入触发。退出0表示该次执行的断言通过，不代表未执行的浏览器、备份或生产环境自动通过。不要为了变绿删除失败用例或跳过它所属的门禁。

## 练习：只检查状态码会漏什么？

在自己副本中临时把UPDATE的days绑定固定为1，先运行现有测试，定位读回结果不匹配。再思考：如果只保留200断言，哪里还会发现错误？恢复修改后重跑，不改正式源码的业务契约。

参考：创建/修改结果、控制器经HTTP读回、进程重启以及demo结果都可能发现错误，观察角度互补。测试数不能直接换算为可靠性，更有用的问题是：你最担心的错误能否让某个断言失败？

下一篇：[添加备注字段为什么不止改表单？](add-note-migration.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
