---
id: s07-sql-savepoints
title: 一组费用失败，怎样只撤销这一组？
description: 使用保存点划定局部回滚范围，区分RELEASE与外层提交。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [s06-sql-query-pages]
topics: [sql, storage]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

导入包含多组费用：第一组已校验成功，第二组的后一笔金额为零，第三组仍可合法导入。业务明确选择“拒绝整组，但保留其他成功组”。已有[事务与回滚](transactions-and-rollback.md)解释了全有或全无；这里要让局部边界嵌在外层事务里。

普通BEGIN事务不能随意嵌套。保存点（savepoint）给事务中的一个位置起名，使调用者能撤销这个位置之后的变更。它并不天然意味着一笔独立、已经持久化的子事务。[SQLite保存点](https://sqlite.org/lang_savepoint.html)

## 谁负责外层，谁负责局部

维护的addExpenseBatch要求调用者已经开启事务，固定使用expense_batch作为保存点名；不支持递归、重入或同名嵌套。SQL结构固定，journeyId与金额通过参数绑定传入。

```js
db.exec("SAVEPOINT expense_batch")
try {
  for (const amount of amounts) insert.run(journeyId, amount)
  db.exec("RELEASE expense_batch")
} catch (error) {
  db.exec("ROLLBACK TO expense_batch")
  db.exec("RELEASE expense_batch")
  throw error
}
```

这是维护函数中的核心片段，insert准备和事务前置检查见savepoints.mjs。成功后RELEASE移除这个标记；失败后ROLLBACK TO撤销本组写入，但保存点本身仍存在，所以随后RELEASE释放它，再把错误交回调用者。

外层才能决定是否继续导入，以及最后COMMIT还是ROLLBACK。示例仅识别实际的金额CHECK失败，随后继续下一组；不是捕获任何错误都当作“可以跳过”。遇到I/O错误等严重情况，清理命令本身也可能失败，本教学函数没有建立覆盖所有数据库故障的恢复框架。

## 观察四个动作的不同结果

先建一条空行程，开启外层事务。成功组[100]写入；失败组[200,0]第二项触发约束。如果只捕获错误而不回滚到保存点，前面的200仍会留在外层事务里。

维护实现撤销这组，再处理[300]，最终外层COMMIT。真实结果只含100、300。测试还在外层ROLLBACK前成功RELEASE一个[100]组，回滚后费用数仍为零。这证明内部RELEASE没有把数据独立提交出去。

| 命令 | 本例作用 |
| --- | --- |
| SAVEPOINT name | 记录事务内的位置 |
| ROLLBACK TO name | 撤销该位置之后的工作，保留该保存点 |
| RELEASE name | 移除保存点；外层事务仍能回滚这些修改 |
| 外层COMMIT／ROLLBACK | 决定外层范围最终保留或撤销 |

如果在没有外层事务时直接创建最外层保存点，其RELEASE可能结束并提交事务。本文刻意通过db.isTransaction前置检查排除这种用法，所以不能将上表机械推广到所有嵌套层次。相关Node属性以[固定v24.21.0官方文档源码](https://github.com/nodejs/node/blob/v24.21.0/doc/api/sqlite.md)为准。

## 验证与迁移练习

真实测试确认无外层事务时拒绝、失败组完全消失、前后成功组保留、外层仍处于事务中；另验证ROLLBACK TO后可再次回到同名保存点，RELEASE后再回滚它会报不存在。

练习：把失败放到第二组第一项，先预测哪条数据能保留；再在自己的临时副本删掉ROLLBACK TO，原测试应检出多出200。改变“允许跳过坏组”的业务决策，使任一组失败都撤销整个导入时，应由哪一层回滚？请描述错误传递路径，别只修改预期数组。

保存点也可用于某些数据库变更步骤，但项目已有[字段扩展与迁移](../07-testing-delivery/add-note-migration.md)的权威正文，这里不重复迁移教程。下一篇验证[备份与恢复](sqlite-backup-restore.md)：事务成功后，还需要证明数据可以恢复。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)。

```sh
npm ci --prefix examples/sql-trips
npm run advanced --prefix examples/sql-trips
npm test --prefix examples/sql-trips
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
