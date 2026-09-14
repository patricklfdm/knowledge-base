---
id: s08-sqlite-backup-restore
title: 备份文件能打开，就证明恢复成功了吗？
description: 用活跃WAL主文件反例和正式备份，分别核对结构、关系与业务结果。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [s07-sql-savepoints]
topics: [sql, storage]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

程序已经把两笔费用提交成功。你复制了一个.sqlite文件，发现它能打开，integrity_check也报告ok，于是认为备份齐全。先复习[读快照与WAL](sqlite-read-snapshots.md)：提交的数据可能还保存在WAL文件里，单看主文件可能遗漏最近记录。

## 复现一份结构正常却过时的副本

backup-restore.mjs只在自己的临时目录创建库。实验切换WAL并关闭自动检查点，写入100，再明确执行一次TRUNCATE检查点把这一版落进主文件。接着写入并提交200，保持源连接打开，不执行新的检查点。

此时仅复制主文件到一个新名称。这个错误对照恢复出的费用是[100]，integrity_check仍为ok；原库却有[100,200]。完整性检查回答的是数据库结构是否符合检查规则，不知道业务上本来应该有几条记录。

WAL是数据库持久状态的一部分。复制活跃文件时若遗漏它，可能丢失已提交事务；随意分别复制主文件和WAL也不能自动获得一致的组合。[SQLite WAL维护规则](https://sqlite.org/wal.html)说明了相关约束。本例主文件恰好可打开，不意味着所有错误复制都只会安静丢一行。

## 使用数据库支持的备份入口

```js
import { backup } from "node:sqlite"
await backup(db, target)
```

这里db必须仍打开，target是本实验新建目录里的目标路径。await成功后才开始恢复检查；不要在Promise尚未结束时发布“备份完成”。目标已存在时会被覆盖，因此维护演示不接收个人路径。Node封装的是SQLite Online Backup API，行为核对[固定版本文档](https://github.com/nodejs/node/blob/v24.21.0/doc/api/sqlite.md)和[SQLite备份接口](https://sqlite.org/backup.html)。

本例源库在备份期间没有继续写入；使用了支持在线工作的API，不等于验证了持续并发写入下的完成时间或快照时刻。另把目标指向自己临时目录下不存在的子目录，实测Promise拒绝，源库两条数据不变。失败不等于任何半成品目标都可交付；正式系统应有候选文件、验证和发布的流程。

## 恢复验证要走到业务结果

维护verifyRestore以只读方式重新打开副本，检查三层：integrity_check为ok、foreign_key_check无结果、费用按id排序得到[100,200]。随后再启动一个全新的Node进程，从磁盘打开这份副本，确认同样的结果；原进程缓存不是恢复证据。

只检查条数仍可能漏掉金额错误，所以断言比较实际有序内容。实际产品还应按业务设计版本、关键关系、校验和或抽样规则，不要把本例两行断言叫作完整灾备方案。损坏场景也不能靠“尽量读取成功”就宣布恢复完成。

## 练习与边界

练习：将第二筆金额改为300，先列出错误主文件副本、正式备份和新进程恢复的三组预期，再运行；不要只修改条数检查。再把备份目标设为演示自身创建的无效路径，验证错误不会被当作成功，避免把目标换成真实资料目录。

这里没有关闭机器电源、模拟损坏磁盘、加密备份、异地存储或恢复时限测量，也没有把备份文件发布到网上。所有连接与自建目录在finally清理。进程退出、文件复制、数据库完整性和业务可恢复是不同层次的证据。

到此，SQL主线从表/约束、关系汇总、事务、索引、写竞争和快照，走到查询组织、保存点和可核对的恢复。回到[SQL路线](../../roadmaps/sql-foundations.md)做综合任务，再继续通用系统的文件与日志边界；没有宣称所有数据库产品均已覆盖。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/sql-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips)。

```sh
npm ci --prefix examples/sql-trips
npm run advanced --prefix examples/sql-trips
npm test --prefix examples/sql-trips
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
