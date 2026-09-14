---
id: q04-checkpoint-replay
title: 进程停在第几行，怎样保证恢复时不漏算也不重复累加？
description: 让源身份、偏移、去重、窗口结果与水位线共用本地事务，验证提交前后的进程退出。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [q03-event-time-watermarks, d03-outbox-consumer-replay]
topics: [data-engineering, stream-processing]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, SQLite 3.47.1, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[事件时间](event-time-and-watermarks.md)、[事务发件箱与消费重放](../09-distributed/outbox-and-consumer-replay.md)。目标：把读取进度与计算结果放在同一个恢复边界，并定位两种真实进程退出的不同结果。

## 只保存“已经读了两行”不够

如果先保存position=2再加第二行的金额，进程在中间退出，恢复后会跳过尚未产生的效果。反过来先加金额再单独存position，恢复后可能重复加一次。检查点（checkpoint）必须描述一个彼此一致的状态，而不只是文件行号。

本例使用三个SQLite表：checkpoint保存源SHA、策略、已处理行数position、最大事件时间、水位线和重复数；seen保存id、事件摘要及accepted/late结论；totals保存路线×窗口的计数和金额。单行事务一起修改这些表。

## 源身份也是检查点的一部分

position=2只对某个确定的输入有意义。程序先限制输入大小、逐行验证契约，再把整份输入字节SHA与规则版本、窗口宽度、lag、状态上限绑定到检查点。改变JSON空格但保持语义相同，也属于不同字节输入；测试要求拒绝复用旧检查点。

本例是单份不可变有界日志的恢复实验：最多100行，**不支持向同一文件追加数据后沿用旧检查点**。生产增量源需要稳定分区/序号与截断、重写检测等协议，这里没有实现。换新输入或策略时，先用全新检查点重算并对账，不能只把旧position改成0而保留旧totals。

## 一行事务的实际顺序

BEGIN IMMEDIATE后读检查点→读取当前事件→查seen→决定重复/迟到/汇总→更新seen和水位线→position加一→commit。中间出现冲突、状态超限或注入异常则rollback，保留此前已经提交的前缀。

事务接口与连接行为在线核对[Python sqlite3文档](https://docs.python.org/3.13/library/sqlite3.html)；本例显式选择isolation_level="DEFERRED"并执行BEGIN IMMEDIATE，再明确commit/rollback。[SQLite事务语义](https://www.sqlite.org/lang_transaction.html)是同一文件内原子修改的依据。创建表与初始空检查点先完成，后续每条事件独立提交，不称整份输入一个大事务。

## 让子进程真正退出

```sh
npm ci --prefix examples/data-pipeline
npm test --prefix examples/data-pipeline
npm run stream --prefix examples/data-pipeline
```

[worker与测试](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/data-pipeline)只接收父示例创建的临时路径。worker在第2行指定位置执行os._exit，不跑正常finally；父进程等待退出，再重新打开数据库。不要给内部worker传现存业务数据库。

| 退出位置 | 退出码 | 重开后position | 恢复动作 |
| --- | --- | --- | --- |
| 第2行改完、提交前 | 41 | 1 | 第2行重新处理 |
| 第2行提交后 | 42 | 2 | 从第3行继续 |

默认stream实测interrupted_exit=42、committed_position=2；恢复最终position=5，duplicates=1，late=[e3]，汇总700分。再次运行同输入无新增效果。异常回滚测试还核对提交前失败时第二组不存在，W仍为0，防止“进度没变但结果已变”的半恢复。

## 保证止于哪里？

这里的效果是同一SQLite内的seen与totals；外部HTTP调用、邮件或另一数据库不在该事务内。检查点回滚与重复输入处理验证了限定条件下的本地效果，没有证明任意外部系统的exactly-once交付。

SQLite3.47.1是本机CPython实际内置版本；CI的固定Python发行物可能链接不同SQLite补丁，测试不把它伪称同一库版本。示例未模拟断电、损坏磁盘或断网存储。读取快照仅在消费者停止或处理完成时进行，不提供并发报表读取协议。

练习：把错误注入点改到第一行，预测重开后各表。提示：空检查点仍存在，但position应为0、totals为空。再把同id金额改掉，检查此前已提交的事件保持不变，而冲突行没有推进position。

真实两种进程退出、重开、事务回滚、源/策略漂移均已测试；云、跨库原子性、断电与浏览器 **NOT_RUN**。下一篇：[补数与对账](backfill-and-reconciliation.md)。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
