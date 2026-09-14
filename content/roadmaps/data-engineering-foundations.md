---
id: roadmap-data-engineering-foundations
title: 批流处理与数据质量路线
description: 从事件契约与批次发布进入事件时间、重放和补数对账。
note_type: navigation
status: seed
draft: false
publish: true
tags: [data-engineering]
---

先完成[Python路线](python-foundations.md)与[分布式故障实验](distributed-foundations.md)。examples/data-pipeline只使用合成行程事件、自有临时目录和固定Python标准库。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| Q00 | [事件契约与隔离](../topics/10-data-engineering/event-contract-and-quarantine.md) | 坏行、重复与身份冲突的处理为什么不同 |
| Q01 | [分析粒度与维度](../topics/10-data-engineering/analytical-grain-and-dimensions.md) | 关联为何放大金额，哪些断言能发现 |
| Q02 | [批次清单与发布](../topics/10-data-engineering/batch-manifest-publication.md) | 写完新文件为何还没发布 |
| Q03 | [事件时间与水位线](../topics/10-data-engineering/event-time-and-watermarks.md) | 早发生的事件为什么仍可能迟到 |
| Q04 | [检查点与重放](../topics/10-data-engineering/checkpoint-and-replay.md) | 偏移与结果为什么必须一同提交 |
| Q05 | [补数与对账](../topics/10-data-engineering/backfill-and-reconciliation.md) | 金额一样为何计数仍可能错误 |

Q00–Q05有限主线已实现，不代表无限流框架或生产数据平台。浏览器等规划内容完成后统一验收。

## 综合自测

把一份事件快照从质量报告追到批次清单，再给在线处理安排乱序、重复和提交前/后进程退出。解释300分差额的来源，验证完整补数重跑内容不变，再让0分事件缺失以检验计数对账。只用合成数据和自己的临时目录，个人掌握记录留仓库之外。

[返回知识地图](../knowledge-map.md)
