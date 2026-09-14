---
id: d00-timeout-unknown-outcome
title: 没有收到响应，为什么不能断定操作没发生？
description: 用丢请求和丢响应两个故障位置解释部分失败与未知结果。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [e05-safe-observation-deadlines]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[等待预算与可观测性](../05-backend/safe-observation-and-deadlines.md)。读完能区分“客户端停止等待”和“服务器没有提交”，画出一次操作的故障位置。

## 先说实验中的系统是什么

分布式系统由通过消息协作的独立执行单元构成。独立意味着一方可能继续工作，另一方却收不到消息；这类部分失败不能用单个函数的返回值完全表达。本实验只研究请求和响应遗漏，排除恶意节点、数据篡改、时钟同步及机器断电。

场景是创建一条合成便笺：客户端发送意图，服务器修改状态，服务器返回结果。三个步骤之间存在空隙。连接失败或超时只能告诉客户端“在当前观察范围内没有得到结果”，不能单独确定失败发生在哪个空隙。[AWS幂等API设计](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) 用类似的资源创建困境解释重试为何可能重复产生副作用。

## 两段历史，一样的表面现象

| 故障位置 | 服务端操作次数 | 客户端观察 |
| --- | --- | --- |
| 请求在交付前丢失 | 0 | no response |
| 操作完成，响应交付前丢失 | 1 | no response |
| 请求和响应都交付 | 1 | 得到结果 |

[transport.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/distributed-lab/transport.mjs)把两种丢失都表示成UnknownOutcome。测试知道注入的位置，因此可以检查服务端计数0或1；真实调用者通常没有这个全知视角。不能把测试夹具知道的故障标签当成真实客户端必然知道的信息。

这段维护代码是确定性遗漏模型，不是真实socket超时：

```js
if (fault === "request-lost") throw new UnknownOutcome("no response")
const result = operation()
if (fault === "response-lost") throw new UnknownOutcome("no response")
return result
```

模型通过明确交付边界研究协议语义，避免靠随机sleep碰运气。它不测网络延迟、不证明某种代理或TCP实现行为。实际进程退出与SQLite恢复会在本路线后半段独立验证。

## 取消并不能倒转历史

给客户端设置超时可以限制等待资源；发出abort可以请求合作取消。但如果服务器已经提交，停止等待不会自动撤销它。补偿操作也可能失败，并非把时间倒退。[HTTP幂等方法语义](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods) 讨论了哪些请求可以基于其语义重试；方法名本身不能替代应用对副作用的正确实现。

重试未经保护的“计数加一”，响应丢失后再执行一次，计数会成为2。测试实际覆盖这个错误对照。相反，查询当前状态可以减少不确定性，但查询本身也可能读到旧副本；不能把“没查到”立刻等同于“从未创建”。

## 运行与解释

仓库固定Node24.21.0，在根执行：

```sh
npm ci --prefix examples/distributed-lab
npm test --prefix examples/distributed-lab
npm run requests --prefix examples/distributed-lab
```

本包无第三方依赖。test对两段历史分别断言0和1，还断言未经保护重试为2。requests demo使用下一篇的幂等账本，输出attempts=2、rows=1、id=1、simulatedWaitMs=5；5是注入时钟累计的模型等待值，不是机器实测耗时。例子关闭内存库；文件测试仅清理自建临时目录。

## 改变一个条件

练习把丢失点放在“读取结果之前、状态已经提交之后”。预测客户端是否能区分它与原响应丢失，然后设计返回文案。提示：可以说“结果尚未确认，请按同一请求标识查询或重试”，不能直接说“创建失败，请重新创建”。

本模型适合讨论未知结果和重试前提，不覆盖网络拥塞、分区检测或失败概率。模型与本机SQLite测试已运行；真实网络丢包、浏览器与生产系统 **NOT_RUN**。下一篇：[让重复意图只创建一条记录](idempotency-ledger.md)。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
