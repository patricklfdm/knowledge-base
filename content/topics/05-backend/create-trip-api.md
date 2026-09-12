---
id: f09a-create-trip-api
title: 怎样让一个 POST 请求真正创建行程？
description: 实现路由、服务端编号、201和Location，再读取新行程，明确内存保存与持久化的区别。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f08b-fetch-status-json]
topics: [api, http, backend]
tags: [backend]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[fetch状态与JSON错误](../03-web/fetch-status-and-json.md)，并能理解对象、数组、模块和输入校验 · 目标：创建一条行程，从响应给出的地址读回，并解释数据会在哪里消失。

核验：Node24.21.0，本机真实POST/GET与错误路径已运行。浏览器、页面整合和跨源读取 **NOT_RUN：用户批准移至集中验收阶段**。使用合成数据，不连接数据库或外部服务。

## 方法叫 POST，并不会自动创建数据

F08的服务器对POST返回405，只证明它不支持那个方法。现在要实现一个接口（API）：客户端按约定发送请求，服务器完成操作，再给出可判断的结果。URL、方法、输入格式、输出格式和错误处理一起构成这里的接口契约。

本篇把业务范围收窄到创建与读取：

| 请求          | 本例的行为                             |
| ------------- | -------------------------------------- |
| POST /trips   | 校验JSON，生成编号，在内存数组添加行程 |
| GET /trips    | 返回当前实例的行程列表                 |
| GET /trips/t1 | 返回编号t1的行程，不存在则404          |

相同路径可以支持不同方法，`GET /trips`与`POST /trips`不会执行相同分支。根据方法和路径选择处理代码，这就是这里的路由（routing）。方法不受支持时返回405及Allow，例如集合路径允许GET、POST；既无对应路径也无对应资源时用404。本例没有修改和删除接口，不用空函数占位。

## 先运行完整例子

从仓库根目录执行，使用Node24.21.0：

```sh
cd examples/trip-api
npm ci
npm test
npm run demo
```

[trip-api完整源码](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-api) 有自己的package.json、锁和README，无npm依赖。可以单独复制到其他目录运行，不需要Quartz或旧示例包。demo会启动只监听127.0.0.1随机端口的API，完成操作，关闭该实例，再启动一个新实例观察数据。

实测固定输出如下：

```text
创建 201 /trips/t1
正文 {"id":"t1","destination":"山城","days":3}
读取 200 {"id":"t1","destination":"山城","days":3}
非法输入 422 INVALID_TRIP
条数 1
新实例条数 0
```

这里的“条数1”发生在合法创建和非法请求之后，说明非法请求没有额外写入。“新实例条数0”说明数据随旧实例内存丢失。没有文件、数据库或其他持久化介质，不能把这个结果称为已经可靠保存到数据库。

## 客户端把对象编码为 JSON 正文

demo.mjs中的请求摘录为：

```js
const created = await fetch(api.baseUrl + "/trips", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ destination: " 山城 ", days: 3 }),
})
```

api是startApi返回的对象，baseUrl是本次本机监听地址。method选择POST，body携带正文。JSON.stringify把对象编码成JSON文字；Content-Type声明本次请求正文是JSON，Accept表达客户端希望接收JSON响应。不要把JavaScript对象直接当成已经编码好的网络正文，也不要把Content-Type和Accept的方向弄反。[MDN Fetch请求正文说明](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#setting_a_body) 展示了这些请求选项。

请求中没有合法服务端编号。即便客户端额外提供 `id: "forged"`，服务器也只提取目的地和天数，编号由自己决定，测试已经验证这一点。拣选字段可以避免把未知字段顺手存下来，但它本身不等于鉴权；当前例子没有用户身份或权限系统。

## 服务端在哪一步才真正写入？

server.mjs用Node内置createServer注册请求处理函数。每次HTTP请求带来request和response两个对象，前者提供请求方法、地址、消息头和正文流，后者用于发回状态、消息头与正文。[Node HTTP文档](https://nodejs.org/docs/latest-v24.x/api/http.html) 定义了这些对象和接口。

每次startApi调用创建独立的 `trips = []` 与 `nextId = 1`；处理函数在这次调用的作用域里访问它们。同一实例的多个请求可以读到同一数组，新调用则得到新数组。创建分支的核心摘录是：

```js
const input = await readJson(request)
const fields = parseTrip(input)
const trip = { id: "t" + nextId, ...fields }
nextId += 1
trips.push(trip)
send(201, trip, { Location: "/trips/" + trip.id })
```

readJson先处理正文边界，parseTrip再检查业务字段；任一步抛错都会跳过后面的编号和push。两个辅助函数在下一篇逐步解释。fields只含已确认的destination和days，`...fields`把它们展开到新对象。send是本文件的小函数：设置响应状态/消息头，用JSON.stringify编码响应，最后end结束响应；它不是Node自动提供的全局函数。

先校验再写入有可观察的结果：连续发送非法对象、缺字段、错误类型或越界天数后，列表仍为空，下一次合法创建仍得到t1。单看错误状态不足以证明这一点，所以测试还实际读取列表和编号。

## 201 和 Location 分别提供什么证据？

201表示请求成功创建资源。Location给出新资源的位置，本例是相对路径 `/trips/t1`。客户端用 `new URL(location, api.baseUrl)`把它组合成可访问地址，再发GET读回。201不会强迫客户端自动跳到这个地址，示例显式发了第二次请求。[MDN 201说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201) 描述了创建结果与资源位置。

测试对照创建响应、Location读取结果和列表结果，确认它们是同一条行程。创建成功仍不等于用户之后永远能读到：这个实例一旦关闭，新实例就没有旧数组。编号也会重新从t1开始，因此该编号方案只适合这个教学生命周期。

错误响应在本例中统一为嵌套对象，例如：

```json
{ "error": { "code": "INVALID_TRIP", "message": "天数必须是1到30的整数数字" } }
```

code用于程序识别错误类别，message供人理解；客户端仍先检查HTTP状态，不能只看正文是否有某个字段。错误不返回堆栈；当前没有完整日志/监控机制。下一篇会解释哪些错误用400、413、415或422。

## 练习：同一份 POST 再发一次

在自己的demo副本中，把合法创建请求完整执行两次，再读取列表。先预测编号与条数，再运行。只重新打印第一次响应不算第二次请求。

实测参考：两次得到t1、t2，列表有两条，即使目的地和天数完全相同。本例没有去重或幂等键，不能在网络结果不确定时随意重复创建并假定只会保存一条；自动重试策略留待后续工程专题。[MDN POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST) 说明了重复请求可能产生额外效果。

把两次写入看作“操作两次”，再把新实例看作“换了一份内存”，就能解释这些结果。下一项数据库课程会处理跨实例保存，当前不把Pages教材部署当作动态API部署。所有demo和测试都自行关闭创建的服务，没有长驻公网接口。

下一篇：[创建接口该怎样拒绝不合法的请求？](request-validation-boundaries.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
