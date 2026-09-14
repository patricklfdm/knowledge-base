---
id: q03-event-time-watermarks
title: 事件发生得早，为什么到达时已经算迟到了？
description: 用确定性到达顺序解释事件时间、窗口、水位线和迟到策略的结果差异。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [q02-batch-manifest-publication]
topics: [data-engineering, stream-processing]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, SQLite 3.47.1, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[批次发布](batch-manifest-publication.md)。目标：分别说清数据“何时发生”“何时被处理”，并预测乱序输入在窗口模型里的去向。

## 报表正在更新，旧事件却刚到

路线a在第10分钟产生100分事件e1，第80分钟产生200分事件e2；第20分钟产生的300分事件e3因为上游延迟，排在e2之后才到达。如果等到确认未来再无旧事件才展示结果，等待可能没有尽头；如果尽快关窗口，就得安排迟到数据的处理路径。

事件时间（event time）来自事件自身时间戳，处理时间（processing time）来自处理系统时钟。到达顺序也不等于任一种时间排序。[Beam窗口与水位线说明](https://beam.apache.org/documentation/programming-guide/#watermarks-and-late-data)讨论了这些区别与迟到处理。本实验只借概念建立Python模型，没有安装或测试Beam SDK。

## 把本例的规则写到能算出来

每个窗口宽60分钟，采用[start,end)；单源水位线W从-1开始，观察到新的唯一合法事件后更新为max(原W, 已见最大minute−10)。10是本例允许乱序的估计间隔，**不是**“迟到后再宽限10分钟”。本例没有额外allowed lateness。

处理当前事件前，若它的窗口end≤当前W，则归入late清单，不再修改汇总；否则纳入窗口。随后更新最大时间与W。完全重复的id先去重，既不再次加金额也不改变既有late判断；同id不同字段失败。

这一规则比较窗口结束时间，不是简单比较event.minute<W。例如W=80时minute=65属于仍开放的[60,120)，本模型接受它；minute=59属于已关的[0,60)，拒绝进入在线汇总。测试覆盖恰好W=60与窗口end=60的边界。

## 手工走一次，再看实际输出

[维护fixture](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/data-pipeline/stream.py)依次为e1(10,100)、e2(80,200)、e3(20,300)、重复e2、e4(90,400)，括号内是分钟和分。

| 到达 | 处理前W | 决定 | 处理后W |
| --- | --- | --- | --- |
| e1 | -1 | 纳入[0,60) | 0 |
| e2 | 0 | 纳入[60,120) | 70 |
| e3 | 70 | 窗口已关，记late | 70 |
| 重复e2 | 70 | 去重跳过 | 70 |
| e4 | 70 | 纳入[60,120) | 80 |

```sh
npm test --prefix examples/data-pipeline
npm run stream --prefix examples/data-pipeline
```

固定CPython3.13.0、内置SQLite3.47.1；stream还演示一次真实进程中断，恢复细节见Q04。实测最终watermark=80，late=[e3]，duplicates=1；[0,60)汇总100分、final=true，[60,120)汇总600分、final=false。

## “final”只对选定策略成立

final表示按本策略窗口已经关闭。它不表示现实世界绝无遗漏；e3就是反例。有限输入读完也不会强制把W推进到无限大，因此最后一个窗口仍标未封口。示例模拟一段持续源的到达历史，读完整个fixture不等于真实业务周期结束。

真实多个分区需要考虑各分区进度、空闲分区、时间戳异常等；直接用所有事件最大时间可能让快分区压过慢分区。本例限制为单份不可变有界输入，只验证规则，不声称提供无限流处理器或真实分区水位线实现。

## 练习：排序为什么会改变结论？

先按minute排序再用全新检查点运行，预测e3是否还迟到。测试实际观察到排序后的汇总为1,000分、late为空。这不能修复一个已运行的真实在线系统，因为排序需要知道未来；它适合有限批次重算。

再把一个未来时间异常但仍在字段范围内的事件放到最前面。提示：它可能提前推动W，把更多后到事件判迟到。字段范围正确不代表时间戳可信，需要独立来源质量规则。

水位线是明确规则的确定性模型；CPython/SQLite例子、边界、乱序和重排断言已运行。真实broker、时钟同步、Beam运行器、浏览器 **NOT_RUN**。下一篇：[检查点与重放](checkpoint-and-replay.md)。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
