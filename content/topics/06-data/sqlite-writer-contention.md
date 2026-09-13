---
id: s04-sqlite-writer-contention
title: 两个数据库连接为什么不能同时写？
description: 用固定交错的双连接实验观察写竞争、未提交数据隔离，以及提交或回滚后重新读取再修改。
note_type: lab
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [s03-indexes-and-query-plans]
topics: [sql, concurrency, transactions]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

难度 **L2** · 先修：[索引与查询计划](indexes-and-query-plans.md) · 目标：区分连接和事务，用两个真实连接观察写锁，并解释重试前为什么要重新读取。

核验：DELETE/WAL两种日志模式的写竞争、提交与回滚释放、未提交值不可见均已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。实验是单进程同步交错，没有多线程压测或生产吞吐结论。

## 两个连接对应同一个文件

前面的示例只有一个连接，写入顺序由当前程序决定。现在让A、B两个连接打开同一个新建临时文件，初始费用为100分。A准备改为150，B准备在它读到的值上加25。

连接是程序与数据库交互的独立入口；事务是某个连接当前进行的一组操作。两个连接对象并不代表可以同时拥有写事务。[SQLite事务说明](https://www.sqlite.org/lang_transaction.html)指出，同一数据库同时只能有一个写事务。读写如何相互影响还取决于日志模式，下一篇会专门比较。

完整夹具 `withPair` 先建库、写入合成行程，再打开第二连接。两个连接均设置 `PRAGMA busy_timeout=0`，事务开始后不再初始化表结构。这样观察的是业务写锁，不会把建表时的竞争混进来。

## 用明确顺序代替“碰运气同时执行”

| 顺序 | 连接A | 连接B | 本轮观察 |
| --- | --- | --- | --- |
| 1 | BEGIN IMMEDIATE，改为150 | 尚未开始事务 | A自己能读到150 |
| 2 | 保持事务未结束 | 查询费用 | B仍读到已提交的100 |
| 3 | 仍持有写事务 | BEGIN IMMEDIATE | B失败，errcode=5 |
| 4 | COMMIT | 尚未取得写事务 | A的150提交 |
| 5 | 已结束 | BEGIN IMMEDIATE，重新读，加25，COMMIT | B读到150，最终175 |

这里没有sleep、随机延迟或让两个线程抢跑。A的事务尚未结束时执行B的调用，SQLite仍然要处理真实锁竞争。同步调用只是让交错顺序可重复，不会把两个连接变成同一个连接。

本轮在DELETE与WAL模式中都观察到这一结果。B读不到A的未提交150，体现连接之间的隔离；A自己却能在提交前读到自己的修改。本例不使用共享缓存或read_uncommitted选项，不能把这个观察扩展到未采用的连接配置。[SQLite隔离说明](https://www.sqlite.org/isolation.html)讨论了这些前提。

## SQLITE_BUSY不是“数据已经坏了”

本次B开始写事务时，Node错误的 `errcode` 是5，对应 `SQLITE_BUSY`。它说明当前操作受到其他连接活动阻碍，不表示本次写入已经成功，更不能直接解释为文件损坏。错误码定义见[SQLite结果码](https://www.sqlite.org/rescode.html#busy)。

`busy_timeout` 为连接配置忙等待处理。这里设为0，目的是让失败明确返回，不把实验变成计时测试；它不是“立即成功”的设置。更大的等待值也不会保证一定成功或提供业务重试策略，且不是所有失败都适合等待。[busy_timeout文档](https://www.sqlite.org/pragma.html#pragma_busy_timeout)给出了该连接设置的语义。

本例使用同步DatabaseSync。如果当前调用一直等待，同一JavaScript线程中的下一条“A提交”也无法越过它执行。因此我们先观察B失败，再显式结束A事务，最后让B重新开始；不写一个在同线程里原地无限等待的重试循环。

## 提交和回滚都会释放这次写占用

A提交后，B的新事务读到150，加25得到175。把A的结束动作换成ROLLBACK，写锁同样释放，但B重新读到的是原来的100，最终125。

这两个结果由同一个维护函数的参数对照得到：

```js
writerContention("DELETE", "COMMIT")   // reread=150，final=175
writerContention("DELETE", "ROLLBACK") // reread=100，final=125
```

WAL对照也得到相同的重新读取结果。不要把B在失败前读到的100缓存下来，等A提交后直接写125，那会覆盖A已经完成的修改。实验让B先成功开始写事务，再读取并计算，观察值和修改才属于同一次写事务。

这不是跨网络业务的通用幂等机制。创建订单、发送通知等动作是否能重复，仍需单独设计；这里仅研究数据库中的一条合成记录。

## 重现与练习

在仓库根目录运行：

```sh
npm ci --prefix examples/sql-trips
npm test --prefix examples/sql-trips
npm run connections --prefix examples/sql-trips
```

需要Node24.21.0，无额外npm依赖。代码位于[sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)的 `connections.mjs`、`connections-demo.mjs`、`connections.test.mjs`。演示只创建自己的临时数据库，不接受用户文件路径；关闭两个连接后清理整个自建目录。后两行输出属于下一篇读快照实验。

练习：先预测A回滚后B应读到什么，再运行测试中的回滚对照。然后在独立副本中把B的“重新读取”故意换成固定100：提交场景将错误得到125，测试应失败；恢复代码后再运行。错误被拒绝与正确值被保存需要分别断言，不能只检查程序有没有抛异常。

本例没有证明多个进程/多台机器的容量、网络文件系统兼容或等待上限。下一篇：[写入提交了，另一个连接为什么还读到旧值？](sqlite-read-snapshots.md)
