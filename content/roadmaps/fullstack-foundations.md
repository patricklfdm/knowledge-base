---
id: roadmap-fullstack-foundations
title: 全栈基础路线
description: 样板单元：从程序基础到可保存数据的行程清单。
note_type: navigation
status: seed
draft: false
publish: true
tags:
  - knowledge-base
---

## 本单元的成果

建立一个可以创建、查询和修改行程条目的小应用。用户操作页面，页面调用接口，接口校验输入并保存数据；错误输入得到可理解的反馈。

这是独立教学项目，不依赖旧版 Wayvia 或 Wayvia 2.0 的完整实现。

## 已有样板单元

先完成这九个连续问题，再继续下面的应用目标。文章的核验状态表示教材已复核，不表示读者已经掌握。

| 顺序 | 正文                                                                        | 完成后的自测                         |
| ---- | --------------------------------------------------------------------------- | ------------------------------------ |
| F00  | [运行并观察第一个程序](../topics/02-foundations-tools/run-first-program.md) | 定位一处拼写错误，区分文件路径错误   |
| F01  | [值、变量和类型](../topics/01-languages/values-variables-types.md)          | 预测字符串相加与数字相加的差别       |
| F02  | [条件与函数](../topics/01-languages/conditions-and-functions.md)            | 把天数限制改成 2–14，并验证两端边界  |
| F03  | [对象和数组](../topics/01-languages/objects-and-arrays.md)                  | 查找缺失记录，修复嵌套复制的共享修改 |
| F04  | [模块与错误传递](../topics/01-languages/modules-and-errors.md)              | 区分返回、抛出、捕获与导入失败       |
| F05  | [异步与 Promise](../topics/01-languages/async-and-promises.md)              | 移动 await 并预测输出，接住拒绝      |
| F06  | [类型与输入校验](../topics/01-languages/types-and-input-validation.md)      | 区分类型错误与非法运行时输入         |
| F07A | [页面结构与 DOM](../topics/04-frontend/html-css-dom.md)                     | 解释选择器缺失，区分结构、样式与事件 |
| F07B | [表单与输入转换](../topics/04-frontend/form-input-boundary.md)              | 拒绝非法文字，修改天数限制并测试     |

完整例子位于仓库 `examples/foundations/`，可从根目录执行 `npm test --prefix examples/foundations`。F06 的独立类型示例位于 `examples/typed-trips/`，先在该目录 `npm ci` 再 `npm test`。F07 的独立示例位于 `examples/web-forms/`，无需 npm 依赖，运行 `npm test --prefix examples/web-forms`。页面与表单的内容和非浏览器规则已核验，真实交互待集中验收；当前没有接口或持久化。

## 应用目标与后续文章

| 顺序 | 文章问题                                                                                       | 预期练习                   | 状态                      |
| ---- | ---------------------------------------------------------------------------------------------- | -------------------------- | ------------------------- |
| 01   | [变量、值和类型分别是什么？](../topics/01-languages/values-variables-types.md)                 | 预测几个表达式的结果并验证 | 样板已核验                |
| 02   | [对象和数组怎样表达一个行程？](../topics/01-languages/objects-and-arrays.md)                   | 创建、查找和修改行程数据   | 已核验                    |
| 03   | [为什么异步任务不能按同步代码理解？](../topics/01-languages/async-and-promises.md)             | 观察执行顺序并处理失败     | 已核验                    |
| 04   | [有 TypeScript 类型为什么还要校验输入？](../topics/01-languages/types-and-input-validation.md) | 拒绝不符合约束的数据       | 已核验                    |
| 05   | [表单怎样把文字输入变成合法行程？](../topics/04-frontend/form-input-boundary.md)               | 完成输入转换和错误反馈     | 内容/规则已核验，交互待验 |
| 06   | 一次 HTTP 请求经历了什么？                                                                     | 查看请求、响应和状态码     | 待编写                    |
| 07   | 如何设计并校验一个创建接口？                                                                   | 实现成功路径与失败路径     | 待编写                    |
| 08   | 怎样用 SQL 保存和查询行程？                                                                    | 建表、写入、查询与约束验证 | 待编写                    |
| 09   | 如何证明一个功能没有悄悄变坏？                                                                 | 增加单元测试与集成测试     | 待编写                    |
| 10   | 怎样部署并检查一个完整功能？                                                                   | 完成部署、配置与冒烟检查   | 待编写                    |

## 编写与学习规则

每篇文章在自己的知识领域保存正文，本页只维护顺序与入口。文章写完并验证后，才把题目改成链接。

测试、安全和失败处理随功能一起出现，不留到路线末尾才第一次讨论。

## 本单元的过关条件

能够独立增加一个字段，同时修改界面、输入校验和数据模型；能够解释一个故意设置的错误；能够运行测试并确认数据保存成功。

个人完成情况在独立的私密学习记录中维护，不修改上面的文章编写状态来代表个人掌握情况。

[返回使用说明](../start-here.md) · [查看知识地图](../knowledge-map.md)
