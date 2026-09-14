---
id: y05-log-snapshot-replay
title: 有了快照，为什么还要检查日志的序号？
description: 用单写者计数日志重建状态，验证重复覆盖、截断尾部和错误裁剪顺序。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [y04-file-publication-boundaries, s08-sqlite-backup-restore]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

程序把每次金额增量写进日志，运行一段时间后保存快照，以免重启时从第一条重算。先理解[文件发布](file-publication-boundaries.md)和[备份恢复](../06-data/sqlite-backup-restore.md)：快照存在不代表它与剩余日志正确衔接，也不代表数据已经经过业务核对。

## 一份明确的小型恢复协议

本教学日志每行是一个JSON记录，只有seq和delta两个字段；序号从一开始连续递增，增量是安全整数。快照只有seq和value，记录已经纳入状态的最后序号及总值。初值为{seq:0,value:0}。

```text
日志：{"seq":1,"delta":10}
      {"seq":2,"delta":5}
      {"seq":3,"delta":7}
快照：{"seq":2,"value":15}
恢复：{"seq":3,"value":22}
```

appendRecord编码完整一行，追加并调用fsync后返回；调用者负责单写者顺序，它没有自动协调多个进程或分配唯一序号。replay复制输入快照，然后顺序解析日志，不修改原快照对象。一次恢复输入上限64 KiB，不是无限日志的恒定内存引擎。

## 已覆盖记录跳过，未覆盖记录连续应用

若日志仍包含序号一和二，它们已经包含在快照中，因此不能再次加到value。序号三必须紧接快照序号二，才可以应用。维护代码还检查日志本身的相邻序号，拒绝重复或中间跳号，并检查累计值没有超出JavaScript安全整数范围。

本例“跳过已覆盖前缀”是依赖可信快照的重放规则，不代表任何重复请求都能自动幂等。写日志后还没收到成功确认时，盲目再追加同一序号会在后续重放时被拒绝；appendRecord本身只校验单条格式，不能阻止重复记录落盘。调用者需要先重新读取状态确认结果。真正的请求去重、跨进程协调和原子提交不在这个格式中。

SQLite也依赖日志与检查点维持恢复，但它的WAL保存数据库页且有专门格式与协议；这里的JSON增量不是SQLite WAL，不能混用。[SQLite WAL说明](https://sqlite.org/wal.html)。事务日志的硬件假设与失败测试比这一小例子更复杂，参见[SQLite原子提交](https://sqlite.org/atomiccommit.html)。

## 先发布快照，再考虑移除前缀

快照仍为零却只留下序号三的日志，恢复器会发现缺口。如果先发布包含一、二的新快照，再保留完整旧日志或仅留下三，两种组合都恢复为22。测试实际覆盖这三个组合，从而展示裁剪顺序的意义。

这还不足以成为任意故障下的多文件事务：没有实现自动日志轮转、并发写入裁剪、校验和或可信清单。旧快照配上完全丢失的最后一条日志，若没有后续序号暴露缺口，本例也无法凭空知道曾经还有一条；必须保留独立的确认/完整性证据。

## 尾部坏了，不能偷偷当成功

本协议要求每条记录以换行结束。缺少最后换行、非法JSON、错误字段类型、重复/跳号和金额溢出都被拒绝。即使最后一行JSON语法完整，没换行也按本协议视为不完整；这是明确格式约定。

结构检查不等于内容真实性。把一个delta改成另一个合法整数，程序仍可能正常恢复成错误业务值；快照若被合法格式篡改也一样。本文没有伪造能检测全部损坏的保证，更不会自动删掉报错记录来“修复”真实数据。

## 迁移练习

把序号三的增量改成−2，先预测恢复值；再从快照零开始只提供序号三，应报缺口。随后删除最后换行，对比语法正确与协议完整的差异。最后改变裁剪顺序，画出每一步进程退出后磁盘上两份文件可能的组合，再说明哪些组合可安全恢复。

真实演示输出recovered为序号三/值22，发布前故障后snapshotPreserved仍是序号二/值15。所有操作位于自建目录，结束删除；未测机器断电或生产日志。下一篇处理另一份派生状态：[缓存与延迟旧读](cache-invalidation-races.md)。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run storage --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
