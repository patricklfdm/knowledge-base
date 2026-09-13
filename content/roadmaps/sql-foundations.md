---
id: roadmap-sql-foundations
title: SQL建模与查询深入路线
description: 从单表保存出发，逐步理解关系、汇总、事务与查询访问路径。
note_type: navigation
status: seed
draft: false
publish: true
tags: [data]
---

## 从已经会的单表开始

先完成[SQL表与文件保存](../topics/06-data/sql-tables-and-persistence.md)和[参数绑定与约束](../topics/06-data/sql-parameters-and-constraints.md)。本路线使用合成行程数据，完整示例位于仓库 `examples/sql-trips/`，不连接个人或生产数据库。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| S01 | [一对多查询与NULL](../topics/06-data/joins-and-null.md) | 保留零费用行程，解释COUNT星号与ON/WHERE区别 |
| S02 | [事务与失败回滚](../topics/06-data/transactions-and-rollback.md) | 改变错误位置，证明失败没有留下半份数据 |
| S03 | [索引与查询计划](../topics/06-data/indexes-and-query-plans.md) | 比较复合列顺序，验证边界与结果等价，不虚构性能收益 |

并发访问和存储恢复仍在规划中；未建立未完成正文的链接。这些条目不代表已经覆盖完整SQL或所有数据库产品。

每篇正文记录环境、真实验证和未测边界。文章复核状态不表示个人掌握程度；浏览器按当前安排留内容建设完成后统一验收。

[全栈基础路线](fullstack-foundations.md) · [知识地图](../knowledge-map.md)
