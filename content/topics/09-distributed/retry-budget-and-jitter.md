---
id: d02-retry-budget-jitter
title: 重试怎样同时受次数、时间和语义约束？
description: 用注入时钟验证错误分类、指数退避、抖动和共享预算。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [d01-idempotency-ledger]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[幂等账本](idempotency-ledger.md)。目标：解释哪些失败可重试、何时停止，以及为什么每层各自重试会放大请求量。

## 先问重试有没有意义

字段无效、权限不够或同key不同意图，不会因为原样重发而自动恢复。本例只把UnknownOutcome列为可重试错误；其他错误直接向上传递。对真实服务应按接口契约识别错误类型，不能用“所有异常都重试”统一处理。

重试还要求副作用安全：同一次意图沿用D01的key。若每次循环生成新key，服务器看到的就是多个新请求。maxAttempts=3包含第一次尝试，因此最多额外执行两次；不要把它误解为首发之外再来三次。

## 两个上限一起工作

维护retry.mjs在开始时记录单调时间，每次尝试计算`remainingMs = budgetMs - elapsed`，传给operation。耗尽预算则不再发起新尝试；失败以后若下一次等待已经用尽剩余额度，也停止。

这一调度器**不能抢占operation**：operation若一直不返回，循环也走不到下一次预算检查。真实适配器必须给连接/响应设置适当的剩余时间预算，并处理取消；相关边界见[有界等待](../05-backend/safe-observation-and-deadlines.md)。本例注入的now/sleep只推进模型时钟，没有实现真实网络截止时间。

测试设置总预算10，第一次operation消耗8，下一次拟等待5，于是只尝试一次并抛RetryBudgetExceeded。不能每次失败都重置总预算，否则上层允许等待100ms，下层可能独立等待多轮100ms。

## 退避与抖动解决哪个问题？

固定立即重试会让故障服务承受更多工作。指数退避逐轮扩大等待上界；抖动（jitter）从区间选一个等待，减少一批客户端同时重试的机会。本例公式是：

```js
const delay = Math.floor(
  Math.min(capMs, baseMs * 2 ** Math.min(attempt - 1, 52)) * jitter
)
```

jitter必须在[0,1)内。base=10、cap=40，固定样本0.5时前两次等待为5和10。测试注入0.5只是为了可复现；真实随机源需要合适分布，单个固定样本不能证明请求已均匀分散。额外限制指数避免无意义的数值增长，cap仍是本例等待上限。

[AWS SDK重试机制文档](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html) 解释了分类、次数、退避、抖动和重试配额的组合。该文档有具体SDK与版本前提，本例借鉴概念，自行定义短小实验参数，不安装SDK、不采用其云服务默认值。

## 请求量不能无限叠加

如果三层调用各允许三次尝试，一次顶层请求最坏可能触发3×3×3次底层尝试，而不是简单相加。这个27是条件成立时的推导，不是压测结果。实践中要决定由哪一层负责重试、如何传播预算，以及是否需要重试配额或限流；幂等解决重复副作用，不消除重复请求消耗。

本例没有熔断器、令牌桶、Retry-After解析或对服务过载的自适应调节。它只是让错误分类、次数、等待和总预算的决策可单独验证，不能宣称已提供通用生产重试库。

## 实验结果与练习

运行`npm test --prefix examples/distributed-lab`。两个响应连续丢失、第三次交付时，attempts=3、等待[5,10]、业务行仍为1；永久错误只调用一次；可重试错误耗尽次数不额外sleep；传给下次operation的预算从100降为95。非法次数和非法随机样本被拒绝。

requests demo只丢一次响应，所以输出attempts=2、rows=1、simulatedWaitMs=5，与上述三次尝试测试是不同夹具。不要把模型等待当作真实响应耗时。

练习把每次operation的成本改为7，总预算20，仍用固定0.5。先手算每次发起时剩余额度，再写断言。提示：第一次失败后等待5，第二次开始仅剩8，第二次再消耗7后就没有下一轮10的等待空间。所有模型与SQLite断言已运行，真实网络/负载与浏览器 **NOT_RUN**；后半路线继续检查跨进程交付与恢复。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
