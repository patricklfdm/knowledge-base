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

先完成这十七个连续问题，再继续下面的应用目标。文章的核验状态表示教材已复核，不表示读者已经掌握。

| 顺序 | 正文                                                                        | 完成后的自测                                |
| ---- | --------------------------------------------------------------------------- | ------------------------------------------- |
| F00  | [运行并观察第一个程序](../topics/02-foundations-tools/run-first-program.md) | 定位一处拼写错误，区分文件路径错误          |
| F01  | [值、变量和类型](../topics/01-languages/values-variables-types.md)          | 预测字符串相加与数字相加的差别              |
| F02  | [条件与函数](../topics/01-languages/conditions-and-functions.md)            | 把天数限制改成 2–14，并验证两端边界         |
| F03  | [对象和数组](../topics/01-languages/objects-and-arrays.md)                  | 查找缺失记录，修复嵌套复制的共享修改        |
| F04  | [模块与错误传递](../topics/01-languages/modules-and-errors.md)              | 区分返回、抛出、捕获与导入失败              |
| F05  | [异步与 Promise](../topics/01-languages/async-and-promises.md)              | 移动 await 并预测输出，接住拒绝             |
| F06  | [类型与输入校验](../topics/01-languages/types-and-input-validation.md)      | 区分类型错误与非法运行时输入                |
| F07A | [页面结构与 DOM](../topics/04-frontend/html-css-dom.md)                     | 解释选择器缺失，区分结构、样式与事件        |
| F07B | [表单与输入转换](../topics/04-frontend/form-input-boundary.md)              | 拒绝非法文字，修改天数限制并测试            |
| F08A | [HTTP请求与响应](../topics/03-web/http-request-response.md)                 | 区分路径、查询、片段、消息头与正文          |
| F08B | [fetch状态与JSON错误](../topics/03-web/fetch-status-and-json.md)            | 分清HTTP错误、断连、坏JSON及业务非法        |
| F09A | [创建接口与资源地址](../topics/05-backend/create-trip-api.md)               | 从201和Location读回新行程，解释内存生命周期 |
| F09B | [请求校验与字节边界](../topics/05-backend/request-validation-boundaries.md) | 验证错误无写入，区分字节上限与业务范围      |
| F10A | [SQL表与持久化](../topics/06-data/sql-tables-and-persistence.md)            | 新进程读回文件记录，解释内存库区别          |
| F10B | [参数绑定与约束](../topics/06-data/sql-parameters-and-constraints.md)       | 拒绝坏数据，说明旧表为何不会自动迁移        |
| F11A | [持久化创建与修改接口](../topics/05-backend/persistent-trip-api.md)         | 修改失败保持原记录，重启服务器进程读回      |
| F11B | [页面请求与结果反馈](../topics/04-frontend/page-api-feedback.md)            | 区分保存失败与刷新失败，不盲目重复创建      |

完整例子位于仓库 `examples/foundations/`，可从根目录执行 `npm test --prefix examples/foundations`。F06 的独立类型示例位于 `examples/typed-trips/`，先在该目录 `npm ci` 再 `npm test`。F07 的独立示例位于 `examples/web-forms/`，无需 npm 依赖，运行 `npm test --prefix examples/web-forms`。页面与表单的内容和非浏览器规则已核验，真实交互待集中验收；F08 的 `examples/http-trips/` 可执行真实本机HTTP实验，运行 `npm test --prefix examples/http-trips`；F09 的 `examples/trip-api/` 可运行 `npm test --prefix examples/trip-api`，已实现内存创建/读取与请求校验；F10的 `examples/sql-trips/` 可运行 `npm test --prefix examples/sql-trips`，已验证独立数据库的写入/查询/新进程读取；F11的 `examples/trip-app/` 用 `npm test --prefix examples/trip-app` 验证整合的HTTP/数据库/控制器；真实页面交互仍待集中验收。

## 应用目标与后续文章

| 顺序 | 文章问题                                                                                       | 预期练习                       | 状态                      |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------- |
| 01   | [变量、值和类型分别是什么？](../topics/01-languages/values-variables-types.md)                 | 预测几个表达式的结果并验证     | 样板已核验                |
| 02   | [对象和数组怎样表达一个行程？](../topics/01-languages/objects-and-arrays.md)                   | 创建、查找和修改行程数据       | 已核验                    |
| 03   | [为什么异步任务不能按同步代码理解？](../topics/01-languages/async-and-promises.md)             | 观察执行顺序并处理失败         | 已核验                    |
| 04   | [有 TypeScript 类型为什么还要校验输入？](../topics/01-languages/types-and-input-validation.md) | 拒绝不符合约束的数据           | 已核验                    |
| 05   | [表单怎样把文字输入变成合法行程？](../topics/04-frontend/form-input-boundary.md)               | 完成输入转换和错误反馈         | 内容/规则已核验，交互待验 |
| 06   | [一次HTTP请求里传了什么？](../topics/03-web/http-request-response.md)                          | 查看请求、响应、状态和失败层次 | 内容/HTTP实测已核验       |
| 07   | [怎样让POST真正创建行程？](../topics/05-backend/create-trip-api.md)                            | 创建/读取与非法请求无写入      | 内容/API实测已核验        |
| 08   | [怎样用SQL保存行程？](../topics/06-data/sql-tables-and-persistence.md)                         | 建表、写入、查询与约束验证     | 内容/SQL实测已核验        |
| 09   | 如何证明一个功能没有悄悄变坏？                                                                 | 增加单元测试与集成测试         | 待编写                    |
| 10   | 怎样部署并检查一个完整功能？                                                                   | 完成部署、配置与冒烟检查       | 待编写                    |

## 编写与学习规则

每篇文章在自己的知识领域保存正文，本页只维护顺序与入口。文章写完并验证后，才把题目改成链接。

测试、安全和失败处理随功能一起出现，不留到路线末尾才第一次讨论。

## 本单元的过关条件

能够独立增加一个字段，同时修改界面、输入校验和数据模型；能够解释一个故意设置的错误；能够运行测试并确认数据保存成功。

个人完成情况在独立的私密学习记录中维护，不修改上面的文章编写状态来代表个人掌握情况。

[返回使用说明](../start-here.md) · [查看知识地图](../knowledge-map.md)
