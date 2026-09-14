---
id: r02-offline-retrieval-evaluation
title: 搜索例子能跑通，怎样证明它还会在哪些问题上失败？
description: 用固定合成标注集计算Precision、Recall与倒数排名，并分开评估无答案查询。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [r01-ranking-bm25]
topics: [search, offline-evaluation]
tags: [search-ai]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[词法排序](ranking-and-bm25.md)。目标：给指标写清分母、比较口径与失败样本，而不是从一次正确搜索推导系统可靠。

## 先记录问题与“什么算相关”

[queries.json](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/search-lab/queries.json)由本实验人工编写，包含3条dev和4条eval查询。每条有稳定id、split、query与相关文档id列表。这个合成集很小，不能代表真实用户分布，也不是独立专家或外部机构标注。

dev用于理解与开发，eval用于固定参数后的检查。本例参数没有调优。验证器拒绝重复id、未知/不可见相关文档，以及分词规范化后词元集合相同的重复查询；但它不能自动发现所有语义近似问题或标注偏见，因此分割规则不能当作完全消除了数据泄漏。

## 三个指标在问不同问题

本例只在有答案的查询上计算：Precision@k=前k槽位中相关数/k；Recall@k=召回相关数/所有标注相关数；RR@k=前k中第一条相关结果排名的倒数，无命中则0。最后对查询取算术平均，RR均值在此记为截断MRR。

[Stanford对Precision与Recall的解释](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-unranked-retrieval-sets-1.html)说明了两者不同分母。本例Precision@k即便只返回1条也用k作分母，这是前k槽位口径，不是“已返回列表的精确率”。

例如k=2，返回wrong、yes，相关标注为yes和missing，三项都为0.5；只返回yes时Precision@2仍0.5。重复结果id直接拒绝，不能让yes出现两次骗出两次命中。

## 无答案不能除以零后悄悄补成满分

relevant=[]的查询单独评价：返回空列表算本例正确不返回，非空算错误候选。它不加入有答案查询的Recall/MRR分母。这个规则只判断检索阶段是否给出候选，不是LLM拒答质量；词元偶然重合仍可能给出无用结果。

```sh
npm test --prefix examples/search-lab
npm run evaluate --prefix examples/search-lab
```

固定CPython3.13.0，输出方法、k=2、规则版本、语料/标注摘要、逐条结果与聚合指标。overlap与BM25在这份eval上的实测一致：

| 查询 | 标注 | 实际top结果 |
| --- | --- | --- |
| 失败 回滚 | sql-transaction | sql-transaction |
| 水位线 迟到 | stream-late | stream-late |
| 撤销未落盘变更 | sql-transaction | 空列表 |
| 火星天气 | 无答案 | 空列表 |

3条有答案查询的宏平均Precision@2=1/3、Recall@2=2/3、MRR@2=2/3；1条无答案正确不返回，1/1。这些数值来自维护入口的实际运行，不能包装成“搜索准确率100%”。同义改写失败保留在报告里，不能因为拉低平均数而删掉。

## 没有提升也是有效结果

R01已经证明长度归一化能改变构造例子的顺序，但这份eval并没有因此提升指标。两件事并不矛盾：某个机制有效运作，不等于目标数据上的效果必然改善。语料、问题和相关性标注都很小，均值相等更不能证明两种方法普遍等价。

要扩展评估，应先增加有代表性的真实授权或合成问题类别、模糊/否定/多答案情况，再比较同一分割上的方法。不要看到eval失败就加一条专门规则，然后继续把这份集合称未见测试；它此时已参与开发，需要另留新的评估集合。

练习新增一条相关文档数量为2的查询，并构造只召回其中1条的结果，手算Recall。再加入一个无答案但词元能命中资料的查询，观察单独的无答案指标下降。提示：增加样本后记录新摘要和样本数，旧比例不再适用。

本篇真实指标、分母反例、规范化重复查询与空split失败已验证；人工微型标注不是用户项目实绩。浏览器、真实模型、线上流量与统计显著性 **NOT_RUN**。下一篇：[上下文与引用](retrieval-context-and-citations.md)。

[返回搜索与AI应用路线](../../roadmaps/search-ai-foundations.md)
