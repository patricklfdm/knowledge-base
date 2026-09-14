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

下一批补齐文件替换、日志/快照重放和缓存一致性。线程/共享内存不重复写一套：沿[Java线程](../topics/01-languages/java-threads-and-shared-state.md)、[取消](../topics/01-languages/java-tasks-and-cancellation.md)、[测量](../topics/01-languages/java-measurement-and-evidence.md)完成语言侧实验；数据库页/日志边界参见[SQL路线](sql-foundations.md)。

维护例子在examples/systems-basics；目前单机、单写者的教学范围不等于分布式系统或生产保证，浏览器仍待全部规划内容完成后集中验收。个人练习记录留仓库之外。

[知识地图](../knowledge-map.md) · [全栈基础](fullstack-foundations.md)
