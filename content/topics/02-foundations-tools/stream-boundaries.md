---
id: y03-stream-boundaries
title: 一块输入数据，为什么未必是一个完整字符？
description: 用跨块UTF-8解码、输入上限和下游失败解释流式处理与背压。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [y02-process-interfaces, f05-async-promises]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

文件或进程管道不断送来字节块。包含“山城🙂”的文本，恰好在一个汉字的中间被分成两块时，逐块toString再拼接会发生什么？先理解[异步等待](../01-languages/async-and-promises.md)与[进程标准流](process-interfaces.md)。分块来自读取与缓冲安排，不承诺与字符、行或JSON对象对齐。

## 编码器知道字符边界，数据块不知道

UTF-8的一个字符可能由多个字节编码。维护测试把同一串文本在每一个可能位置切开，用两块送入解码器；另外逐字节单独解码，真实得到错误的替代字符。字节顺序相同，也不表示每块都能独立解码。

```js
const decoder = new TextDecoder("utf-8", { fatal: true })
const textPart = decoder.decode(chunk, { stream: true })
// 最后一块结束以后：
const lastPart = decoder.decode()
```

stream:true保留未完成序列，最终无输入的decode结束解码并检查尾部。fatal:true要求坏编码报错；否则默认替代行为可能把数据错误隐藏在一个看似正常的字符串里。[Encoding Standard](https://encoding.spec.whatwg.org/#interface-textdecoder)

每次得到的textPart也不一定刚好是一整行：解码边界与业务记录边界仍不同。本文没有实现通用JSON流解析器，单个JSON文件要先按协议限制总量并完整收集，逐行协议则要另外维护行缓冲和单行上限。

## 把错误传播连成一条管线

utf8Transform在Transform中累计输入字节数，超过上限就通过callback传递RangeError；解码错误也传给callback。flush完成最后的解码。decodeChunks用 `await pipeline(source, transform, sink)` 连接读取、转换和写入，只有整条管线完成才返回小结果。

测试确认三字节上限接受abc，拒绝abcd；非法序列、末尾截断字符和主动失败的下游都使Promise拒绝。源或目标错误时不能打印“处理完成”。pipeline负责参与流的结束与错误传播；这不等于已经写出去的外部数据会自动回滚。[Node流与pipeline约定](https://github.com/nodejs/node/blob/v24.21.0/doc/api/stream.md)

本维护函数是有1024字节默认上限的小型收集器，最终字符串仍驻留内存，不能称为任意大文件的恒定内存算法。若目标是文件或网络，还必须各自定义提交、清理和重试的语义。

## 下游慢时，上游要学会停下来

背压（backpressure）让写入者在下游缓冲达到阈值时暂停。write返回false表示应该等待drain后再继续，并不是这次数据被拒绝或丢弃。忽略它持续写入，队列仍可能增加；highWaterMark是阈值，不是整个进程内存的硬上限。

backpressureDemo设highWaterMark为4，写入4字节，并把下游完成回调暂存。真实观察write返回false、排队长度为4；主动完成下游回调后等到drain，再end并确认writableFinished。这里用明确回调顺序制造背压，不用sleep猜速度；也没有据此测吞吐量。

## 迁移练习

将“山城🙂”改成含多行的文本，先列出字节、字符和行的边界；每一种字节切分都应解码一致，不能把输出块数当作行数。再去掉最后的decode，预测只剩一个字符前缀的输入为何可能被漏检。最后让下游失败，观察调用者是否还会得到部分结果并误判成功。

本篇只使用受控内存流，未覆盖TCP断连恢复、压缩炸弹或生产文件导入。下一批继续文件替换、日志重放和缓存状态；已有[Java资源关闭](../01-languages/java-files-and-resources.md)提供了另一种语言中的所有权对照。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run basics --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
