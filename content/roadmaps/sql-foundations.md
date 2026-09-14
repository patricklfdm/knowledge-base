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
| S04 | [双连接与写竞争](../topics/06-data/sqlite-writer-contention.md) | 比较提交/回滚释放后的重新读取，解释BUSY |
| S05 | [读事务与快照](../topics/06-data/sqlite-read-snapshots.md) | 区分COMMIT受阻与旧快照写失败，验证事务恢复范围 |
| S06 | [查询组织与分页](../topics/06-data/sql-query-pages.md) | 汇总/窗口全序、同值游标、变化后OFFSET反例 |
| S07 | [保存点与局部撤销](../topics/06-data/sql-savepoints.md) | 撤销整组失败、区分RELEASE和外层提交 |
| S08 | [备份与恢复验证](../topics/06-data/sqlite-backup-restore.md) | 找出主文件副本遗漏、在新进程核对业务数据 |

这条H5 SQL主线现在覆盖S01–S08，沿用开头两篇F10基础。综合练习：定义合法输入与关系约束，生成含零费用的汇总；用全序分页并解释变化的边界；拒绝一组坏费用，再将最终库备份到自己的临时目录，在新进程验证恢复内容。请保存预期、错误对照与实际结果，个人练习记录留仓库之外。

本主线使用SQLite实证；其他数据库产品、分布式事务和生产灾备平台属于后续专题，不以当前文章数声称全部SQL生态完成。

每篇正文记录环境、真实验证和未测边界。文章复核状态不表示个人掌握程度；浏览器按当前安排留内容建设完成后统一验收。

[全栈基础路线](fullstack-foundations.md) · [知识地图](../knowledge-map.md)
