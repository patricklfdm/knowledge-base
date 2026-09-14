---
id: roadmap-search-ai-foundations
title: 搜索与AI应用工程路线
description: 从可解释词法检索和离线评估进入证据上下文、输出契约与调用边界。
note_type: navigation
status: seed
draft: false
publish: true
tags: [search-ai]
---

先完成[Python路线](python-foundations.md)与[工程纵深](reliable-engineering.md)，结合[数据工程](data-engineering-foundations.md)理解证据和可重跑。examples/search-lab只用人工合成公开fixture，无付费模型调用。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| R00 | [分词与倒排](../topics/11-search-ai/tokenization-and-inverted-index.md) | 候选集合、词频与中文词元分别是什么 |
| R01 | [排序与BM25](../topics/11-search-ai/ranking-and-bm25.md) | 为什么短文可能改变顺序，分数不是概率 |
| R02 | [离线检索评估](../topics/11-search-ai/offline-retrieval-evaluation.md) | 无答案、同义失败与指标分母如何处理 |

下一批R03–R05计划处理检索上下文、结构化输出与受限工作流；此处不代表已实现。浏览器等规划内容完成后统一验收。

[返回知识地图](../knowledge-map.md)
