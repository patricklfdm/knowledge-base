---
id: f11b-page-api-feedback
title: 页面怎样提交行程，并准确展示保存结果？
description: 将表单转换、HTTP请求、列表刷新和编辑状态串起来，区分保存失败与保存后刷新失败。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f11a-persistent-trip-api]
topics: [forms, fetch, integration]
tags: [frontend]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64, Codex In-app Browser]
verified_on: 2026-09-12
---

难度 **L0** · 先修：[持久化创建与修改接口](../05-backend/persistent-trip-api.md)，路线已含F07表单与F08HTTP · 目标：解释页面从输入到保存、刷新列表的完整流程，并区分失败发生在哪一步。

核验：页面模块语法、控制器与真实HTTP组合、受控失败分支已通过。2026-09-13补充Codex内置浏览器实测：键盘提交、创建/编辑/非法输入、取消清空与焦点、纯文本显示、忙碌恢复和新进程读回通过，见[交互验收报告](https://github.com/patricklfdm/knowledge-base/blob/v5/reports/H4-ui-acceptance.md)。真实屏幕阅读器、其他浏览器，以及下文“保存成功但刷新失败”的浏览器故障分支仍NOT_RUN；后者已有受控非浏览器测试。此次局部补验不刷新整篇verified_on。

## 页面和接口要从同一个地址开始

[trip-app完整示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-app) 的server提供 `/` 页面和 `/api/trips` 接口。浏览器模块使用相对路径；来源（origin）由协议、主机和端口共同决定。[MDN同源策略](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy) 解释了为什么另一个端口也算不同源。

启动方式见示例README：用mktemp创建自己的教学目录，再将其中的新数据库路径传给npm start。终端打印本次URL；不要直接用file方式打开HTML，也不要以为Pages教材地址会运行这个Node服务。集中验收使用自建临时数据库与真实本机页面，不运行在Pages上。

服务仅监听127.0.0.1随机端口，接受当前Host和匹配的Origin，无Origin的本机CLI可用；固定静态白名单不提供数据库或服务源码。这是教学范围限制，不是登录认证、完整CSRF防护或公网部署方案。

## 一次提交经过哪些文件？

| 文件               | 负责的事情                        |
| ------------------ | --------------------------------- |
| web/app.js         | 读取DOM、注册事件、用文字显示结果 |
| web/fields.js      | 文字天数转数字，检查字段          |
| web/controller.js  | 安排保存与刷新，管理busy状态      |
| web/client.js      | fetch、HTTP状态、JSON编码解码     |
| server/input/store | 服务端重新校验并落库              |

DOM适配层在submit时preventDefault，避免默认整页表单跳转。新增时editing为null，修改按钮将某条行程填回表单并保存其id；提交分别调用POST或PUT。取消修改清空表单、更新提示并把焦点移回目的地，不删除数据库行。

控制器接收api和view两个对象：api负责请求，view负责busy/message/rows/saved这些显示动作。测试可以记录view调用而不创建浏览器，这证明控制流程，不证明真实页面布局或焦点表现。

## 忙碌状态不是服务端幂等

提交先设置busy；一次任务未结束时，第二次load或save直接返回false。DOM适配禁用输入和按钮，finally恢复。这避免同一控制器同时发两次创建，但无法阻止另一窗口或其他客户端重复POST。

字段校验失败时不发送请求、不清空表单；保存请求成功后才调用view.saved清除编辑状态。列表展示用textContent，不把目的地拼入innerHTML；输入中像HTML的文字也应作为文字显示。[MDN textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) 描述了这种文本赋值。浏览器实测目的地`<b>海湾</b>`原样显示为文字，列表没有生成b元素。

## 保存和刷新是两次不同请求

控制器的顺序是先POST/PUT，再GET列表。第二步失败不能抹去第一步成功的事实，核心处理摘录如下：

```js
view.saved()
try {
  view.rows(await api.list())
  view.message("已保存并刷新列表")
} catch {
  view.message("已保存，但列表刷新失败；请点击刷新，不要重复创建")
}
```

如果统一捕获后只显示“保存失败”，用户可能重发POST，数据库就多一条。测试注入“create成功、list失败”，确认saved已调用且提示是已保存；没有把刷新失败当成数据库回滚。

如果保存请求本身断网，客户端也未必知道服务端是否已写入。提示要求先刷新确认结果；本例没有幂等键、自动重试或断线恢复。HTTP错误、坏JSON和网络拒绝分别由客户端测试覆盖，不能只看fetch是否抛错。

## 练习：保存成功后，让列表读取失败

在自己的控制器测试副本中，让create兑现成功，让list抛出错误。先预测三个结果：saved是否调用、提示是什么、busy最终是否false。参考结果：已重置编辑状态，显示“已保存，但列表刷新失败”，busy恢复false。

再让create本身拒绝，saved不应调用，原输入可继续保留；提示说明要确认结果。维护测试已覆盖这两种分支和pending时拒绝重复操作。它没有模拟真实DOM事件，因此不要把这项测试称为浏览器端到端验收。

下一篇：[测试边界与回归](../07-testing-delivery/test-boundaries.md)，再做字段扩展与运行检查。当前应用已接通，完整可靠性、生产部署和集中UI验收仍有边界。

[返回全栈路线](../../roadmaps/fullstack-foundations.md)
