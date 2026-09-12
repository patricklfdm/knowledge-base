---
id: f08a-http-request-response
title: 一次 HTTP 请求里，究竟传了什么？
description: 在本机观察行程请求的方法、URL、消息头、状态码和JSON正文，区分静态文件服务与业务接口。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f05-async-promises, f07b-form-input-boundary]
topics: [http, url, json]
tags: [web]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[异步与Promise](../01-languages/async-and-promises.md)、[表单输入边界](../04-frontend/form-input-boundary.md) · 目标：指出请求要找谁、做什么，以及响应告诉了我们什么。

核验：Node24.21.0，本机真实HTTP请求与合成响应已运行；无外部账户或数据库。浏览器阅读、跨源和页面交互 **NOT_RUN：用户批准移至集中验收阶段**。此篇不需要启动浏览器。

## 页面里的行程，怎样到另一个程序里？

F07已经能把输入变成一个行程对象，但对象只在页面程序的内存里。若另一个程序负责读取或保存行程，两边需要约定消息格式：请求哪条记录、执行什么操作、结果是什么。HTTP提供请求与响应的语义；服务器如何找数据，则是应用自己的工作。

客户端（client）主动发请求，服务器（server）接收并响应。它们是这次通信中的角色，不一定是两台物理机器。本篇让两个角色都在本机Node进程中，通过本机网络端口通信，便于观察而不依赖外网。[MDN HTTP概览](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) 介绍了这个请求—响应模型。

## 先运行一个可停止的实验

从仓库根目录执行，Node使用24.21.0：

```sh
cd examples/http-trips
npm ci
npm test
npm run demo
```

[完整源码](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/http-trips) 是独立无依赖包，可以单独复制运行。npm ci核对锁，不安装额外库。demo启动只绑定127.0.0.1的演示服务器，发一次请求，打印结果，然后关闭自己创建的服务。程序结束即清理，不需要另开窗口或手动杀进程。

其中一次实测第一行是：

```text
URL http://127.0.0.1:60082/trips/t1?view=full#preview
```

60082是那一次由系统分配的端口，每次运行可能不同；请使用程序本次打印的地址，不把示例数字当成固定服务。端口0表示让操作系统选择可用端口，实际地址由启动代码返回。[Node服务器监听说明](https://nodejs.org/api/net.html#serverlistenport-host-backlog-callback) 定义了这个行为。

## URL 的每一段在说什么？

把上面的地址拆开看：

| 部分     | 本例的值   | 作用                             |
| -------- | ---------- | -------------------------------- |
| 协议方案 | http       | 使用HTTP；本机教学未配置TLS      |
| 主机     | 127.0.0.1  | 回环地址，指向运行程序的这台机器 |
| 端口     | 60082      | 找到本次监听的服务               |
| 路径     | /trips/t1  | 本例约定读取编号t1的行程         |
| 查询串   | ?view=full | 本例约定选择完整表示             |
| 片段     | #preview   | 不随这次HTTP请求发送给服务器     |

路径看起来像文件夹，并不保证磁盘上存在同名文件。我们的服务器根据路径选择代码，返回固定数据。查询参数的名字和含义由应用约定，HTTP不会自动理解view。

片段与查询串也不同：程序给fetch的URL有 `#preview`，服务器记录的请求目标只有 `/trips/t1?view=full`。这个差异已经由真实请求测试验证，不是仅用字符串截取得到的结果。[MDN URL说明](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL) 解释了这些组成部分。

## 消息头和正文不是一回事

下面用HTTP/1.1的文字形式示意本次请求的关键部分，省略库自动添加的其他消息头；这不是完整抓包日志：

```http
GET /trips/t1?view=full HTTP/1.1
Host: 127.0.0.1:60082
Accept: application/json
```

GET是方法（method），本例用它读取数据。服务器也会检查方法：对同一地址发POST，本例返回405，不会因为方法名字叫POST就自动保存东西。后续创建接口需要我们真正编写处理逻辑。

消息头（headers）描述这次请求的附加信息。Accept表示客户端可接受的响应媒体类型，这里请求JSON；它不是“服务器一定返回JSON”的保证。响应里的Content-Type则声明实际返回内容的媒体类型。两者描述的方向不同。[MDN Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept) 和 [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type) 分别给出了定义。

响应关键部分可示意为：

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":"t1","destination":"山城","days":3}
```

200是状态码（status code），表达本次请求的结果类别；空行后是正文（body）。本例请求没有正文，响应正文是一段JSON文字。HTTP正文也可能是HTML、图片或其他表示，不能看到HTTP就假设一定有JSON。HTTP/2和HTTP/3的线上编码与这里的文字示意不同，不能把所有HTTP版本都当成这种逐行文本。[MDN HTTP消息](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages) 用HTTP/1.1帮助说明消息结构。

本例涉及的状态可以先这样读，仍需结合接口约定理解具体原因：

| 状态 | 本例含义                             |
| ---- | ------------------------------------ |
| 200  | 成功返回请求的数据表示               |
| 400  | 查询参数view的值不符合约定           |
| 404  | 找不到行程或演示路径                 |
| 405  | 不允许这个方法，Allow头给出允许的GET |
| 500  | 合成的服务器错误，正文在本例中是HTML |

[MDN状态码参考](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) 解释了状态类别；[405说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/405) 特别指出Allow头的用途。状态码不会替应用验证所有业务规则。

## 从字节到文字，再到对象

JSON是一种数据表示格式，本例用它表达对象：属性名和字符串值使用双引号，days的3没有引号，因此解析后是数字。它与JavaScript对象字面量看起来相似，但不是任意JS代码；不能放函数、注释或尾随逗号。不要用eval执行外来响应。[MDN JSON说明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) 介绍了JSON与JavaScript的差别。

inspect.mjs中的核心摘录如下，fixture是演示服务器返回的对象，fixture.baseUrl是本次监听地址；new URL将路径与这个地址组合成完整URL：

```js
const url = new URL("/trips/t1?view=full#preview", fixture.baseUrl)
const response = await fetch(url, { headers: { Accept: "application/json" } })
console.log("响应", response.status, response.ok)
console.log("Content-Type", response.headers.get("content-type"))
const text = await response.text()
console.log("正文文字", text)
const trip = JSON.parse(text)
console.log("解析后", trip.destination, trip.days, typeof trip.days)
```

fetch是发送请求的接口，返回Promise，所以用await等待。这里先把正文读成文字，再用JSON.parse解析为值；不是直接通过网络传递一个共享的JavaScript对象。Node提供内置fetch，本例不需要安装axios等请求库。[Node fetch指南](https://nodejs.org/learn/getting-started/fetch) 给出了Node用法；上述版本另外已实测。

实际输出的固定部分为：

```text
请求 GET /trips/t1?view=full
Accept application/json
响应 200 true
Content-Type application/json; charset=utf-8
正文文字 {"id":"t1","destination":"山城","days":3}
解析后 山城 3 number
```

headers.get按名称读取一个响应头，名称大小写不影响本例读取结果；测试也用大写CONTENT-TYPE核对。状态码与正文分开读取，JSON解析并不能代替状态检查，下一篇会实测它们各自的失败。

## 练习：请求摘要，结果为什么少一个字段？

在自己的inspect.mjs副本里，把 `view=full` 改成 `view=summary`，保留其他代码。先预测状态、正文和最后一行，再运行。随后试试 `view=unknown`。

参考：summary仍是200，但正文只含id和destination，所以最后一行的days和typeof days都是undefined。unknown返回400和错误对象；原始inspect没有状态检查，仍会解析这段合法JSON，不能把它当作成功行程。summary和非法查询两条路径已有自动测试；两种修改的demo副本也已运行。

最后区分两个服务：F07的Python静态服务器读取目录中的文件；这里的Node演示服务器按路径返回合成数据，两者都可以使用HTTP。本例仍没有创建或持久化接口，GitHub Pages只发布教材文件，不会替我们持续运行这个Node服务器。

下一篇：[为什么fetch没抛错，请求却失败了？](fetch-status-and-json.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
