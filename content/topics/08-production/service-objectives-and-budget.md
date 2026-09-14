---
id: e08-service-objectives-budget
title: 错误预算怎样帮助判断可靠性，而不掩盖失败？
description: 先定义观察事件和分母，再用整数边界与恢复实验解释服务目标。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e07-restore-release-evidence]
topics: [slo, reliability]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[恢复与发布证据](restore-and-release-evidence.md)。目标：给一组事件写出可复现的指标定义，并识别“看起来达到99.9%”背后的盲区。

## 先定义成功，再写百分比

服务指标SLI是对行为的测量，服务目标SLO是在明确窗口中对指标提出的目标。百分比没有事件、窗口和观察位置，就难以比较。[Google SRE的SLO实践](https://sre.google/workbook/implementing-slos/) 强调从用户所依赖的服务行为出发选择指标。

本实验沿用E05的有限服务器指标：在一次测试进程生命周期内，路由模板为`/notes/:id`且触发response finish的响应为eligible；其中5xx为bad。ready和未知路由不进入分母，401/404/412作为已处理请求进入分母但不计服务端失败。它测的是“已完成便笺响应中无5xx的比例”，不是端到端可用性承诺。

客户端断开、根本没到服务器的请求和finish前崩溃可能未被计入。因此要描述用户体验，还需要客户端/边缘观察、任务成功或延迟指标。不能为了得到漂亮数字，把这些缺口解释成成功。

## 用一个窗口演算预算

假设本练习目标99.9%，一次窗口有1000个eligible，最多允许1个bad。两个bad意味着超出预算；999个eligible、1个bad也没有达到99.9%。这不是统计置信结论，只是给定完整有限计数的比例比较。

[budget.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/reliable-app/budget.mjs)用basis point（基点，1/100个百分点）表达目标9990，再用BigInt整数除法向下取整允许失败数：

```js
const allowedBad = Number(
  BigInt(eligible) * BigInt(10000 - targetBasisPoints) / 10000n
)
```

这里10000对应100%。先转BigInt再乘，避免安全整数输入相乘后越过Number精确范围；允许失败数不会大于eligible，转回Number仍在已校验范围。实际goodRatio仅供展示，是否超标按整数数量比较，避免浮点边界产生差一条的判断。

输入必须是非负安全整数，bad不能大于eligible。零流量返回unknown，allowedBad、remaining和goodRatio均为null，不伪造“100%可靠”。目标100%时允许失败数为0，并不承诺系统可以实现绝无故障。

## 分母也需要反例

维护测试输入便笺200、500、412，以及ready200、未知路径404。正确计数是eligible=3、bad=1；加入大量健康检查不能稀释业务错误。另一方面，本定义把412视作服务端正常拒绝，并不代表用户完成了编辑任务。若产品关注“成功保存”，就应另定义含业务结果的指标，不偷偷修改这条指标的口径。

运行`npm test --prefix examples/reliable-app`可复现上述计数及0/999/1000边界；operations demo还输出1000条中1次失败时`state:within, allowedBad:1, remaining:0`。这些1000条是确定性合成计数，不是发起了1000次线上压测，也没有真实用户流量。

## 预算耗尽以后怎么行动？

错误预算是团队在可靠性与变更之间制定政策的依据；超标后可以优先修复、缩小变更或暂停某类发布，但具体例外和恢复条件需要明确约定。[Google SRE错误预算政策示例](https://sre.google/workbook/error-budget-policy/) 展示了这种制度化用法。本实验只计算和解释，不自动冻结GitHub部署，也不改变用户持续自动push授权。

计数器重启归零，最近100条日志也不是历史窗口数据库。若要做滚动窗口，必须规定事件时刻、迟到、去重、窗口边界和保存方式，不能把累计计数减几次就当通用实现。后续分布式与数据专题会继续处理这些问题。

## 综合迁移练习

先跑operations观察正常排空与恢复。再在自己的测试副本把依赖改成超时，预测500/504计数、关闭期间503和恢复后的计数生命周期。最后拿到一份缺bob的结构正常备份：即便服务目标计算显示within，业务恢复检查也必须拒绝。

提示：指标、关闭、恢复回答不同问题。写一份简短实验记录，包含故障条件、预期计数、实际退出/状态、恢复清单和未验证边界；不要把“预算还有余额”当作允许丢数据的理由。

E00–E08教学主线的本机证据已齐：React结构/控制器、HTTP授权/并发、进程关闭/新进程恢复与预算。真实浏览器、屏幕阅读器、生产流量和灾备 **NOT_RUN**，不因此宣称整个知识库或生产能力验收完成。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
