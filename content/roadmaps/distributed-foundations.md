---
id: roadmap-distributed-foundations
title: 分布式基础与故障实验路线
description: 从未知结果走到幂等、重放、复制进度与旧持有者写入防护。
note_type: navigation
status: seed
draft: false
publish: true
tags: [distributed]
---

先完成[工程纵深](reliable-engineering.md)，并按正文先修复习[SQL](sql-foundations.md)与[系统](systems-foundations.md)。examples/distributed-lab只用合成数据、自建临时文件与进程，模型结果不冒充真实集群或生产保证。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| D00 | [超时与未知结果](../topics/09-distributed/timeout-and-unknown-outcome.md) | 同样没响应，为什么可能执行0或1次 |
| D01 | [幂等账本](../topics/09-distributed/idempotency-ledger.md) | 同key同意图、异意图及半写入分别怎样处理 |
| D02 | [重试预算与抖动](../topics/09-distributed/retry-budget-and-jitter.md) | 次数、操作成本、等待和错误分类怎样共同限制 |
| D03 | [发件箱与消费重放](../topics/09-distributed/outbox-and-consumer-replay.md) | 消费提交后崩溃，为什么还会再次交付 |
| D04 | [复制进度与会话读取](../topics/09-distributed/replica-progress-and-session-reads.md) | 最低版本令牌能限制什么，不能保证什么 |
| D05 | [租约与fencing](../topics/09-distributed/lease-and-fencing.md) | 新代次已被资源接受后，怎样拒绝旧写入 |

D00–D05有限基础主线已实现；不是共识算法或生产集群教程。浏览器在所有规划内容完成后统一验收。

[知识地图](../knowledge-map.md)

## 综合自测

记录一次响应丢失、一处消费提交后退出、一次落后副本读取及一个旧epoch写入的历史。逐个说明谁知道什么、哪些数据已提交、恢复后能否重复，以及失败断言应该检查什么。用合成数据和自己的临时目录，个人掌握记录留仓库之外；下一领域为批流与数据质量。
