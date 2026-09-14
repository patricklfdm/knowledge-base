---
id: roadmap-systems-foundations
title: 通用系统与存储学习路线
description: 从操作成本、进程和字节流走到文件发布、日志恢复与缓存一致性。
note_type: navigation
status: seed
draft: false
publish: true
tags: [engineering]
---

从[模块与错误](../topics/01-languages/modules-and-errors.md)开始；进程单元另接[Java运行时](../topics/01-languages/java-process-and-memory.md)，流式单元先理解[异步等待](../topics/01-languages/async-and-promises.md)。只使用合成数据与自建临时资源。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| Y01 | [查找与成本模型](../topics/02-foundations-tools/search-cost-model.md) | 解释有序前提、边界、预处理和probe增长 |
| Y02 | [进程调用边界](../topics/02-foundations-tools/process-interfaces.md) | 区分cwd/env、字节流、退出码与协议成功 |
| Y03 | [流式解码与背压](../topics/02-foundations-tools/stream-boundaries.md) | 任意切块不丢字符，正确传播超限和下游失败 |
| Y04 | [文件发布边界](../topics/02-foundations-tools/file-publication-boundaries.md) | 区分rename前后失败、可见结果与持久性 |
| Y05 | [日志与快照恢复](../topics/02-foundations-tools/log-snapshot-replay.md) | 验证序号衔接、裁剪顺序和截断拒绝 |
| Y06 | [缓存失效与旧读](../topics/02-foundations-tools/cache-invalidation-races.md) | 固定延迟回填竞争，解释代次、LRU及保证范围 |

这条H5通用系统主线覆盖Y01–Y06。线程/共享内存不重复写一套：沿[Java线程](../topics/01-languages/java-threads-and-shared-state.md)、[取消](../topics/01-languages/java-tasks-and-cancellation.md)、[测量](../topics/01-languages/java-measurement-and-evidence.md)完成语言侧实验；数据库页/日志边界参见[SQL路线](sql-foundations.md)。

维护例子在examples/systems-basics；目前单机、单写者的教学范围不等于分布式系统或生产保证，浏览器仍待全部规划内容完成后集中验收。个人练习记录留仓库之外。

[知识地图](../knowledge-map.md) · [全栈基础](fullstack-foundations.md)

## 综合迁移练习

在自己的临时目录依次完成：先为一个已排序序列预测查找probe，再启动子进程接收合成输入并核对退出/协议；将文本按任意字节切分处理，模拟下游失败；随后发布小JSON快照，分别在rename前后中止，核对磁盘结果；使用连续日志恢复状态，最后固定延迟旧读验证缓存没有被污染。

每一步写明输入、预期、实际、错误证据与清理范围。CPU耗时、内存占用、文件可见性、物理持久性和业务一致性各自需要证据；不要把本例的单机观察延伸为所有系统保证。
