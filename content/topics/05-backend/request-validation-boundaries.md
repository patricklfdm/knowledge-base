---
id: f09b-request-validation-boundaries
title: 创建接口该怎样拒绝不合法的请求？
description: 依次检查媒体类型、正文实际字节数、UTF-8和JSON格式、业务规则，再写入；用失败后的列表证明没有副作用。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f09a-create-trip-api]
topics: [api, validation, errors]
tags: [backend]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[POST创建行程](create-trip-api.md)及路线中的F06运行时校验 · 目标：说明一个请求在哪一步被拒绝，并用实际读取证明拒绝后没有写入。

核验：Node24.21.0，本机真实HTTP与纯函数边界测试通过。浏览器、页面反馈与跨源行为 **NOT_RUN：用户批准移至集中验收阶段**。没有数据库或生产操作。

## 服务端为什么还要检查一次？

F07的表单把字符串天数转换为数字，但任何能发HTTP请求的程序都可以绕过这个页面。直接提交 `{"destination":"山城","days":"3"}` 时，服务器收到的days仍是字符串。客户端做过什么检查，不是服务器可以直接相信的事实。

本例将创建前的检查排成明确顺序：

1. 路径和方法是否支持。
2. 请求是否声明本例接受的JSON媒体类型和编码。
3. 实际收到的正文是否超过1024字节。
4. 正文能否解码为UTF-8并解析为JSON。
5. 解析结果是否满足行程业务规则。
6. 全部通过后才分配编号和写入数组。

顺序意味着每一步解决不同问题。`Content-Type: application/json`只是声明，不会把错误文字变成JSON；JSON解析成功也不会把 `"3"` 转成number。某一步失败，就不进入写入分支。

## 先看懂错误响应契约

[完整trip-api示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-api) 统一返回 `{ error: { code, message } }`，本篇的四个主要失败类别如下：

| 条件                    | 状态和code                                         | 本例处理         |
| ----------------------- | -------------------------------------------------- | ---------------- |
| 不支持的媒体类型/编码   | 415 / UNSUPPORTED_MEDIA_TYPE或UNSUPPORTED_ENCODING | 不按JSON继续处理 |
| 正文超过1024字节        | 413 / BODY_TOO_LARGE                               | 不解析或写入     |
| 空正文、坏UTF-8或坏JSON | 400 / INVALID_JSON                                 | 不进入业务校验   |
| JSON合法，字段不合约定  | 422 / INVALID_TRIP                                 | 不分配编号或写入 |

[MDN 415](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/415)、[413](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/413) 和 [422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422) 分别说明了媒体类型、内容过大和内容无法按请求处理的语义。具体code字符串是本项目契约，不是HTTP内置常量；其他API可能作不同的400/422划分，需要按其文档判断。

input.mjs中的inputError创建普通Error，再附上status和code属性；异常传到路由的catch后，被转换为上述公开JSON。预期输入错误不需要把堆栈发给调用者。未知异常的500兜底已实现，但本轮没有做该兜底的故障注入验收，也没有完成生产日志与监控。

## 正文为什么要按实际字节检查？

网络正文不是一个已经准备好的JS对象。Node的请求对象可以像流（stream）一样逐块读取；本例没有调用setEncoding，所以每块是Buffer字节数据。`for await`表示等待下一块再循环，直到正文读取结束。它与F05中的await使用同一异步思路，只是会反复取得下一块。[Node流的异步迭代说明](https://nodejs.org/api/stream.html#readablesymbolasynciterator) 给出了这个读取接口。

下面是readJson内部的完整累计部分，外层函数先检查媒体类型，后续还有解码/解析；request和maxBytes是它的参数：

```js
let bytes = 0
const chunks = []
for await (const chunk of request) {
  bytes += chunk.length
  if (bytes > maxBytes) {
    chunks.length = 0
  } else {
    chunks.push(chunk)
  }
}
if (bytes > maxBytes) {
  throw inputError(413, "BODY_TOO_LARGE", "正文不能超过" + maxBytes + "字节")
}
```

bytes记录实际到达的正文大小。超过上限后清空之前保留的块，后续块也不再保存；本次正文结束后才返回413。这里不只相信Content-Length，分块传输没有给出这个头时，累计仍然生效。

为什么不把每一块都JSON.parse？一块可能只包含半个JSON属性，甚至只有一个汉字UTF-8编码的一部分。应在允许大小内把字节合并，再整体解码与解析。测试用多次write拆开中文和数字，验证最终行程正确；应用数据块边界不应被当成业务记录边界。

`"界".length`是1，它的UTF-8编码却占3字节；业务字符串长度与网络大小不是同一个量。[Node Buffer文档](https://nodejs.org/api/buffer.html#static-method-bufferbytelengthstring-encoding) 区分了字节长度。测试构造了文字长度小于1024、实际UTF-8字节数大于1024的JSON请求，仍得到413。还验证了恰好1024字节通过、1025字节拒绝，并且列表未增加。

本实现为了让本机实验清楚显示413，读完超限请求才响应；它没有应用级接收时限或速率限制，不能据此声称能抵抗无限或慢速上传。限制的是应用保留的正文块，不是Node内部缓冲和整个进程的总内存。流中提前退出还可能销毁请求，所以不能先随意关闭连接，再假定调用者一定能读到错误JSON。

## 大小合格之后，仍可能不是 JSON

readJson先接受 `application/json`，可选UTF-8 charset，拒绝其他媒体参数或压缩编码。正则只是本例明确支持的头部格式，不是完整媒体类型解析器；支持范围和测试见README。

随后合并字节，严格解码：

```js
const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
return JSON.parse(text)
```

Buffer.concat合并已保留的字节块；TextDecoder把它们解码成文字，fatal:true使非法编码报错，避免悄悄替换为其他字符；JSON.parse再检查JSON语法。[MDN TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/TextDecoder) 说明了fatal选项。外层try/catch把本例的解码或JSON语法失败转换成400/INVALID_JSON。

这段代码处于大小检查之后，不会先解析巨大的正文再说超限。空字符串、少右括号、尾随逗号、非法UTF-8字节，都有实测失败路径。合法JSON值null和数组则能通过解析，留给下一层判断它们不是行程对象。

## 业务规则只接收明确的字段

parseTrip沿用F06的对象、目的地、数字类型、整数和1–30范围检查，并为这个接口增加目的地长度限制。目的地trim之后必须有1–80个UTF-16代码单元；这里只按JS的string.length计算，不声称等于人眼看到的字符数。40个😀的长度是80，41个越界，这两端已实测。[MDN String.length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) 解释了代码单元的含义。

天数条件的核心摘录是：

```js
if (
  typeof input.days !== "number" ||
  !Number.isInteger(input.days) ||
  input.days < 1 ||
  input.days > 30
) {
  throw inputError(422, "INVALID_TRIP", "天数必须是1到30的整数数字")
}
```

不要只把 `"3"` 强转成3，让API悄悄接受另一种契约。表单文字转换和API业务校验位于不同边界。通过后函数只返回新的 `{ destination, days }` 对象，原输入不改动，未知字段不保留。它处理的是JSON式普通数据，不是任意getter/Proxy对象的安全沙箱。

## 练习：把业务上限改成14

在 `examples/trip-api` 的副本里将parseTrip的天数上限从30改14，同时修改错误文字和相关测试。正文大小上限仍是1024字节，两者不要一起改。依次提交14、15和字符串 `"14"`，预测状态与列表条数后再运行。

隔离副本实测参考：14返回201；15与 `"14"` 返回422，列表只有第一条。已有正常测试若还期待30通过，应先失败，这正好提醒我们更新契约和测试；不能为了全绿把失败断言删掉。

运行 `npm test`会验证正常/失败请求及失败后的状态；`npm run demo`展示结果；`npm run fail`故意提交31并以HTTP422非零退出。例子始终自行关闭本机服务。错误响应是第一份证据，随后读取列表确认没有额外记录，才证明本例拒绝路径没有写入。

下一篇：[怎样用SQL保存行程？](../06-data/sql-tables-and-persistence.md)，学习表、约束与文件保存。当前校验正确、API能创建和读取，但数据仍只在当前实例内存中，页面也尚未连接这个API。

[返回创建接口](create-trip-api.md) · [返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
