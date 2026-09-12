---
id: f08b-fetch-status-json
title: 为什么 fetch 没抛错，请求却失败了？
description: 实测404、500、断连和坏JSON，分清收到响应、状态成功、正文可解析与业务数据合法。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f08a-http-request-response]
topics: [http, fetch, errors]
tags: [web]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[HTTP请求与响应](http-request-response.md)，并能理解await、throw与try/catch · 目标：说明一次读取失败发生在哪一层，并写出有状态检查的JSON读取函数。

核验：Node24.21.0、本机随机端口的真实HTTP实验已测试。浏览器、CORS和页面反馈 **NOT_RUN：用户批准移至集中验收阶段**。所有数据都是合成数据，没有请求外部API或写入数据库。

## 收到404，也意味着收到了响应

假设请求行程t1可以成功，而请求不存在的编号返回404。下面是可在示例已启动服务后执行的摘录：

```js
const response = await fetch(fixture.baseUrl + "/trips/missing")
console.log(response.status, response.ok)
```

实际输出 `404 false`，程序没有在await fetch处抛错。404是服务器已经发回的HTTP响应；fetch能把它交给调用者，至于应用把它当错误、空状态还是别的结果，需要根据接口约定判断。`response.ok`仅表示状态码是否在200–299，不代表行程存在、JSON正确或已经保存成功。[MDN Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) 定义了这个范围。

网络连接无法完成、请求URL无效等情况可能让fetch返回的Promise拒绝。不能假设“只要有catch，就已经覆盖404”，也不能把404叫作网络断开。[MDN Fetch指南](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) 区分了响应错误状态和请求失败。

## 为什么有两个等待点？

读取JSON通常有两步：先等待fetch取得Response，再等待response.json读完响应正文并解析。获得响应对象时可以读取状态和消息头，但正文的读取仍可能失败。

```js
const response = await fetch(url)
const value = await response.json()
```

这是流程摘录，url必须由调用者提供。第二行返回的value是解析结果，未必是我们想要的行程对象；JSON也能表示数组、字符串或null。[MDN Response.json](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) 说明了异步解析和无法解析时的SyntaxError。

想象服务器发了200和 `Content-Type: application/json`，正文却只有 `{"destination":`。状态成功、声明为JSON，都不会替服务器补齐这个缺失的值和右括号。本例 `/broken-json` 故意这样做，fetch正常返回，json()实测以SyntaxError拒绝。

## 把HTTP状态检查写进读取函数

完整示例位于 [examples/http-trips](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/http-trips)。client.mjs中的函数为：

```js
export async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } })
  if (!response.ok) {
    // 本例错误正文很小，也可能是HTML，先按文字读完。
    await response.text()
    throw new Error("HTTP " + response.status)
  }
  return await response.json()
}
```

正常路径返回解析后的值。非成功状态先把本例的小错误正文按文字读完，再抛出带HTTP状态的Error，不猜错误页一定是JSON，也不把原始错误页当成用户反馈直接展示。读取正文本身若失败，仍会向调用者传播失败。

这段顺序有实际意义：`/html-error` 返回500和HTML。如果先调用json()再看状态，读者可能先遇到“JSON格式不对”，忽略服务端已经返回500。现在这条实验明确得到 `Error: HTTP 500`。

getJson只适用于本例约定成功时返回JSON的小响应。它没有通用超时、响应大小限制、自动重试、凭证处理或业务结构验证；也不承诺处理所有2xx响应，例如没有正文的204不能照搬成JSON读取。实际项目应按接口契约决定如何读取，而不是见到ok就无条件json。

## 完整运行后，哪些错误确实不同？

从仓库根目录进入独立包：

```sh
cd examples/http-trips
npm ci
npm test
npm run errors
```

包没有npm依赖，服务只监听127.0.0.1的系统分配端口；errors.mjs通过finally关闭自己创建的服务。以下是本轮实测的固定输出，省略行尾空白：

```text
原始fetch 404 false
/trips/t1 成功 山城 3
/trips/missing 失败 Error HTTP 404
/html-error 失败 Error HTTP 500
/broken-json 失败 SyntaxError
/disconnect 失败 TypeError
```

原始fetch与getJson的404结果不同，是因为后者加了显式状态判断，不能把这个throw归功于fetch自己。errors.mjs为了观察所有路径，会捕获并打印错误后继续，所以该演示以0退出；这不代表每个请求成功。

`/disconnect`在服务器收到请求后，发送响应头之前直接关闭连接，测试还确认服务器确实记录了这次请求。因此此处TypeError对应一次真实断连，没有收到HTTP状态码。本实验不依赖猜测某个端口无人使用，不把“找不到行程”假装成断网。不同运行时的底层错误文字可能不同，测试没有锁死整段堆栈。

需要让自动化命令明确失败时，使用 `npm run fail`。它故意不catch HTTP404，但仍用finally关闭服务；实测退出码1，并出现 `Error: HTTP 404`。finally负责清理，catch负责处理错误，两者并不等价。这个失败也在测试中通过子进程验证，不是只手动看了一眼日志。

## 正文为什么不能随便读两次？

下面是一个故意错误的流程摘录：

```js
const response = await fetch(fixture.baseUrl + "/trips/t1")
const text = await response.text()
console.log(text)
const trip = await response.json()
```

text()已经消费这份响应的正文；随后json()再读同一份正文，实测抛TypeError，bodyUsed为true。因此单看TypeError这个名字，也不能判断一定是网络失败，必须看在哪个操作发生。需要同时保留文字和对象时，可以对已读的text执行 `JSON.parse(text)`，上一篇采用的就是这个方法。[MDN响应体读取说明](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#locked_and_disturbed_streams) 解释了正文消费的限制。

自动测试验证了错误版本的非成功结果；修复方向不是再套一次catch后返回空对象，而是去掉第二次正文读取。否则上层得到一个空对象，反而更难知道原始失败在哪里。

## 练习：JSON合法，days就一定是数字吗？

把getJson的目标换成 `/wrong-shape`，先预测它会不会抛错，再检查返回值的 `typeof days`。随后回顾F06，列出真正使用行程前还需要检查哪些字段。

参考结果：getJson成功返回，days的类型实测为string。服务器给的是合法JSON，字符串 `"3"` 完全可以出现在JSON中；它只是违反了业务要求。需要继续验证对象形状、目的地、days类型及1–30整数范围，不能用 `as Trip` 替代运行时条件。

本篇还没有把表单接到接口，没有完成页面加载状态、跨源策略或保存流程。Node请求成功不能证明浏览器也能跨源读取；这些页面行为留待后续整合和集中验收。下一步将用已有输入校验知识，编写真正的创建接口和成功/失败契约，再接数据库。

[返回HTTP消息](http-request-response.md) · [返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
