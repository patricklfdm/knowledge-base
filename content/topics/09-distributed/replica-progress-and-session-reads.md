---
id: d04-replica-progress-session-reads
title: 刚写入的数据，为什么换一个副本就看不见了？
description: 用单一有序流区分提交、复制、应用和带最低版本的读取。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [d03-outbox-consumer-replay]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[事件投递与重放](outbox-and-consumer-replay.md)。目标：解释复制延迟造成的旧读，知道最低版本令牌能提供什么，以及不能提供什么。

## 写成功与所有副本可读之间有间隔

权威端已接受更新，不代表每个副本都应用了它。异步复制允许提交后再传输和应用；读请求转到落后副本，可能得到旧值。[PostgreSQL流复制说明](https://www.postgresql.org/docs/current/warm-standby.html#STREAMING-REPLICATION) 展示了现实数据库中提交与备库可见性之间的区别。本例未安装或测试PostgreSQL，引用仅用于机制对照。

实验建立A、B两个内存副本，共享一个假设已确定顺序的事件流。sequence是权威序号，不是机器时间戳。事件1把标题设为old，事件2改成new；A应用到2，B只到1。B直接read()仍返回old，这不是程序随机坏掉，而是读取契约允许旧数据。

## 进度必须表示连续应用到哪里

[replica.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/distributed-lab/replica.mjs)记录applied。只有收到applied+1才推进；先收到2而缺1时抛gap并保持0。如果只把进度更新为见过的最大序号，就会把尚未应用的缺口伪装成已完成。

同一sequence同内容重复交付时忽略；同sequence不同内容抛冲突，不能随便选一个。模型保留history以检查这些重复，不实现历史压缩、快照或内存上限。返回rows时重新创建数组与行对象，调用方不能通过修改返回值改变副本内部状态。

实际复制系统需要定义日志域、故障恢复和冲突处理；本模型假设顺序已经可靠建立，不实现选主或共识算法。把数组排好序不能代替分布式共识。

## 给读取附一个最低要求

客户端若已经知道提交版本2，可以调用read(2)。副本应用进度小于2就抛NotCaughtUp，而不是返回旧值并贴上“成功”。应用可以有界等待、改读合适节点或明确提示暂时无法提供这个版本；本实验选择立即拒绝。

```js
if (minimum > applied)
  throw new NotCaughtUp("required version unavailable")
```

B应用事件2以后，read(2)返回new。等待这一条件可能降低暂时的可用性，但不会用旧读满足一个明确要求新版本的请求。minimum=0表示不附带额外要求，结果可能落后。

## 会话令牌不是全局一致性

会话中的“读己之写”要求后续读取至少包含自己已经完成的写入；单调读要求不要在已经读到较新进度后退回更旧进度。在这个单流模型里，可携带已知版本的最大值作为minimum。测试从A读到版本1再切到空B：不带令牌读到空，带令牌被拒绝。

这不是线性一致性（linearizability）的完整实现。令牌只限制本会话已知下界，不保证读取包含其他客户端在本次读取开始前已经完成的所有写入。[etcd API保证](https://etcd.io/docs/v3.6/learning/api_guarantees/) 对线性化读取、可能陈旧的读取及watch顺序分别给出约束，可用来比较不同契约。

跨分片没有一个天然可比较的全局sequence；failover若丢失已确认日志，也不能靠携带旧令牌“制造”数据。这里没有证明分区期间所有请求都可用，更不能简单推出所有CAP讨论中的结论。

## 实验与练习

运行本路线test和delivery入口。断言B先返回old、read(2)失败，补上事件后与A相等；乱序缺口及冲突重复都不推进进度。独立副本删掉minimum检查，原“落后读取必须失败”的断言会失败。

练习让A应用到3、B到2，客户端先观察到A的3，再从B读取。写出带令牌和不带令牌两条历史，并决定界面如何提示拒绝。提示：把minimum重置成当前副本的applied会掩盖退步，不能提供单调读。

确定性复制模型已运行，实际网络复制、PostgreSQL/etcd进程、leader选举、浏览器 **NOT_RUN**。下一篇：[租约与旧持有者](lease-and-fencing.md)。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
