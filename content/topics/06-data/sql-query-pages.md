---
id: s06-sql-query-pages
title: 翻到下一页，为什么又看到了上一页的费用？
description: 从汇总查询的层次与全序开始，验证游标分页和变化中的数据边界。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [s05-sqlite-read-snapshots]
topics: [sql, storage]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

你已经会JOIN、GROUP BY、索引以及[读事务快照](sqlite-read-snapshots.md)。现在要展示按金额排序的费用，先取两项，再翻页。用户插入一笔较小的费用后，第二页为什么出现刚看过的条目？问题既涉及查询顺序，也涉及两次读取之间的数据变化。

## 先看清一行代表什么

`query-pages.mjs` 的summarySql先按行程汇总费用，再计算累计金额。公共表表达式（Common Table Expression，CTE）用WITH给这一步起名：

```sql
WITH totals AS (
  SELECT j.id, j.destination, COALESCE(SUM(e.amount_cents), 0) AS total
  FROM journeys j LEFT JOIN expenses e ON e.journey_id=j.id
  GROUP BY j.id, j.destination
)
SELECT id, destination, total,
  SUM(total) OVER (
    ORDER BY total, id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running
FROM totals ORDER BY total, id;
```

totals每行代表一个行程，保留零费用行程。外层的窗口函数（window function）为每行附加累计值，不像GROUP BY那样再次合并行。ROWS窗口明确从第一行累计到当前行；total相同时用唯一id定先后。窗口里的ORDER BY管计算顺序，最外层ORDER BY才指定返回顺序。[窗口函数规则](https://sqlite.org/windowfunctions.html)

CTE在一个语句内组织查询，可读性上的分层不等于永久表，也不保证更快或一定物化。[WITH语义](https://sqlite.org/lang_with.html)说明了普通与递归CTE的区别；本例没有递归查询。实际空行程总额零，有费用的行程总额七百；两个各一百的行程，累计值依次是一百、二百。

## 排序必须能区分同值记录

费用表用 `ORDER BY amount_cents, id`，金额相同再比较唯一id，形成确定的全序。只按金额排序时，同金额条目的先后没有被完整约定。游标（cursor）保存上页最后一项的两个值，下页读取：

```sql
SELECT id, amount_cents FROM expenses
WHERE (amount_cents, id) > (?, ?)
ORDER BY amount_cents, id LIMIT ?;
```

行值比较按从左到右的顺序比较对应字段，见[SQLite行值与滚动窗口查询](https://sqlite.org/rowvalue.html)。本例金额/id非NULL且升序；改为降序、混合排序或允许NULL时，不能直接沿用这个谓词。金额相同但id更大的行必须保留，不能仅写amount_cents大于上页金额。

## 把变化插在两次查询之间

维护数据id1至4的金额是100、100、200、300。第一页取id1、2，随后插入金额50的id5。现在 `LIMIT 2 OFFSET 2` 跳过新列表前两项，返回id2、3，id2重复了。用原游标(100,2)继续，则返回id3、4。

这里不是SQL偶然排序失败，而是OFFSET指向“当前列表里跳过几个位置”，位置随着新行改变。游标固定了比较边界，但它也不是快照：新插入的50在边界之前，不会出现在后续页；修改已有条目的排序字段仍可能造成遗漏或重复。需要导出某一时刻的全集时，应另外定义事务快照或数据版本，不能把游标分页直接叫作一致性导出。

## 验证与练习

测试覆盖空汇总、同金额累计、三条同金额的游标边界、越过末尾返回空列表及非法limit/cursor。CLI中第一页、OFFSET页与游标页各有真实输出。page函数将limit限定1–10，游标限定两个非负安全整数；这只是本例参数契约，没有实现公网游标签名或权限检查。

练习：将一页改成一项，先预测同金额三条记录依次出现的id；再只比较金额，观察边界断言应如何失败。随后在第一页后修改一条旧费用的金额，说明游标为什么不能保证跨次查询的固定全集。最后给汇总新增一个空行程，先算出窗口累计值，再核对程序。

需要嵌套局部撤销时，继续[保存点](sql-savepoints.md)。索引能否支持访问路径仍应另看[查询计划](indexes-and-query-plans.md)，本篇不发表性能数字。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)。

```sh
npm ci --prefix examples/sql-trips
npm run advanced --prefix examples/sql-trips
npm test --prefix examples/sql-trips
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
