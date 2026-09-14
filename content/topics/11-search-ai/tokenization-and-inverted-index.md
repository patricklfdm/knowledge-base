---
id: r00-tokenization-inverted-index
title: 中文搜索先要解决什么，倒排索引里存的又是什么？
description: 用有界合成语料观察规范化、双字词元、词频与倒排候选集合。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [p08-python-data-pipeline]
topics: [search, offline-evaluation]
tags: [search-ai]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[Python可重跑数据汇总](../01-languages/python-data-pipeline.md)。目标：把文本变成可查找的词元，并解释搜索不到时应该先检查哪一层。

## 同一个SQL，为什么可能匹配不上？

用户输入全角ＳＱＬ，资料写半角SQL；用户输入“索引查询”，资料里只有“索引”。直接比较完整字符串会漏掉这些情况。检索前要决定怎样规范化文本、切分词元，以及怎样让查询与文档走相同规则。

本例先做Unicode NFKC规范化，再casefold处理大小写；相关函数语义见[Python unicodedata](https://docs.python.org/3.13/library/unicodedata.html)。这种处理可能合并原本形式不同的字符，所以原文仍保留用于展示，不拿规范化后的文本代替引用证据。

## 一个刻意简单的中文切分器

维护tokens把连续英文/数字作为一个词元，把基本汉字区间的连续中文拆成相邻双字词元（bigram）。例如“ＳＱＬ 索引查询”得到sql、索引、引查、查询；单独一个“库”保留为单字。标点只作边界，不跨标点拼接。

这不是语言学分词器：“引查”未必是一个词。它也没有覆盖所有Unicode汉字扩展区、同义词、繁简转换或词义消歧。使用这个规则，是因为读者可以完全预测输入如何映射到索引，而不是因为它代表最佳中文搜索方案。

## 从逐篇查找换成词元查文档

倒排索引（inverted index）保存token→文档id集合；另保留每个文档的词频Counter。词元在一篇文档出现两次，在倒排集合里仍只有一个id，但词频为2。二者服务不同用途：集合找候选，词频帮助排序。[Stanford信息检索教材](https://nlp.stanford.edu/IR-book/html/htmledition/a-first-take-at-building-an-inverted-index-1.html)介绍了这种构建过程。

本例查询使用词元集合的OR语义：任意词元命中即可成为候选，不实现布尔查询解析、短语位置或高级查询语法。没有词元或没有交集就返回空列表，不把任意热门文档凑到结果里。

## 运行小语料

[examples/search-lab](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/search-lab)使用CPython3.13.0标准库、Node24.21.0桥接，无外部依赖。corpus.json六条记录全部为新写的合成教学摘要，覆盖索引、事务、JSON、超时和迟到；第六条internal记录仅测试可见性规则，也不是真实私密资料。

```sh
npm ci --prefix examples/search-lab
npm test --prefix examples/search-lab
npm run search --prefix examples/search-lab
```

search对“SQL索引”运行两种排序，第一条均为sql-index。测试还验证“火星天气”无结果、全角SQL归一化、倒排集合与词频不同、重复文档id失败，以及改变输入文档后旧Index副本不被连带修改。

## 先过滤，再截取前几条

维护代码先限定public文档集合，再计算候选、词频统计与top-k。若先取前两条再删除internal，可能把可见结果挤出去；让不可见文档影响统计也会改变公开结果的分数。测试加入一条internal记录，要求公开搜索结果和分数都与只含公开资料时相同。

这只是固定可见性字段的本地实验，没有用户认证、多租户授权或生产权限服务。仓库中的internal标记不是保密机制；真实秘密仍必须在整个仓库之外。底层示例Index对象也不是对外接口，程序调用者可以访问其合成fixture。

## 边界与练习

最多24篇，标题80字符、正文512字符、查询128字符、top-k最多5。文档与索引规则的规范化JSON摘要记录版本身份，不是数字签名；本例每次从fixture重新构建内存索引，不声称实现增量索引发布。

练习把“失败回滚”换成“撤销变更”，先列出两边词元交集。提示：没有共享词元时，后续再精巧的词频排序也无法召回它。再给同一文档重复一个词，观察倒排集合不变而Counter改变。

真实词元、候选、可见性与上限断言已运行；浏览器、Quartz搜索替换、真实语义模型与生产权限 **NOT_RUN**。下一篇：[排序与BM25](ranking-and-bm25.md)。

[返回搜索与AI应用路线](../../roadmaps/search-ai-foundations.md)
