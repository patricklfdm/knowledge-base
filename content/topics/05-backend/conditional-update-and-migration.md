---
id: e04-conditional-update-migration
title: 两个窗口编辑同一条数据，怎样拒绝静默覆盖？
description: 把HTTP条件更新、SQL版本比较与可回滚迁移连成一个协议。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e03-session-resource-authorization, f12b-add-note-migration]
topics: [concurrency, migration]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[资源授权](session-and-resource-authorization.md)、[字段迁移](../07-testing-delivery/add-note-migration.md)。目标：区分行内容版本与数据库结构版本，让旧窗口明确收到冲突。

## 先读后写为何仍会丢失修改？

A与B都读到title=海边。A保存“海边两日”，B随后保存旧表单中的“海边散步”。如果SQL只按id更新，B会覆盖A，两个请求都返回成功。事务能让每次写入完整，却不会自动识别用户正在提交旧版本。

本例给每行增加revision。GET返回内容及ETag，例如`"1"`；PUT要求If-Match携带读到的标签。服务器把比较和更新放进同一条SQL：

```sql
UPDATE notes
SET title = ?, revision = revision + 1
WHERE id = ? AND owner = ? AND revision = ?
```

受影响行数为1才成功。旧revision不匹配时没有行被改动，而不是先SELECT比较后再无条件UPDATE。后者若中间有并发写入仍会留空隙。授权条件保留在更新语句中。

## HTTP层如何告诉调用方？

[If-Match规范](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match) 定义条件请求和强比较。本例是教学API子集：只接受一个带引号的正整数强标签；弱标签、通配符和标签列表都返回400，并非实现了全部HTTP标签语法。缺失标签返回428，过期标签返回412；428用于要求条件请求，见[RFC6585](https://www.rfc-editor.org/rfc/rfc6585.html#section-3)。

revision只在这个资源URI和受控写路径下标识表示版本；它不等于全局时间戳、数据库事务号或幂等键。如果将来返回表示包含额外可变化字段，也必须保证标签随表示变化。直接绕过接口更新title却不增加revision会破坏协议。

冲突后应重新读取，向用户展示差异并决定合并，再使用最新标签提交。自动把If-Match替换成最新值并重发旧正文，相当于绕过冲突保护，不能称作解决冲突。

## 数据版本不等于结构版本

`PRAGMA user_version=2`记录数据库已经有revision列；某行revision=7记录该行被此协议更新过。这两个数字职责不同。新库先建立基础表，再在事务内加列；v1旧库直接进入加列步骤：

```sql
ALTER TABLE notes ADD COLUMN revision
INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0);
```

已有行获得初始版本1。NOT NULL新增列需要非NULL默认值等约束，见[SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)。本例迁移在BEGIN IMMEDIATE里完成，最后才设置user_version=2并COMMIT；失败ROLLBACK。版本2重复执行直接返回，未知未来版本拒绝继续，而不是猜测兼容。

维护迁移仅针对这个教学schema，不能拿user_version数字证明任意陌生数据库结构正确。它没有为旧应用提供无限兼容，也没有删列式回退。更复杂变更应先确认旧新代码共存约束，详见先修迁移正文。

## 用可控顺序证明结果

运行E03的test与backend入口。真实HTTP测试让两个客户端先读同一标签，然后A写成功、B用旧标签写失败；检查数据库仍保留A的值。重新读版本2再更新，版本变3。它是明确安排的交错，不是随机压测，也不声称验证多节点数据库。

迁移测试建立有旧数据的v1内存库，在ALTER后故意抛错，检查列没有残留、user_version仍为1、旧行保留；恢复再迁移并重复执行，结果稳定。独立副本把版本相等改成“当前版本大于等于请求版本”，旧写入会错误成功，原412断言实际检出。

练习增加description字段，同时让旧客户端仍只写title。先判断PUT是否代表完整替换，再决定改接口契约还是提供单独操作；不能默默把未提供字段覆盖为空。补一个旧客户端请求前后description保持的测试，并解释你选择的兼容规则。

Node24.21.0/SQLite3.53.4、真实请求、故意错误与迁移回滚已核验；浏览器冲突展示和生产迁移 **NOT_RUN**。下一篇：[日志与有界等待](safe-observation-and-deadlines.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
