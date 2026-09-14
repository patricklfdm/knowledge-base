---
id: d01-idempotency-ledger
title: 怎样把幂等键与业务写入一起保存？
description: 用SQLite事务绑定请求身份、规范化意图和原始结果。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [d00-timeout-unknown-outcome, e04-conditional-update-migration]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[未知结果](timeout-and-unknown-outcome.md)、[条件更新与迁移](../05-backend/conditional-update-and-migration.md)。目标：让同一创建意图可安全重放，并说明去重记录为什么不能最后随手补写。

## 先决定什么算同一次意图

两次请求标题同为“海边”，可能是响应丢失后的重试，也可能是用户确实想创建两条。仅按正文哈希去重会混淆这两种情况。本例由调用者为一次意图选择key，重试沿用它；新意图使用新key。键按owner隔离，alice与bob使用相同字符串仍是不同请求。

ledger.mjs只接受两个合成owner，不实现认证；真实服务必须从可信身份上下文取得owner。接口只支持title，先trim再比较；空白差异在本协议中等价。复杂JSON若要规范化，需要显式定义字段、默认值和顺序语义，不能照搬任意字符串化。

同key同规范化title返回保存的原始创建结果；同key不同title抛Conflict，不能默默返回旧结果让调用方误以为新意图生效。[AWS幂等API说明](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) 讨论了客户端请求标识与不同意图之间的关系。

## 两张表共用一个事务

notes保存业务行；requests的主键是(owner,request_key)，保存title和note_id。创建过程先BEGIN IMMEDIATE，查requests；不存在才插入notes与requests，最后COMMIT。关键片段来自[维护账本](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/distributed-lab/ledger.mjs)：

```sql
INSERT INTO notes(owner,title) VALUES (?,?);
INSERT INTO requests VALUES (?,?,?,?);
```

片段中的参数来自同一次已校验调用，完整事务边界在源码；这不是可单独复制执行的迁移脚本。若先提交业务行、再写请求回执，进程在中间退出后，重试看不到回执就可能再次创建。唯一键只限制回执行数量，无法单独撤销已经重复发生的业务副作用。

SQLite事务把这两次写入放入同一本地提交边界；失败回滚两者。BEGIN IMMEDIATE会尝试取得写事务，竞争可能返回busy，不意味着等待必然成功。[SQLite事务文档](https://www.sqlite.org/lang_transaction.html) 说明了单写者和事务开始的行为。本例不做忙等循环或多数据库原子提交。

## 重启以后还认识旧请求吗？

内存Map去重只能活到当前进程结束。本篇将回执存进与业务数据相同的SQLite文件；测试关闭连接再打开自己创建的文件，同key仍返回原id且行数为1。Node接口的同步操作、文件与内存数据库区别见[对应版本SQLite API](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/sqlite.md)。此项是连接重开证据，不冒称已模拟机器断电；后续会另做真实子进程退出。

维护失败钩子位于业务INSERT后、回执INSERT前。测试故意抛错，断言两表均为空；再次正常调用只有一行。独立副本删除prior检查会使重复请求失败或副作用断言失败，证明测试依赖真实去重语义。

## 保证必须有边界

本例不删除回执。若后续增加保留期限，期限之外的旧请求可能再次执行，必须让客户端知道可重试窗口。备份回滚也可能让已返回成功的回执消失，不能只恢复业务表或只恢复请求表。

邮件、支付、远程写入不在这个SQLite事务里。在事务中调用外部服务不能自动把它纳入回滚；跨系统的消息交付需要下一批的发件箱和消费去重。这里保证的是受控本地创建协议的重复意图不增加业务行，不声称网络“恰好交付一次”。

运行D00的test和requests命令：同key重放一条、异意图拒绝、新key可创建同标题、不同owner互不合并、故障后两表无半结果都已核验。练习为创建增加days字段：先定义同key下days不同的行为，再把days纳入规范化意图与回执比较。提示：只检查title会把不同天数误判成同一请求。

所有示例仅合成数据；跨库事务、真实认证、磁盘灾难和浏览器 **NOT_RUN**。下一篇：[安排有边界的重试](retry-budget-and-jitter.md)。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
