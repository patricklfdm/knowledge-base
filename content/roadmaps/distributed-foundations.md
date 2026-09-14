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

下一批D03–D05：发件箱/消费去重、复制读取、租约与fencing，尚未交付。浏览器在所有规划内容完成后统一验收。

[知识地图](../knowledge-map.md)
