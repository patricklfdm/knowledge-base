---
id: d05-lease-fencing
title: 租约过期以后，旧持有者为什么仍可能写入？
description: 用持久化epoch守卫验证延迟写入的隔离，并说明发号与资源端检查的边界。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [d04-replica-progress-session-reads]
topics: [distributed, failure-model]
tags: [distributed]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[复制进度与读取保证](replica-progress-and-session-reads.md)。目标：画出旧持有者暂停、新持有者工作、旧请求晚到的顺序，并解释为什么只在客户端检查锁不够。

## 锁失效不会让旧进程消失

租约（lease）让某项权利在有限时间内有效，需要按服务协议续约。持有者可能暂停很久，租约已经过期，但恢复以后仍继续执行旧代码；它发出的旧请求也可能在网络中延迟。新持有者已经修改资源后，旧请求晚到就可能覆盖新结果。

“发送前检查我是否持锁”与“目标资源执行写入”是两个时刻，中间仍可暂停或失效。分布式锁实现和会话处理有自己的协议，例如[ZooKeeper锁配方](https://zookeeper.apache.org/doc/current/recipes.html#sc_recipes_Locks)；拿到协调服务的锁并不自动使任意外部资源参与该协议。

## 把代次带到真正执行写入的一侧

fencing在这里指资源端根据持有代次拒绝过旧请求。假定一个可信权威每次授予新持有者时给出严格递增epoch，资源保存已接受的最大epoch。请求携带epoch；资源在同一条条件更新里比较并写入：

```sql
UPDATE resource SET epoch=?,value=?
WHERE id=1 AND epoch <= ?
```

[维护fence.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/distributed-lab/fence.mjs)用同一个传入epoch绑定第一和第三个参数，受影响行数为1才成功。比较不能在客户端完成后再无条件写入；本地数据库原子条件更新是这个实验实际验证的边界。

[Chubby论文第2.4节](https://research.google.com/archive/chubby-osdi06.pdf) 描述了把锁代次相关sequencer传给资源服务器，由接收方验证并拒绝过期请求的思路。本例只实现最小整数代次守卫，不是Chubby sequencer格式、锁服务或身份认证的复刻。

## 守卫何时生效？

先让epoch=1写入，再让2写入，最后1晚到，最后一次返回false，资源仍保存2的值。相同epoch的再次写入允许通过，因为本例允许当前持有者多次更新；因此它也不提供同一持有者内部的请求顺序或幂等性。

特别要注意：资源还没有看到2时，1仍可能通过，即使协调方已经宣布1的租约失效。最大已见epoch只能防止已知更高代次之后的旧写入。若需要立刻拒绝所有过期租约请求，还需要更强的授权有效性校验或交接协议，不能声称一个整数比较已经证明完整互斥。

测试明确保留这个边界：1在2到来之前可重复写；2写成功后1被拒绝。不要把故意允许的前半段删掉，以制造“租约过期立刻安全”的假象。

## 发号和恢复也属于保证条件

epoch在本例由可信测试夹具给定，没有实现租约发号器。生产中若任何客户端可自报巨大数字，就能抢占或破坏后续写入；身份、授权、代次签发与不可回退需要单独协议。单机内存自增器重启归零，也不是可靠的全局发号服务。

资源把最大epoch和value放在同一SQLite行中，关闭再打开自建文件后仍拒绝低代次。若恢复成旧备份，最大epoch可能退回，原保证也会被破坏，必须重新建立安全的代次边界。已有[恢复验证](../08-production/restore-and-release-evidence.md)中的业务不变量检查因此也应包括这种控制元数据。

## 运行与综合练习

运行`npm test --prefix examples/distributed-lab`和delivery入口。得到epoch=2/value=new-holder，旧epoch=1写入被拒绝；另一测试保存7后重开，6仍失败。数字是排序标识，不是秒数，不依赖各机器墙钟一致。

综合练习同时注入三个条件：请求响应丢失、消费提交后进程退出、旧持有者请求晚到。为每一个条件分别选择幂等账本、消费去重或资源epoch守卫，解释为什么不能只靠一个“分布式锁”解决全部问题。提示：它们分别回答意图身份、消费副作用和持有代次，观察边界不同。

D00–D05基础故障实验主线到此完成。真实自有子进程/SQLite与受控模型均已验证；租约权威服务、共识算法、拜占庭故障、真实集群和浏览器 **NOT_RUN**。后续数据处理课程继续讨论重放、顺序和质量规则，不把本路线当作生产协调库。

[返回分布式基础路线](../../roadmaps/distributed-foundations.md)
