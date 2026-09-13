---
id: s02-transactions-and-rollback
title: 多次写入如何一起成功或撤销？
description: 对照无显式事务的半写入与BEGIN、COMMIT、ROLLBACK，验证失败后原数据及连接状态。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [s01-joins-and-null]
topics: [sql, transactions, testing]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[行程与明细关联](joins-and-null.md) · 目标：为一组同步写入划定事务边界，用失败后的数据证明回滚有效。

核验：成功提交、不同失败位置、既有记录保持、关闭重开与不支持嵌套均已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。并发、断电、磁盘错误、生产恢复未测试。

## 第二笔失败，第一笔会怎样？

一次“创建行程并填写两笔费用”需要三条INSERT：先建行程，再写100分，再写第二笔。我们故意把第二笔设为-1，让数据库的 `CHECK(amount_cents > 0)` 拒绝它。

如果只是顺序调用三个 `run()`，程序虽然抛错，行程和100分那笔却已经留下。`try/catch` 只改变JavaScript的控制流程，不会撤销此前SQL。示例中的 `createWithoutTransaction` 专门保留这个反例，只用于合成数据实验。

这里“无事务”是简称，准确地说是**没有把多条语句放进同一个显式事务**。SQLite仍为数据库访问使用事务；本例逐条完成的写入各自自动提交，不会知道三次调用其实属于同一个业务动作。[SQLite事务文档](https://www.sqlite.org/lang_transaction.html)区分了隐式和显式事务。

## 把业务动作划成一个提交单位

事务（transaction）让我们明确哪些数据库修改必须一起提交。原子性（atomicity）关注这组修改是否作为整体生效。本例希望任何一笔费用失败时，连本次新建的行程也不保留。

```js
export function createWithTransaction(db, destination, amounts) {
  db.exec("BEGIN IMMEDIATE")
  try {
    const id = writeRows(db, destination, amounts)
    db.exec("COMMIT")
    return id
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
```

这是 `ledger.mjs` 中的函数摘录。`writeRows` 先绑定目的地插入父行，再循环绑定行程id与费用；没有把输入拼成SQL。`COMMIT` 成功后才返回编号；失败路径先 `ROLLBACK`，再把错误交给调用者，避免把“函数执行结束”误当保存成功。

`BEGIN IMMEDIATE` 在开始时尝试启动写事务；它不是“总能立刻拿到锁”的保证，另一写事务存在时可能失败。本例没有并发与重试策略，不能把同步演示直接当多人生产服务。[事务模式说明](https://www.sqlite.org/lang_transaction.html#deferred_immediate_and_exclusive_transactions)解释了这种差别。

## 为什么不能只等数据库自己全部撤销？

普通约束错误不应被理解为自动撤销整个业务流程。以本例CHECK失败为例，出错语句没有写入，但此前语句的修改仍需明确处理；在我们创建的事务中，catch执行ROLLBACK才撤回这些修改。[SQLite冲突处理说明](https://www.sqlite.org/lang_conflict.html)区分当前语句失败与整个事务回滚。

本轮对照结果：

| 执行方式 | 新行程 | 第一笔100分 | 非法第二笔 |
| --- | --- | --- | --- |
| 没有显式事务 | 留下 | 留下 | 拒绝 |
| 同一个显式事务并回滚 | 撤销 | 撤销 | 拒绝 |

原来已经提交的行程不应消失。测试先保存一条“既有”记录，再分别让第1、第2、第3笔失败，逐次比较原有汇总和明细数量；最后再创建一条合法记录，证明失败后连接还能开始新事务。只断言“抛出了错误”，无法发现半写入或连接仍困在事务中的问题。

## 边界要和代码一样清楚

函数在try外执行BEGIN：如果调用方本来已有事务，BEGIN会失败，本函数不会去ROLLBACK调用方的事务。测试实际创建外层事务、插入一条行程，再调用本函数，观察嵌套错误与外层行仍在，最后由调用方撤销。

本函数**不支持嵌套事务**；需要局部回退时另学SAVEPOINT，不能直接再套一层BEGIN。它也只包同步SQLite操作，没有await、网络请求或外部副作用。已经发送的邮件或调用的外部服务，不会因为数据库ROLLBACK而被撤销。

错误处理针对本例的正常约束拒绝。磁盘满等错误可能改变事务状态，ROLLBACK自身也可能报错；本例未实现完整生产故障诊断，不把这段catch称为通用事务库。完整来源中的错误响应章节列出了需要另行处理的情况。

## 从空环境重现证据

在仓库根目录执行：

```sh
npm ci --prefix examples/sql-trips
npm test --prefix examples/sql-trips
npm run ledger --prefix examples/sql-trips
```

需要Node24.21.0，无npm依赖。完整源码见[sql-trips示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)。演示为成功、无事务失败、有事务失败各建一个自己的临时数据库，全部关闭后清理，不接收用户库路径。

实际输出中，无事务汇总含一条 `expense_count: 1`、`total_cents: 100`；有事务失败的汇总为 `[]`。成功例有山城300、海湾5000、雪原0，关闭重开后仍有3个行程。这里验证的是正常提交后重开连接；不是本批新增的进程崩溃或断电恢复证明。

## 练习：把错误移动到不同位置

将 `[100, -1]` 改成 `[100, 200, -1]`。先预测无事务反例留下多少笔、合计多少，再运行；对事务版本，已有记录与本次新增行应分别怎样变化？

提示：业务回滚范围由BEGIN与COMMIT的位置决定，不由“第几条出错”决定。维护测试已覆盖事务版本的三个失败位置。无事务新条件应留下2笔、合计300分；可在独立副本改演示验证，结束后恢复参数。

后续索引实验会比较读取路径。先保证结果和失败语义正确，再讨论如何减少查询工作；不能用“查得快”替代“数据对”。

[返回SQL深入路线](../../roadmaps/sql-foundations.md)
