---
id: s01-joins-and-null
title: 一对多查询为什么会漏行或数错？
description: 用行程与费用明细理解外键、JOIN和LEFT JOIN，区分结果行数与实际明细数。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [f10b-sql-parameters-and-constraints]
topics: [sql, modeling, joins]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[参数绑定与约束](sql-parameters-and-constraints.md) · 目标：查询每个行程的明细和合计，并解释“没有明细”为什么可能被查询漏掉。

核验：合成SQLite中外键拒绝、关联查询、零条计数与改变筛选条件均已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。金额只是整数分的教学数据，不涉及真实账目。

## 一行不再能装下整个行程

山城行程有两笔费用100分、200分；海湾有一笔5000分；雪原还没填写费用。如果把费用写成字符串 `"100,200"`，求和、校验和修改某一笔都要自己拆字符串。另一种做法是让每笔费用占一行，并用行程编号说明归属。

示例的 `journeys` 保存行程，`expenses` 保存明细。每个行程可以对应零条或多条明细，这是**一对多关系（one-to-many relationship）**。编号关联不要求两张表的行在文件中挨在一起。

下面是 `ledger-schema.sql` 的关键部分；完整表还使用STRICT，并限制目的地非空、费用为正整数：

```sql
CREATE TABLE journeys (
  id INTEGER PRIMARY KEY,
  destination TEXT NOT NULL CHECK(length(destination) > 0)
) STRICT;

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES journeys(id),
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0)
) STRICT;
```

`REFERENCES` 声明**外键（foreign key）**：明细的 `journey_id` 必须引用存在的行程。`NOT NULL` 另行拒绝“没有归属”的值。代码在事务外为每个连接显式执行 `PRAGMA foreign_keys = ON`，并用测试检查值为1，不依赖某个驱动的默认设置。[SQLite外键文档](https://www.sqlite.org/foreignkeys.html)说明了连接级开关及约束行为。

本轮实测，插入归属999的孤儿明细失败；已有明细时直接删除父行也失败。这里没有配置级联删除，不能从“有外键”推断会自动删除子行。外键同样不能验证当前用户有没有权访问这个行程，授权仍是另一层问题。

## JOIN的每一行表示什么？

```sql
SELECT j.id AS journey_id, j.destination,
       e.id AS expense_id, e.amount_cents
FROM journeys AS j
JOIN expenses AS e ON e.journey_id = j.id
ORDER BY j.id, e.id;
```

`AS j`、`AS e` 是本次查询中的简称；`ON` 写出两边怎样匹配。这个内连接（inner join）返回三行：山城两行、海湾一行。雪原没有匹配明细，所以不出现。结果的一行现在代表“行程与某笔明细的配对”，不再代表一个完整行程。[SQLite SELECT说明](https://www.sqlite.org/lang_select.html)给出了连接和筛选语义。

这不是数据库把山城重复存了两次，也不适合直接用 `DISTINCT` 掩盖：两笔明细确实不同。先说清楚需要“每笔明细”还是“每个行程”，再决定查询结构；忘写关联条件还可能组合出互不相关的行。

## 没有费用的行程也要出现

要显示所有行程，使用左连接（left join）：即使右侧没有匹配，也保留左侧行，并让该结果行的右侧列为 `NULL`。

```sql
SELECT j.id, j.destination, COUNT(e.id) AS expense_count,
       COALESCE(SUM(e.amount_cents), 0) AS total_cents
FROM journeys AS j
LEFT JOIN expenses AS e ON e.journey_id = j.id
GROUP BY j.id, j.destination
ORDER BY j.id;
```

`GROUP BY` 把同一行程的匹配结果放进一组，再计算该组的明细数和总额。显式按编号和目的地分组，避免含糊地读取未分组的普通列。

| 行程 | 明细数 | 合计分 |
| --- | --- | --- |
| 山城 | 2 | 300 |
| 海湾 | 1 | 5000 |
| 雪原 | 0 | 0 |

雪原保留下来的占位结果里，`e.id` 为 `NULL`。`COUNT(e.id)` 只计非NULL值，因此得到0；换成 `COUNT(*)` 会计入这行，错误地得到1。`SUM` 在没有非NULL金额时得到NULL，`COALESCE(..., 0)` 才把它转换成本例展示需要的0。分别见[聚合函数](https://www.sqlite.org/lang_aggfunc.html)与[COALESCE](https://www.sqlite.org/lang_corefunc.html#coalesce)。NULL与数值0的含义不同，不能对所有业务字段都随便补0。

## 筛选条件的位置会改变问题

如果只统计至少1000分的费用，同时仍列出所有行程，把右表条件写进 `ON`：

```sql
SELECT j.id, COUNT(e.id) AS n
FROM journeys j
LEFT JOIN expenses e
  ON e.journey_id = j.id AND e.amount_cents >= ?
GROUP BY j.id ORDER BY j.id;
```

绑定1000后得到 `(1,0)、(2,1)、(3,0)`。如果把同一个条件移到 `WHERE e.amount_cents >= ?`，最终只剩海湾：WHERE会过滤连接后的结果；无匹配行的NULL比较不会成为真，因而也被移除。选择哪种写法取决于你要“所有行程及其合格明细数”，还是“只有存在合格明细的行程”。

## 运行与改变条件

在仓库根目录运行：

```sh
npm ci --prefix examples/sql-trips
npm test --prefix examples/sql-trips
npm run ledger --prefix examples/sql-trips
```

独立无npm依赖。完整代码见[sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)的 `ledger.mjs`、`ledger-schema.sql` 和 `ledger.test.mjs`；演示只使用自建临时库并清理。它还打印下一篇的事务对照，不要把每一段代码摘录当独立完整程序。

练习：将筛选门槛从1000改成200，先预测每行计数，再执行第三组测试中的参数对照。提示：山城的100不满足，200满足。实跑结果为 `(1,1)、(2,1)、(3,0)`。再将汇总中的COUNT换成星号，解释雪原为什么变成1；维护测试会验证这确实是错误答案。

本篇只覆盖一对多。再连接另一张同样一对多的表，可能把组合行数进一步放大；不能沿用本例SUM就认定结果正确。多对多、复杂汇总和查询性能留后续专题。

下一篇：[多次写入如何一起成功或撤销？](transactions-and-rollback.md) · [SQL深入路线](../../roadmaps/sql-foundations.md)
