---
id: d03-outbox-consumer-replay
title: 业务已经提交，消息还没确认时怎样恢复？
description: 通过两个SQLite文件和真实子进程退出验证事务发件箱与消费去重。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [d02-retry-budget-jitter, e07-restore-release-evidence]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[重试边界](retry-budget-and-jitter.md)、[恢复验证](../08-production/restore-and-release-evidence.md)。目标：定位业务提交、消费提交和确认之间的崩溃窗口，并观察重放后的真实数据。

## 两次写入为什么会分开失败？

创建便笺以后，下游要把“创建事件计数”加一。直接先写业务库再通知下游，可能业务已提交而通知没有发出；反过来先通知再提交，可能下游看到了最终回滚的业务。

事务发件箱（transactional outbox）把业务行和待发事件放进同一数据库事务，先保证“业务提交就有可恢复的发送意图”。独立转发者relay再读取已提交事件并投递。[AWS发件箱模式](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) 解释了双写问题及重复交付的考虑。本实验没有创建AWS资源或消息代理。

## 两个本地事务，不是跨库大事务

[维护实现](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/distributed-lab)使用source.sqlite的notes/outbox和target.sqlite的inbox/summary。生产者事务插入业务与事件；消费者事务插入已处理事件标识并增加summary计数。两边各自提交，中间没有原子跨库事务。

消费者已经处理某个event.id时，同内容返回applied=false；同id不同内容拒绝。事件id带producer-a前缀，序号在这个单生产者库内唯一。扩展多个生产者时必须定义不会碰撞的标识域，不能让每个库的第1行都变成同一个事件。

本例保留全部inbox和outbox记录，sent只标记已确认。实际系统如果清理去重记录，应把可重放窗口、消息保留和恢复历史一起设计。把inbox单独恢复到旧备份，可能令已经执行过的效果再次执行。

## 为什么确认必须在消费之后？

relay读取最早未发送事件，调用消费者apply，成功后才更新source.outbox.sent。若先标sent再消费，进程在中间退出会让事件消失于待发列表。若消费成功后、标sent之前退出，恢复后会再次投递，因此消费者去重是必要的。

| 子进程退出位置 | 待发事件 | 消费效果 | 再运行 |
| --- | --- | --- | --- |
| 消费开始前 | 1 | 0 | 执行消费并确认 |
| 消费提交后、确认前 | 1 | 1 | 去重跳过效果，再确认 |
| 正常完成 | 0 | 1 | 无事可做 |

维护relay-worker在两个指定位置直接退出，退出码分别31、32，没有执行正常finally清理；父进程确认状态后启动新进程。它模拟进程突然终止后的重开，不模拟机器断电、磁盘损坏或远程消息代理行为。SQLite本地事务语义见[事务文档](https://www.sqlite.org/lang_transaction.html)。

## 真正跑一遍

```sh
npm ci --prefix examples/distributed-lab
npm test --prefix examples/distributed-lab
npm run delivery --prefix examples/distributed-lab
```

delivery默认在消费提交后中断，输出interruptedExit=32、replayApplied=false、effects=1、pending=0。全套测试还覆盖消费前中断、恢复后再次运行返回empty、业务写入中失败两表回滚、消费效果与inbox同时回滚。自建临时目录最后删除；不要单独给worker传用户已有数据库路径。

这里没有“消息只交付一次”：相反，同一事件明确投递了两次。受控本地效果只发生一次，是持久去重与效果共用事务的结果。外部邮件或远程调用若不在target事务里，inbox无法单独使它们原子化。

## 练习与保证条件

练习把summary改成“按事件owner分组计数”，再让消费者在计数更新后故意抛错。预期inbox与计数都回滚，重放一次才能使计数增加。提示：若先提交inbox再更新计数，重放会跳过尚未产生的效果。

持续重试、存储保留、消费者最终可用等条件成立时，未确认事件才有机会最终送达；永久离线或永久错误不会被模式自动解决。多relay并发认领、死信、背压和跨生产者顺序不在本实验范围。真实自有子进程/两库重放已验证；网络代理、云服务、断电和浏览器 **NOT_RUN**。下一篇：[副本进度与读取](replica-progress-and-session-reads.md)。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
