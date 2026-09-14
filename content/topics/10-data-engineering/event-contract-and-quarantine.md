---
id: q00-event-contract-quarantine
title: 数据进来以后，怎样区分坏行、重复与冲突？
description: 建立有界JSONL事件契约，以质量报告证明每行数据的去向。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [p08-python-data-pipeline]
topics: [data-engineering, data-quality]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[Python可重跑汇总](../01-languages/python-data-pipeline.md)。本篇完成后，你能写出输入契约，解释拒绝、重复和身份冲突为什么需要不同处理。

## 从一张“收入少了”的报表开始

每天收到一份行程事件文件。有人重发昨天的一行，有人的金额写成小数，还有两行编号相同、金额却不同。如果直接跳过所有异常再汇总，结果看起来很整齐，却无法回答少了哪些数据。数据质量（data quality）首先是把规则与处理结果显式化。

本例一行一个JSON对象，事实粒度是一笔事件：id为唯一标识，route为路线键，minute为从实验起点计算的非负整数分钟，cents为非负整数分。它们是合成字段；minute没有时区含义，cents只代表本练习的一种固定货币。真实多币种或退款需要另一个契约，不能靠这里的非负规则直接接入。

## 语法能读，不表示业务可用

[Python JSON文档](https://docs.python.org/3.13/library/json.html)定义解析入口和object_pairs_hook。我们的decode_event利用后者拒绝重复对象键，避免同一行出现两个cents时悄悄保留后一个。语法解析后再要求恰好四个字段，id/route只含1–32位小写字母、数字或连字符，minute/cents为0–1,000,000之间的整数。

Python中bool是int的子类，因此只用isinstance(value, int)会接受true；这里用type(value) is int。额外字段也拒绝，目的是使本练习的模式演进可见；实际接口选择允许扩展字段时，应同步修改版本规则和下游假设。

| 输入 | 处理 | 原因 |
| --- | --- | --- |
| 首次合法id | accepted | 进入后续汇总 |
| 同id、解析后字段相同 | duplicates | 本批内只产生一次效果 |
| 同id、字段不同 | 整批失败 | 不猜测哪个版本是真实意图 |
| 非UTF-8、坏JSON、范围或字段错误 | rejected | 保留行号与原因，不输出原始行 |

比较的是解析后的事件，JSON空格或键顺序变化不产生新事件。编号只在这份输入的命名域中解释；多个生产者应设计不会碰撞的标识。隔离清单不含原始值，也不构成保密存储方案；真实个人数据不能放进本仓库。

## 运行维护例子

使用固定CPython3.13.0、Node24.21.0，配置KB_PYTHON可选择解释器路径。[完整代码与测试](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/data-pipeline)中的fixture有5行：3个唯一合法事件、1个完全重复、1个minute=true的坏行。

```sh
npm ci --prefix examples/data-pipeline
npm test --prefix examples/data-pipeline
npm run batch --prefix examples/data-pipeline
```

batch显式允许1条拒绝记录，实测quality为rows=5、accepted=3、duplicates=1，rejected含第5行integer range。因此每次成功检查都满足：输入行数=接收数+重复数+拒绝数。身份冲突不会返回一份“成功质量报告”；调用者必须处理整批失败。

输入最多65,536字节、100行，每行最多512字节。空文件是0行；一个单独换行是一条坏行；末尾用于结束最后记录的换行不额外增加空行。整个字节串先限长再解析，防止把“边读边处理”误解成无资源约束。

## 从隔离到发布还有一道门

质量检查记录坏行不等于允许发布。Q02的publish默认max_rejected=0；本例演示显式设为1。超额时旧版本继续可读。这个阈值是实验决策，不是通用数据质量标准。金额合法但现实含义错误、上游整份文件漏发等问题，字段规则并不能发现。

练习：让e1第二次出现时金额改成999，再预测accepted是否还会返回。提示：实现会整批抛identity conflict，而不是把冲突计入普通坏行。再增加一条合法0分事件，检查行数守恒和金额总数为何会出现不同变化。

本篇通过真实示例与失败断言复核，来源在线核对；浏览器、真实上游接入 **NOT_RUN**。去重目前只在一批内，持久重放留后续篇章。下一篇：[汇总粒度](analytical-grain-and-dimensions.md)。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
