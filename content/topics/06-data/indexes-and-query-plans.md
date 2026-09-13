---
id: s03-indexes-and-query-plans
title: 索引改变了查询的哪些步骤？
description: 用相同查询的四种计划对照理解复合索引列顺序与覆盖索引，先验证结果再讨论性能。
note_type: lab
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [s02-transactions-and-rollback]
topics: [sql, indexes, query-plans]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[事务与回滚](transactions-and-rollback.md) · 目标：读取真实查询计划，比较复合索引列顺序，同时证明查询结果没有变化。

核验：2000条合成费用的四状态计划、结果等价、边界/空结果和增改删已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。没有记录耗时、吞吐或磁盘占用，不能声称获得某个性能倍数。

## 先把问题限定成一条查询

我们需要行程42中至少1000分的费用，按金额、编号排序：

```sql
SELECT id, amount_cents FROM expenses
WHERE journey_id = ? AND amount_cents >= ?
ORDER BY amount_cents, id;
```

数据来自前两篇的两张表：本实验创建100个行程，每个行程20笔费用，金额为100、200，一直到2000分。总计2000条明细，每次从空内存库按同样顺序生成；没有随机数据、用户文件或线上查询。

绑定42和1000时，正确答案是11条，金额1000至2000分，编号830至840。先确定答案，才能发现“改快了”是否其实漏掉边界或查到了其他行程。

## 索引提供另一条查找路径

索引（index）是数据库维护的额外查找结构。本实验的复合索引先按行程编号组织，再在同一行程内按金额组织：

```sql
CREATE INDEX expenses_journey_amount
ON expenses(journey_id, amount_cents);
```

这与“先翻到某个行程，再找到金额起点”的查询条件相配。它没有改掉费用表的业务含义，也不自动替代明确的ORDER BY。[SQLite查询规划说明](https://www.sqlite.org/queryplanner.html)用有序索引解释查找、复合列及排序路径。

索引也不是免费的查询提示。它需要空间，相关行的插入、删除或索引列修改需要维持索引内容。本例验证了这些写入之后仍能查到正确结果，但没有测量额外空间或写入耗时。不能因此建议给每一列都建索引。

## 用EXPLAIN观察计划，而非猜测

在原查询前加 `EXPLAIN QUERY PLAN`，绑定同样的参数。它返回数据库准备采用的主要访问步骤，不会给你一份查询耗时报告。[官方EQP文档](https://www.sqlite.org/eqp.html)还特别说明，调试输出格式可能随SQLite版本变化。

本轮SQLite3.53.4的实际结果：

| 状态 | 主要访问步骤 | 排序步骤 | 返回条数 |
| --- | --- | --- | --- |
| 无额外索引 | SCAN expenses | TEMP B-TREE FOR ORDER BY | 11 |
| 行程、金额索引 | SEARCH，使用expenses_journey_amount | 无单独TEMP B-TREE步骤 | 11 |
| 金额、行程索引 | SEARCH，使用expenses_amount_journey | TEMP B-TREE FOR LAST TERM OF ORDER BY | 11 |
| 移除实验索引 | SCAN expenses | TEMP B-TREE FOR ORDER BY | 11 |

SCAN与SEARCH说明访问方式；不要只看到SCAN就断言“从未用索引”，某些查询也会顺着索引扫描。TEMP B-TREE表示该计划还要借助临时结构完成相应排序。本实验只比较这组固定数据和查询。

行程在前时，本轮完整计划为：

```text
SEARCH expenses USING COVERING INDEX expenses_journey_amount
(journey_id=? AND amount_cents>?)
```

虽然输出用 `>?` 表示范围约束，原查询仍然是 `>=`。测试实际确认1000分那条保留；不要把计划中的简写反抄成业务SQL。

`COVERING INDEX` 表示此次输出和筛选需要的字段可以从索引取得。这里expenses的INTEGER PRIMARY KEY是rowid的别名，普通索引也携带定位行所需的信息，因此选出的id不要求再读取另一个普通字段。[SQLite rowid表说明](https://www.sqlite.org/rowidtable.html)解释了这个特殊关系。换一组SELECT列，覆盖条件可能就不成立。

## 两个索引列为什么不能随意交换？

将唯一实验索引换成：

```sql
CREATE INDEX expenses_amount_journey
ON expenses(amount_cents, journey_id);
```

现在先按金额，再按行程组织。本轮计划只把 `amount_cents>?` 列为搜索范围；行程条件仍需检查，结果没有因此放宽到其他行程。排序要求还有id，同金额下索引中的行程顺序不能普遍替代这个排序要求，因此这次计划还列出了末尾排序步骤。

列顺序要结合具体条件和排序看。这里是行程等值、金额范围；换查询后另一种顺序可能更适合。优化器的选择也受版本、数据和统计信息影响，不能从一次实验推导“后一列永远不能用”或“SEARCH一定更快”。

## 重现与检查副作用

在仓库根目录运行：

```sh
npm ci --prefix examples/sql-trips
npm test --prefix examples/sql-trips
npm run indexes --prefix examples/sql-trips
```

完整例子见[sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)中的 `index-plans.mjs`、`index-demo.mjs`、`index-plans.test.mjs`。演示按顺序建、删两个明确命名的实验索引，只操作自己新建的内存库，结束关闭连接；不要把这些DDL复制到用户或生产库上试验。

测试比较四个状态的完整有序结果；建立索引后另插入2500分、将原1000分改为50分、删除新增行，再核对结果变化。只比较“都是11条”不足以发现查错行程，因而断言包含编号与金额。

计划断言仅是锁定环境下的教学观察，不是应用逻辑依赖EQP格式。升级后如果断言失败，先检查版本、实际计划和结果，不应直接删掉断言或把历史观测称为永久保证。

## 练习：改变范围边界

把金额门槛改成2000，预测有无索引各返回几条；再改2001，以及不存在的行程101。本轮实跑分别得到1、0、0条，两个索引状态的有序结果相同。

再把原查询的 `>=` 故意改为 `>`，1000分那条会丢失。维护测试能检出这种错误；“计划依然用了索引”并不能证明答案对。这是先比较语义，再读计划的原因。

下一篇[双连接与写竞争](sqlite-writer-contention.md)讨论连接竞争和失败后重新读取，不能把本篇纯内存、单连接实验当生产容量验证。

[返回SQL深入路线](../../roadmaps/sql-foundations.md)
