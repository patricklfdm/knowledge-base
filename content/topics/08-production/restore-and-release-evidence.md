---
id: e07-restore-release-evidence
title: 恢复数据库后，还要验证哪些业务和发布条件？
description: 把活跃库备份、新进程恢复、所有权与写入检查连接起来。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e06-readiness-shutdown, s08-sqlite-backup-restore]
topics: [recovery, deployment]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[关闭协议](readiness-and-shutdown.md)、[SQLite备份基础](../06-data/sqlite-backup-restore.md)。目标：区分备份生成、数据库可打开、业务已恢复和新版本已发布四种状态。

## 一份能打开的文件仍可能不完整

先修已演示仅复制活跃WAL主文件可能遗漏提交。本篇继续问：恢复出的数据是否保留身份归属与更新版本，应用能否用新连接读取并继续写？不再重复实现另一套备份工具。

[operations.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/reliable-app/operations.mjs)只在自己mkdtemp目录建库。它启用WAL，种下alice/bob两条便笺，先把alice更新到revision=2，再用Node backup接口生成snapshot。源连接保持打开，随后复制已经完成的snapshot为restored。SQLite支持的备份机制保证一份一致数据库副本，见[SQLite Backup API](https://www.sqlite.org/backup.html)；具体Node接口和返回约定按[锁定版本文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/sqlite.md)核验。

这里允许复制已完成且不再写入的snapshot，不是鼓励分开复制活跃主库和WAL。snapshot和restored都不是用户既有文件，源库和备份在演练期间不会被覆盖。

## 把恢复交给一个新进程

父进程记录确定的业务清单，包括两行的id、owner、title和revision，按id排序。子进程以只读模式打开restored，先确认结构版本2和integrity_check=ok，再逐字段比对整个清单。只有检查全部相等才继续。

完整性检查无法知道“本来应有bob那行”。测试故意删除恢复副本中的bob记录，结构检查仍ok，但清单对比使新进程非零退出。这是刻意构造的错误备份，并未损坏仓库或任何真实数据库。若清单也来自已经缺失数据的副本，二者一致仍不能发现丢失，所以清单来源与预期时点需要独立定义。

本例没有关联表，因此不把空的foreign_key_check称为关系覆盖证据；有外键的数据集应增加关系检查。校验项应随着业务不变量变化，而不是固定抄一组命令。

## 只读验证以后再检查应用能否工作

只读连接关闭后，子进程用应用store新建连接，逐个检查正确owner可读，alice不能读bob，再执行一次带旧revision条件的更新。恢复后revision按协议增加，证明这个自有恢复副本可继续写。父进程另外检查live和snapshot仍保留备份前内容及revision=2，恢复演练没有回写源库。

运行`npm run operations --prefix examples/reliable-app`，恢复摘要为`restored:2, ownership:true, writable:true`。全套test还包含“结构正常但缺行”的非零对照。所有资源由finally关闭并删除自建临时目录；不提供对任意生产目录的一键覆盖命令。

## 恢复目标与实测范围

恢复点目标RPO描述可接受的数据损失窗口，恢复时间目标RTO描述可接受的恢复时长。一次两行临时库演练没有模拟磁盘损坏、机房丢失或历史备份链，也没有测得生产RPO/RTO。此处预期清单以备份前已提交状态为准；备份以后发生的新写入不在这份清单里。

若现实恢复发生在备份之后，必须核对丢失窗口、外部系统副作用及会话状态。本例会话在内存Map中，恢复SQLite不会恢复会话，也不会让旧token自动有效。数据恢复与身份系统恢复是不同问题。

## 发布也需要独立证据链

代码提交、CI通过、构建完成、部署完成、线上入口可读都不同。本知识库实际门禁按同一完整SHA串联quality、Build、Deploy，再做页面、资源、索引与404的HTTP检查；具体提交回执保存在工程报告，而不是把历史成功当当前发布成功。Pages只发布静态教材，不运行这个Node数据库服务。

练习把预期清单的revision仍写成1，解释为何行数和标题正确仍应拒绝。再设想恢复后启动的是旧代码：即使数据库检查通过，接口契约与迁移兼容是否也需要验收？提示：把“恢复验证”和“发布版本验证”列成两条证据，不能由一个成功退出码互相推导。

本机备份/新进程/所有权与可写性已验证；生产恢复、容器部署、云灾备、浏览器 **NOT_RUN**。下一篇：[服务目标与错误预算](service-objectives-and-budget.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
