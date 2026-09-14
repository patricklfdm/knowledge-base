---
id: q05-backfill-reconciliation
title: 批次与在线结果差了300分，该怎样补数并证明没补两次？
description: 按相同粒度对账金额与计数，用完整版本替换补数，并明确状态与输入上限。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [q04-checkpoint-replay]
topics: [data-engineering, stream-processing]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, SQLite 3.47.1, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[检查点与重放](checkpoint-and-replay.md)。目标：把策略差异和计算错误分开，给出可重跑的修正结果，而不是看到差额就盲目再加一次。

## 先统一比较口径

Q03的在线窗口把e3列为迟到：100+200+400=700分。Q00质量规则却认为e3完全合法；有限输入批次会保留所有4个唯一事件，合计1,000分。这300分差异由迟到策略解释，不能仅凭“批流不一致”判断哪份程序坏了。

对账（reconciliation）先确认源、事件身份、过滤口径、窗口粒度和金额单位。程序在相同(route,start)键上比较期望批次与在线汇总，同时比较count和cents。如果只比较金额，漏掉一条0分事件会看起来完全正确；维护测试专门覆盖这种反例。

## 把差异定位到分组

[reconcile实现](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/data-pipeline/stream.py)对输入先执行质量检查，任何坏行使对账失败，避免坏数据静默消失。接着全量去重汇总，取两边分组键的并集逐组比较；实际多出的组会产生负差额，不会因只遍历期望键而漏掉。重复的输出分组键也拒绝。

```sh
npm test --prefix examples/data-pipeline
npm run reconcile --prefix examples/data-pipeline
```

固定CPython3.13.0，实测stream_cents=700、corrected_cents=1000；delta只有start=0、route=a一行，count_delta=1、cents_delta=300，repeat_same_contents=true。这个报告不是性能测量，数字由5行合成输入决定。

## 补数为什么用完整替换？

补数（backfill）在本例中是：使用完整不可变输入重算期望窗口，发布到新的generation，清单核对后切换CURRENT。它复用[批次发布](batch-manifest-publication.md)的版本边界；这里发布的是整个小快照，不宣称已经实现大型分区级合并。

如果把300直接加到在线700上，重跑一次又会加300，除非额外设计修正账本。当前选择完整结果替换：同源同规则的重复补数生成同样清单和报表内容，总额仍1,000。旧在线检查点不修改，它仍能解释为什么当时看到700；修正快照与在线运行记录是两种证据。

[Python os.replace](https://docs.python.org/3.13/library/os.html#os.replace)提供本地指针切换所需操作，但不会自动协调其他读者缓存或跨系统发布。实际大型系统还要决定修正后消费者怎样得知版本变化；本实验没有连接外部下游。

## 资源约束是结果可信的一部分

| 限制 | 行为 | 代价 |
| --- | --- | --- |
| 输入65,536字节、100行、单行512字节 | 超限拒绝/按质量阶段处理 | 只能演示小数据 |
| 默认100个唯一id | 新id超限时回滚当前行 | 去重历史不自动丢弃 |
| 默认20个路线×窗口组 | 新组超限时回滚当前行 | 已关闭组也占空间 |
| 变更输入或策略 | 拒绝复用旧检查点 | 新检查点需完整重算 |

测试把max_seen降至2，处理第三个唯一事件失败，position停在2；把max_groups降至1，第二个窗口失败，position停在1。此前提交的数据仍可检查。上限配置也写入检查点，不允许随意改个数值就接着跑不同策略。

关闭窗口并不意味着可以删除seen。删除之后若旧事件再次到达，可能被当成新事件。实际清理要协调可重放范围、源保留期和补数规则；本例保留全部状态到TemporaryDirectory生命周期结束，明确限制数据规模，不冒称可长期运行的无限流。

## 迁移练习与验收范围

练习将e3金额改为0。提示：金额差额变0，但count_delta仍为1；补数是否必要由业务语义决定，测试至少不能失去这一信息。再为实际结果加入一条不存在于源的分组，预测负差额。最后重复运行补数，检查内容相等而非generation名字相等。

Q00–Q05连接了质量→有界批次→发布，以及同一领域事件的在线策略→事务重放→批次修正。它们使用Python标准库和一个本地SQLite，没有安装Spark/Flink/Beam、建设云管道或测量集群性能。六篇来源与运行入口已复核；这些外部运行器、生产数据、断电、浏览器 **NOT_RUN**。后续领域进入搜索与AI应用工程。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
