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

下一批Q03–Q05：事件时间、检查点重放、补数与资源约束。此处为计划，不代表已实现。浏览器等规划内容完成后统一验收。

[返回知识地图](../knowledge-map.md)
