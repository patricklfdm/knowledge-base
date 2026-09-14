---
id: y06-cache-invalidation-races
title: 已经删除缓存，旧值为什么还会回来？
description: 固定异步读写交错，验证失效代次与LRU容量，并明确当前调用和后续缓存的不同保证。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [y05-log-snapshot-replay]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

行程摘要先查缓存，没有再查数据源。更新成功后删除缓存，下一次理应读新值，但一个更早开始、尚未完成的旧读可能最后返回，把旧值重新填回缓存。先理解[进程与异步边界](stream-boundaries.md)以及[状态恢复](log-snapshot-replay.md)：派生状态必须有清楚的更新协议。

## Cache-aside有两份状态

旁路缓存（cache-aside）由应用负责：读缓存未命中时加载数据源，再回填；写数据源成功后使相应缓存失效。数据源和缓存不是同一个事务，删除操作与并发读之间仍有竞争。微软的[Cache-aside模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)明确讨论了一致性与更新顺序，本篇用单进程合成数据实际固定其中一种交错。

不要把“加一个过期时间”当作即时一致性保证。TTL至多影响旧数据可能留存多久，也需要时钟、刷新和业务容忍条件。本例没有实现TTL，更没有连接Redis或生产数据库。

## 固定一个延迟返回的旧读

cacheRace让读A先捕获old，再等待一扇Promise门。主流程等它发出started信号，才把源数据改成new、调用invalidate并由读B缓存新值。随后打开A的门，让它最后返回old。

如果所有未命中结果都无条件回填，A会覆盖B刚写入的new。这个过程没有线程同时执行JavaScript语句，也依然有异步逻辑竞争；不应只在多线程程序里寻找竞争条件。

## 用代次阻止过期回填

维护LocalCache保存一个单调增长的BigInt代次epoch。开始加载时记住当前代次；任何invalidate都递增它并删除对应键。加载返回后，仅当代次没有改变时才回填：

```js
const epoch = this.#epoch
const value = await load(key)
if (epoch === this.#epoch && value !== undefined) {
  // 更新本例Map，并按容量移除最久未访问条目
}
return value
```

这是维护方法中的核心片段，完整的值验证和淘汰见cache.mjs。使用全局代次比较保守：另一个键失效也会让旧加载不回填，可能多查一次，但避免维护无限增长的每键版本表。本例只缓存不可变字符串或有限数字，不共享任意可变对象。

**A原来的调用者仍会收到old。** 我们保证的是这个旧结果不会重新污染后续缓存，并没有把已经开始的读取升级成最新值读取，也没有宣称线性一致。需要更强读写契约时，要在数据源版本、重试或串行化等层面继续设计。

## 容量是条目数，不是总内存上限

LocalCache用Map维护最近访问顺序：命中先删除再插入，插入超容量时淘汰最早的键，这是本例的LRU（Least Recently Used）策略。测试容量二时读取a、b、a、c，再读b，实际加载顺序为a、b、c、b，说明b被淘汰而a的命中刷新了顺序。[ECMAScript Map规则](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map.prototype.set)规定了插入和迭代顺序，LRU策略由本例组合实现。

条目数量限制不限制字符串长度，也不限制同时等待中的加载任务。这个类没有请求合并、背压、分布式失效通知或跨进程共享。loader失败不回填；undefined表示缺失并不缓存，因此两次缺失会调用两次数据源。空字符串则是合法值，不能用真假判断替代has。

## 验证与迁移练习

实测交错结果是oldCaller=old、fresh=new、cached=new。另有容量边界、失败后重读、非法可变值与缺失行为的断言。独立副本取消epoch比较时，旧读回填会让原测试失败；不是靠增加sleep制造偶然现象。

练习：先画出A捕获、写成功、失效、B回填、A返回五个动作。把A返回移到失效之前，预测结果；再讨论更新失败时是否应该先宣称缓存代表新值。给缓存增加TTL前，写出允许旧值多久、哪些调用必须强读、怎样验证这些承诺。

到此，[通用系统路线](../../roadmaps/systems-foundations.md)从工作量和进程/字节流走到了文件、恢复与派生状态；分布式复制、共识与生产可观测性仍由后续里程碑承担。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run storage --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
