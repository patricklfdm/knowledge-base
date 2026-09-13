---
id: s05-sqlite-read-snapshots
title: 写入提交了，另一个连接为什么还读到旧值？
description: 对比DELETE读锁与WAL读快照，区分提交受阻和旧快照写入失败，并验证各自的恢复步骤。
note_type: lab
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [s04-sqlite-writer-contention]
topics: [sql, isolation, wal]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

难度 **L2** · 先修：[双连接与写竞争](sqlite-writer-contention.md) · 目标：观察读事务的生命周期，区分“尚未提交”和“读者仍在看旧快照”。

核验：真实临时文件、两连接、DELETE提交受阻/WAL旧快照与事务重启均已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。没有进程崩溃、断电或生产恢复证明。

## 这次让读事务保持打开

上一实验中B只执行一次查询并取完结果，没有跨后续步骤保持显式读事务。现在B先执行BEGIN，再查询费用100，并让这个事务保持打开；随后A尝试把费用改为150。

我们只改变一个关键环境条件：分别在新临时文件中显式设置 `journal_mode=DELETE` 和 `journal_mode=WAL`。日志模式关系到修改如何记录、读写如何协调，不能只因为SQL相同就推断所有交错结果相同。

## DELETE：写入执行了，提交却可能受阻

本轮顺序为：B开始读事务并读100；A执行BEGIN IMMEDIATE、UPDATE为150；A尝试COMMIT，得到 `SQLITE_BUSY`，错误码5。

这时A自己仍能读到尚未提交的150，B仍读到100。COMMIT失败并没有自动把A的修改回滚。结束B的读事务后，A重试COMMIT成功，此后B的新查询读到150。

```text
B: BEGIN → SELECT 100
A: BEGIN IMMEDIATE → UPDATE 150 → COMMIT失败(5)
B: COMMIT
A: 再次COMMIT成功
B: 新查询得到150
```

这里重试的是仍然活动的事务的COMMIT，不是把UPDATE再执行一次。若原操作是“金额加25”，盲目重放UPDATE可能加两次。[SQLite事务文档](https://www.sqlite.org/lang_transaction.html#implicit_versus_explicit_transactions)明确说明了读者导致COMMIT忙错误时事务仍活动的情况。

因此，BEGIN IMMEDIATE成功不能脱离日志模式与读者状态，被当成“后面提交一定不受阻”的证明。本实验用最小数据直接复现提交失败，避免只看一句概括性描述作保证。

## WAL：提交可以前进，读者继续看旧快照

WAL是预写日志（write-ahead log）模式。已提交修改先保存在WAL中，再通过checkpoint逐步归入主数据库；这使读者和写者可以用不同的数据视图推进。本篇只观察隔离行为，没有实现或测试checkpoint/备份策略。[WAL说明](https://www.sqlite.org/wal.html)介绍了这种机制及其限制。

同样让B先BEGIN并实际读100。在本轮WAL实验中，A把费用改成150并成功提交；B在原读事务里再次查询，仍是100。这不是A忘了提交，也不是应用缓存没有刷新，而是B仍保持此前建立的读快照（read snapshot）。

快照是此次读事务使用的一致数据视图。B结束该事务，开启新事务并重新读取，才能看到后来的提交。[SQLite隔离说明](https://www.sqlite.org/isolation.html)给出了WAL快照的示例。

## 等一会儿不能把旧快照变成新快照

保持B的旧读事务，再尝试UPDATE，实测错误码为517，即 `SQLITE_BUSY_SNAPSHOT`。它与前面的5都显示 `database is locked`，只看英文错误文字会丢失区别。结果码含义见[BUSY_SNAPSHOT](https://www.sqlite.org/rescode.html#busy_snapshot)。

我们的恢复步骤是：B执行ROLLBACK，结束旧读事务；再BEGIN IMMEDIATE，重新读到150，按新值加25并COMMIT，最终175。代码没有睡眠循环，也没有拿旧100直接写回。

| 失败发生点 | 本轮状态 | 已验证的后续动作 |
| --- | --- | --- |
| B开始写事务，错误5 | A仍持有写事务，B尚未开始写事务 | A结束后，B新建写事务并重新读 |
| DELETE中A提交，错误5 | A写事务仍活动，B读事务未结束 | B结束后，A再次COMMIT |
| WAL中B旧快照写入，错误517 | A已提交，B仍保持历史读事务 | B结束旧事务，再开新事务重新读 |

这三种情况不能交给一个“遇到locked就重复上条SQL”的通用循环。重试范围取决于失败点、事务是否仍活动和业务是否允许重复；表格只对应本实验，不穷举所有SQLite故障。

## BEGIN本身什么时候确定读到的版本？

另一个练习先让B执行普通BEGIN，但暂时不SELECT；A随后写入并提交150，再由B第一次实际查询。本轮B读到150，而不是把执行BEGIN那一刻的100固定下来。

这个对照强调：本例普通延迟事务的首次实际读取很关键，不能只看到BEGIN就推断已经建立读快照。测试还让A之后尝试写200但回滚，B原读事务升级写入175成功；这与“A提交新版本后B得到517”是不同条件。

## 运行、预测与清理

从仓库根目录运行：

```sh
npm ci --prefix examples/sql-trips
npm test --prefix examples/sql-trips
npm run connections --prefix examples/sql-trips
```

完整源码见[sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)，重点是 `readerBlocksCommit` 和 `staleSnapshot`。演示后两行分别打印：读锁阻止提交的 `ownPending=150、readerStill=100、final=150`；旧快照的 `readerStill=100、errcode=517、reread=150、final=175`。

练习：把B第一次SELECT移到A提交之后，先预测结果，再运行第五组测试；接着把A的提交换成回滚，解释为什么不能再强求错误517。读锁、提交和快照都有生命周期，验证条件改变后的结果比记忆“WAL支持并发”更有用。

所有连接关闭后，夹具才删除自己创建的临时目录，包括其日志/WAL/SHM等文件。不要单独删除正在使用的WAL文件，也不要把复制主数据库文件当作本篇已验证的备份方法。

[返回SQL深入路线](../../roadmaps/sql-foundations.md)
