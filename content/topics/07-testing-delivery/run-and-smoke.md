---
id: f13-run-and-smoke
title: 怎样启动、停止并检查一个教学应用？
description: 固定环境和数据路径，用只读HTTP冒烟检查本机服务，区分应用运行与Pages教材发布。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f12b-add-note-migration]
topics: [deployment, operations, testing]
tags: [delivery]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-12
---

难度 **L0** · 先修：[字段扩展与迁移](add-note-migration.md) · 目标：固定运行环境和数据库路径，启动/停止教学服务，解释只读冒烟能发现的问题与部署证据边界。

核验：独立包安装、本机服务启动/停止、新进程读取与HTTP冒烟通过。公网动态服务、生产恢复和浏览器 **NOT_RUN**；其中浏览器按用户批准集中验收。

## 运行程序需要哪些明确条件？

F11应用有三项关键条件：Node版本、运行源码、数据库文件路径。Node24.21.0提供本例实际使用的HTTP/SQLite接口；package-lock固定包安装，本例没有npm依赖，但仍保留独立manifest和锁。不要从“本机默认node能运行”推断CI或另一台机器也相同。

[trip-app README](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-app) 的基本检查是：

```sh
cd examples/trip-app
npm ci
npm test
npm run demo
```

demo自行清理合成数据库。它证明运行步骤可重复，不是需要常驻的服务，也不会替你部署公网后端。

## 启动时明确数据放在哪里

在自己的终端创建新教学目录：

```sh
kb_app_dir=$(mktemp -d)
npm start -- "$kb_app_dir/trips.sqlite"
```

终端打印 `http://127.0.0.1:实际端口`，随机端口由系统分配，不要复制教材里的示意文字当真实URL。数据库路径是启动参数；未给路径会报错，不会默默打开某个用户数据库。

Ctrl+C后服务关闭、连接释放，文件保留。在同一shell再次执行npm start并传相同路径，读取相同库；如果换成另一个新文件，得到空表并不奇怪。路径变更与数据丢失是两个需要分别检查的问题。

实验结束且服务停止后，只清理自己本次创建的目录。备份与恢复是另一个工程步骤，本篇没有授权或执行用户数据库删除，也没有提供生产清库命令。

## 冒烟检查要看内容，不能只看200

冒烟检查（smoke test）是启动后少量关键检查，帮助快速发现服务未就绪或指错地址。保持服务运行，在第二个终端进入同一示例目录，将打印的真实URL传入：

```sh
npm run smoke -- http://127.0.0.1:实际端口
```

此处URL是占位示意，必须替换。smoke只允许本机HTTP：检查页面200和表单标记、app.js类型和模块内容，再GET列表确认返回数组；它不创建、修改或删除行程。空库的成功输出是 `HTTP smoke {"pages":2,"rows":0}`，有记录时rows随库内容变化。

本轮还启动了一个始终返回200但内容是普通文字的错误服务，smoke实际失败，CLI退出1。它证明检查不只是端口可连接。测试也确认对正常空库运行后列表仍为空。

通过只读冒烟，不能宣布创建、修改、数据库约束或浏览器交互都正确：写入路径由集成测试验证，真实浏览器留集中验收。当前客户端没有认证、生产监控、磁盘保护或完整超时重试策略。

## Pages发布的是哪一个程序？

知识网站由Quartz把content转换成静态HTML/CSS/JS，再上传GitHub Pages；教学应用需要运行Node进程并访问SQLite文件。GitHub官方将[Pages定义为静态网站托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。把源码推送到同一个仓库，不会使Pages自动运行serve.mjs。

本仓库已有publish工作流：同提交quality通过后build，build通过后deploy。检查一次发布要核对提交SHA、该SHA的必需门禁和Pages结果，再做线上HTTP文本检查。推送成功、构建成功、部署成功是不同证据，未运行的UI也不会因此变为PASS。

## 失败时先缩小范围

| 现象           | 先核对                                   |
| -------------- | ---------------------------------------- |
| 无法启动       | Node版本、参数、父目录、第一条错误       |
| 请求连不上     | 进程是否仍在、是否使用本次打印端口       |
| 200但不是页面  | URL是否指向别的服务、内容类型与正文      |
| 新进程列表空   | 是否同一数据库路径，演示是否已清理临时库 |
| CI绿但线上旧文 | 是否同SHA部署完成、页面内容是否更新      |

启动器打印监听地址，错误通过stderr暴露；这满足本机诊断，不等于结构化生产日志。恢复发布时应使用已验证源码重新走门禁；代码回退也不自动回退数据库结构。本篇没有执行生产回滚或灾难恢复。

## 练习：服务没变，文件变了

先在一个临时数据库创建一条记录，停止服务，再用另一个新文件启动。预测列表，然后回到原文件读取。本轮隔离实测：新文件条数0，原文件条数1；不能只根据空列表断言原数据被删除。

基础路线现在把语言、表单、HTTP、SQL、测试与运行串了起来。后续验收仍要记录哪些路径是真实运行、哪些仅有源码、哪些受授权延期，不能用文章数代替学习成果。

继续内容支线：[SQL建模与查询深入路线](../../roadmaps/sql-foundations.md)。

[返回全栈路线](../../roadmaps/fullstack-foundations.md)
