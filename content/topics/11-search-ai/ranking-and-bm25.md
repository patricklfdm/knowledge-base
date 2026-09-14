---
id: r01-ranking-bm25
title: 都命中了关键词，为什么短文和长文需要不同分数？
description: 对比重合词元基线与BM25式评分，解释词频饱和、稀有度和长度归一化。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [r00-tokenization-inverted-index]
topics: [search, offline-evaluation]
tags: [search-ai]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[词元与倒排索引](tokenization-and-inverted-index.md)。目标：逐项解释一条检索分数，不把分数当作答案正确率。

## 先建立一个能解释的基线

最简单的overlap基线只数“多少个不同查询词元出现在文档中”。查询x，两篇文档都含x，便打平。它不关心某篇是否重复x十次，也不关心整篇有两词还是两千词。打平时按id排序只是稳定规则，不代表id较小的更相关。

BM25类词法评分进一步考虑三个量：词在文档里出现次数tf、包含该词的文档数df、文档长度L。这里的长度是R00分词器产生的词元数，不是原文字数。[Stanford BM25说明](https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html)讨论了词频饱和与长度归一化。

## 本例使用哪一个变体？

实现将每个不同查询词元的贡献相加：

```text
idf = ln(1 + (N - df + 0.5) / (df + 0.5))
contribution = idf × tf × (k1 + 1)
               / (tf + k1 × (1 - b + b × L / average_length))
k1 = 1.2, b = 0.75
```

这里N、df和平均长度都只来自当前可见文档。采用加1的正值idf变体，语义和固定参数参考[Lucene 9.12.3 BM25Similarity文档](https://lucene.apache.org/core/9_12_3/core/org/apache/lucene/search/similarities/BM25Similarity.html)。这不是声称本机运行了Lucene；维护程序是Python参考实现，也不承诺分数与Lucene引擎逐位相等。

稀有词通常有更高idf；tf从1增加到2能增加贡献，但不会无限线性增长；长度归一化使很长文档不能仅靠更大篇幅获得同样的短词命中优势。具体相关性仍需评估，短文并非天然优于长文。

## 观察一次能解释的排序变化

```sh
npm test --prefix examples/search-lab
npm run search --prefix examples/search-lab
```

[维护测试](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/search-lab/tests/test_retrieval.py)构造a-long正文“x加十个y”和z-short正文“x”，共同标题为test。查询x时overlap都为1，按id让a-long在前；BM25式评分使z-short在前。这说明长度项确实影响了结果，不是只给同一输出换个名称。

实际search入口对合成语料搜索SQL索引，返回两种方法的id和浮点分数，以及corpus_sha256和规则版本。测试不依赖浮点字符串的固定展示位数，而断言顺序、相同输入重跑一致、文档列表倒序后索引身份与结果一致。

## 几个常见误读

查询词元在本例被去重，因此“索引 索引”不会加倍加权。这是明确的短查询选择，不是所有搜索系统都忽略查询词频。

标题和正文只简单拼接参与计数，没有实现标题额外权重或多字段模型。BM25分数也不是0到1概率，不能解释成“文档有90%可能正确”，更不能当作下游回答置信度。

相同分数按id排序使输出可复现；它解决排序不稳定，不能解决相关性歧义。词元不相交时仍然无法召回R00的同义改写问题。需要更复杂模型之前，应保留这个简单基线，判断新增复杂度究竟修复了哪类失败。

## 练习与验证边界

练习给短文增加与查询无关的词，预测何时可能失去长度优势。提示：看L变化，而不是只看tf。再将一条internal文档加进语料，要求公开结果分数保持不变，以验证过滤时机。

参数在实验前固定，没有在评估集上挑选最优值。修改k1/b或分词规则后应更改版本并重新评估，不能只展示一次成功查询。本篇示例在CPython3.13.0真实运行，排序对照与失败路径通过；浏览器、Lucene服务、向量召回与真实性能 **NOT_RUN**。下一篇：[离线评估](offline-retrieval-evaluation.md)。

[返回搜索与AI应用路线](../../roadmaps/search-ai-foundations.md)
