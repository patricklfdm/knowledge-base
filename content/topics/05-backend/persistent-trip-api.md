---
id: f11a-persistent-trip-api
title: 怎样把创建和修改接口接到SQLite？
description: 把F09校验与F10参数化SQL接起来，验证修改失败无副作用，以及服务器进程重启后记录仍在。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f10b-sql-parameters-and-constraints]
topics: [api, sqlite, integration]
tags: [backend]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64, Codex In-app Browser]
verified_on: 2026-09-12
---

难度 **L0** · 先修：[参数绑定与约束](../06-data/sql-parameters-and-constraints.md) · 目标：接通创建、读取、修改与文件保存，用实际HTTP和新进程证明结果。

核验：真实本机HTTP、SQLite、服务器进程重启通过。2026-09-13补充Codex内置浏览器集中验收：创建、编辑、非法输入、取消、忙碌恢复与新进程读回通过，见[交互验收报告](https://github.com/patricklfdm/knowledge-base/blob/v5/reports/H4-ui-acceptance.md)。这是F11基础应用的实测，其他浏览器、真实屏幕阅读器和生产环境未测；此次局部补验不刷新整篇verified_on。

## 把两个已经验证的边界连起来

F09能检查请求，却只写内存；F10能保存文件，却没有完整API输入校验。整合不是把数据库对象直接暴露给外部，而是保留顺序：读JSON → 校验并规范化 → 参数化SQL → 生成响应。

[独立trip-app源码](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-app) 不依赖旧包目录。它复制F09输入模块作为独立教学快照，存储层增加UPDATE，页面与API由同一本机服务提供。旧例子保持原样，方便对照每一步变化。

从仓库根目录运行：

```sh
cd examples/trip-app
npm ci
npm test
npm run demo
```

无需数据库服务器或新增npm依赖。demo创建自己的临时文件，自动启停两个Node服务器进程，最后清理。实测输出：

```text
创建 {"id":1,"destination":"山城","days":3}
修改 {"id":1,"destination":"海湾","days":5}
非法修改 422
重启后 [{"id":1,"destination":"海湾","days":5}]
```

这里“重启”真的退出旧进程再启动新进程，不只重新声明数组。文件相同，端口可能变化，demo使用新地址读取。

## 先确定这个应用的接口契约

| 请求             | 结果                                |
| ---------------- | ----------------------------------- |
| POST /api/trips  | 创建后201，Location指向新记录       |
| GET /api/trips   | 返回列表                            |
| GET /api/trips/1 | 返回一条，不存在404                 |
| PUT /api/trips/1 | 替换已有行程的两个业务字段，成功200 |

本应用使用整数id及/api前缀，F09单独例子的t1编号不变；不要拿旧URL直接请求新应用。PUT要求destination和days都提供，不是只改任意一个字段的PATCH。缺失记录返回404，本例没有用PUT自动创建资源。[MDN PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PUT) 说明了替换语义；具体缺失处理由这里的契约限定。

重复相同PUT，行程最终仍是同样内容；重复POST则会创建多行。不要把“修改可重复得到同样业务状态”理解为网络请求完全没有成本，或默认所有操作都可无限重试。

## 校验为什么必须在UPDATE之前？

服务端创建与修改共享核心步骤，以下是处理函数中的摘录：

```js
const fields = parseTrip(await readJson(request))
const trip = collection ? store.create(fields) : store.update(id, fields)
```

collection表示集合路径，id来自已检查的路径编号。readJson先限制媒体、编码、实际字节和JSON格式；parseTrip保证trim后的目的地和数字天数满足业务契约。任一步抛错，SQL分支就不会执行。

这一顺序保护修改尤其重要：31天返回422后，还要GET确认旧5天仍在。测试也覆盖坏JSON、非法UTF-8、错误媒体、超1024字节和缺失字段；没有把“出现错误提示”当成数据未改变的充分证据。

## UPDATE怎样只修改指定的那一行？

store.mjs准备固定语句：

```sql
UPDATE trips SET destination=?, days=? WHERE id=?
```

SET指定要替换的列，WHERE限定目标行；三个绑定参数按目的地、天数、id顺序传入。遗漏WHERE可能改动所有行，这不是输入校验能弥补的问题。[SQLite UPDATE](https://www.sqlite.org/lang_update.html) 给出了更新与筛选的语义。

run返回结果中的changes是受影响行数，本例零行就返回undefined，由路由转换404；成功则按id再读回响应。SQLite约束仍在，测试用直接SQL写31天证明它会拒绝；但数据库仍不代替F09的文字长度与输入类型规则。

小例子中同步UPDATE与随后读取在同一JS处理步骤中执行，没有await插入其间。它没有实现多用户编辑冲突控制：两人先后保存可能后者覆盖前者；版本号或条件更新留后续工程课程。

## 数据库失败不能全部归罪于用户

未知数据库异常统一返回500与固定公开错误，内部表名/堆栈不发给调用者。本轮在临时库中移除表，实际请求得到500/INTERNAL_ERROR，验证了这一兜底；这与故意提交31天的422不同。

只向客户端隐藏细节不等于完成服务日志、监控或恢复。当前没有生产日志系统、备份演练或磁盘故障保证。SQLite文件只证明正常提交和进程重开；不要把演示清理临时目录的操作用于已有数据库。

## 练习：错误修改后再重启

在自己的demo副本把合法修改改为7天，仍发送31天的非法修改，再重启读取。先预测返回值：非法修改应422，新进程仍读到7天。若重启后变成31，说明只验证了状态码，没有真正保护存储边界。

下一篇：[页面怎样提交并展示保存结果？](../04-frontend/page-api-feedback.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
