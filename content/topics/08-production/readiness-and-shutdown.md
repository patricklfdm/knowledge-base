---
id: e06-readiness-shutdown
title: 服务收到停止信号后，怎样处理已经接下的请求？
description: 用真实子进程验证就绪状态、停止接单、排空与失败退出。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e05-safe-observation-deadlines, f13-run-and-smoke]
topics: [lifecycle, operations]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[有界等待](../05-backend/safe-observation-and-deadlines.md)、[启动与冒烟](../07-testing-delivery/run-and-smoke.md)。目标：解释“进程还活着”与“可以接新请求”的区别，完成一次有证据的关闭演练。

## 部署更新遇到一个未完成请求

新版本准备接替旧进程，旧进程还有一次读取未完成。立即exit可能断开请求；继续无限接单则永远等不到结束。优雅关闭（graceful shutdown）的本例顺序是：标记draining，拒绝新业务工作，等待已经接收的处理结束，关闭HTTP服务器，最后关闭数据库。

readiness（就绪）回答能否接新业务，liveness（存活）回答进程是否还可运行。暂停接单时进程可以仍然存活。本例只有`/ready`，它根据draining返回200或503，不实现独立存活探针、负载均衡器注册或数据库健康探测。它在迁移完成、监听成功后才通知测试父进程ready。

## 接单和排空是一个小协议

[维护生命周期](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/reliable-app/lifecycle.mjs)保存active计数与draining标记。enter在关闭期间返回false；允许进入才增加active。处理函数finally调用leave，包括401、输入失败和依赖异常；遗漏一条退出路径可能让排空永远等待。

```js
enter() { if (draining) return false; active++; return true }
```

idle在active归零时兑现。beginDrain可以重复调用，close复用同一个关闭Promise，防止多次停止重复释放资源。计数覆盖服务器请求处理函数，不代表所有忽略abort的外部工作已消失；E05的限制仍然适用。

本例排空期间保留监听，使既有连接和新连接的业务请求都收到503；排空后才调用server.close并关闭空闲连接。Node对关闭监听、活动和空闲连接有具体语义，见[HTTP版本文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/http.md)。不应把“调用了close”直接理解为所有请求已经完成。

## 真正发送一次SIGTERM

运行仓库根命令：

```sh
npm test --prefix examples/reliable-app
npm run operations --prefix examples/reliable-app
```

operations启动自己创建的Node子进程，通过IPC（父子进程通信）等待ready消息，发起一条受控读取。收到entered后才发送SIGTERM，随后检查ready=503、新业务=503；再让原读取完成，确认它收到200，最后进程退出0。没有用固定sleep猜服务是否启动，也没有向其他进程发信号。

Node注册SIGTERM监听器后，需要自己安排退出流程；在exit事件里无法依靠异步工作完成清理。[process信号与退出文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/process.md) 说明了这些边界。本例先await关闭再断开IPC，不在普通路径立即process.exit。

## 等不完时不能写成成功

测试还有故意不释放的请求。子进程关闭预算耗尽后以2退出，客户端连接断开，结果明确`graceful:false`。这是强制终止失败证据；它可能丢弃输出和正在进行的工作，不能称为“所有任务安全完成”。正常演练有5000ms保护预算，强制分支用1000ms；外层15000ms守护只清理自己的失控子进程，不将时间差当性能指标。

应用层定时器不能抢占堵塞事件循环的CPU任务。现实部署还需进程管理器的外部终止预算，并根据业务、代理摘流延迟和最长任务选择时间；本例数值只是短小测试参数，不是生产建议。

## 迁移练习

加入一条故意返回401的请求，验证active最后仍归零；再故意删掉enter的draining检查，预测关闭期间新请求会发生什么。提示：只有ready变503而业务路由继续接单，并未实现关闭协议。独立故意错误测试已检出这类偏差。

Node24.21.0/macOS arm64实际子进程、SIGTERM、HTTP与正常/强制退出均已验证；Windows信号差异、真实代理摘流、容器和浏览器 **NOT_RUN**。下一篇：[恢复验证与发布证据](restore-and-release-evidence.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
