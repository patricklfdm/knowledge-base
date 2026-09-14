---
id: e05-safe-observation-deadlines
title: 接口失败时，怎样留下可定位又不过量暴露的证据？
description: 用请求标识、路由模板、结果计数和等待预算解释服务端故障。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e04-conditional-update-migration]
topics: [observability, timeout]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[条件更新与迁移](conditional-update-and-migration.md)。目标：把一次500与日志对应起来，解释超时为何不等于任务已经停止。

## 不需要复制整个请求才知道发生了什么

有人报告便笺读取失败。若只写“error”，难以关联；若把headers、URL和body全部记录，会把会话、查询词和正文带入日志。本例每个请求生成requestId并放入x-request-id响应头，结束时记录五个白名单字段：requestId、route、method、status、durationMs。

route记录`/notes/:id`模板，既不记录具体id，也不记录query；未知方法归为OTHER，未知路由归为unmatched。服务端异常message不直接返回客户端。本实验测试使用SECRET字样作为合成哨兵，确认响应和日志不含它或临时token。[OWASP日志指导](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) 解释了敏感信息排除、事件语义和访问保护。

这是白名单设计，不是通用脱敏器。生产日志仍需权限、保留策略、容量与故障处理。例子的events只保留最近100条，计数独立累计；重启全部清空，不宣称持久审计或完整分布式追踪。

## 记录结束还是记录开始？

服务器在响应finish时记录status与耗时。Node的finish表示响应数据交给底层发送机制，不证明客户端已接收或业务使用成功；客户端中途断开也可能没有finish事件。[Node HTTP对应版本文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/http.md) 说明了事件边界。因此本例计数只描述已完成响应，不能冒充用户端成功率。

durationMs用单调经过时间计算；测试只要求非负，没有固定毫秒阈值。排查顺序是用requestId找到路由和状态，再看受控错误类别与相关依赖，而不是从一条日志猜根因。

## 有界等待管哪一段？

读取前调用一个可替换的异步依赖。withDeadline用Promise.race让等待与定时器竞争，到期发出abort并拒绝，服务器将其映射为504；普通依赖异常是500。正常完成后清除定时器，避免遗留计时资源。

预算只覆盖这次异步依赖等待，不覆盖请求体读取、全部数据库工作或整个请求。示例另给HTTP头与正文设置接收超时；正文只保留最多1024字节，超过后读完并拒绝。它不是经过公网慢连接防护验收的服务。

JavaScript计时器依赖事件循环，同步CPU循环会阻塞它；DatabaseSync接口也是同步的，见[Node SQLite版本文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/sqlite.md)。所以把同步工作放进Promise不等于可被计时器抢占。对CPU隔离、线程或进程取消应回到[进程接口](../02-foundations-tools/process-interfaces.md)和Java取消实验。

## 请求超时后还能自动重试吗？

本例依赖没有外部写入，测试可安全模拟永不完成的Promise。若真实依赖已经扣减或写入，客户端超时只表明等待截止，不能推导“没有副作用”。重试需要幂等策略、总预算和限次；不要用无限循环掩盖暂时失败。abort是合作信号，忽略它的任务可能仍存在；本例测试中的无资源pending Promise不等于生产资源已清理。

## 运行与计数

运行`npm test --prefix examples/reliable-app`及backend demo。真实HTTP中故意让依赖抛含哨兵的错误，收到500和requestId；日志route为模板、status为500，eligible=1、bad=1。再请求ready，业务计数不变。另让依赖永不完成，得到504并确认abort信号；正常依赖返回7，错误不能被包成成功。

此处eligible包含便笺路由所有完成响应，bad只数5xx；401/404/412不是服务端失败。这是一种受限服务端指标定义，不代表所有用户任务成功。下一批会用同一计数讨论服务目标与观测盲区。

练习在响应已发送后让客户端不消费body，判断服务端finish计数能否证明用户看到了内容。再把query拼进日志，加入含合成敏感词的请求并使测试失败。提示：状态和字段检查必须同时存在，只有日志JSON可解析不能证明没有泄漏。

源代码、真实HTTP、预算与日志白名单已核验；公网负载、真实用户、追踪平台及浏览器 **NOT_RUN**。运行启停和恢复留后续批次。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
