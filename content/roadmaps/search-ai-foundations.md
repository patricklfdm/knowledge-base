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
| R03 | [上下文与引用](../topics/11-search-ai/retrieval-context-and-citations.md) | 怎样追溯原句，字符预算没覆盖哪些成本 |
| R04 | [输出与证据契约](../topics/11-search-ai/structured-output-and-evidence.md) | 合法JSON为何仍可能不可信 |
| R05 | [受限工作流](../topics/11-search-ai/bounded-ai-workflow.md) | 谁决定重试，资料能否扩大动作权限 |

R00–R05有限主线已实现；没有真实模型调用、收费或生产搜索服务。浏览器等规划内容完成后统一验收。

## 综合自测

从查询词元追到候选、排名、指标与失败样本，再追到原文片段和输出契约。故意更改引用、复用旧上下文、减少调用预算，分别预测失败位置。说明每个测试证明的边界，不把抽取式引用、合成标注和假adapter当作真实模型效果。个人学习结果留仓库外。

[返回知识地图](../knowledge-map.md)
