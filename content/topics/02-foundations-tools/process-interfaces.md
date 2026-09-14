---
id: y02-process-interfaces
title: 一个子进程打印了内容，就算执行成功了吗？
description: 明确工作目录、环境、参数、标准流与退出状态，验证进程调用契约。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [y01-search-cost-model, j08-java-process-and-memory]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

脚本在终端能运行，接入自动任务以后却说文件不存在；另一次打印了半段JSON，调用者却报告成功。先读[JVM进程与内存](../01-languages/java-process-and-memory.md)：进程是独立运行实例。现在用同一个Node可执行文件启动一个小工作进程，观察进程之间明确传递的边界。

## 进程不会自动继承你的想法

processFixture创建自有临时目录和value.txt，调用spawnSync时明确指定cwd、env、参数数组、stdin与输出上限。cwd是解析相对路径的工作目录，并非源文件所在目录；env是子进程配置，本例只传KB_DEMO_NAME这个合成键，不复制整个用户环境。

```js
spawnSync(process.execPath, [workerPath, "echo", "海湾 城"], {
  cwd: dir, env: { KB_DEMO_NAME: "child-only" },
  input: JSON.stringify({ days: 3 }), encoding: "utf8",
  shell: false, timeout: 5000, maxBuffer: 8192
})
```

这里是调用核心，workerPath/dir由维护模块创建。使用当前Node的绝对可执行路径，不依赖另一台机器的PATH碰巧找到相同版本。参数数组里的“海湾 城”是一个参数；带分号或美元括号的文本也按字面传递，测试证实没有被shell解释。调用语义以[Node固定版本child_process文档](https://github.com/nodejs/node/blob/v24.21.0/doc/api/child_process.md)为准。

## 三条标准流分别承担什么

stdin把输入送进子进程；stdout只承载约定结果；stderr记录诊断。维护worker从stdin解析合成JSON，在自己的cwd读取相对路径value.txt，返回包含配置、内容、参数与pid的JSON。测试确认child pid不同，父进程的cwd和配置未改变。

stdout与stderr是分开的字节流，不能靠它们显示的交错顺序推断全部执行次序。这里使用有输出上限的同步调用收集小结果；大量输出应采用下一篇的流式消费，不能无限缓冲，也不能让管道无人读取直到塞满。

## 从“有输出”到“成功结果”有三道检查

readReply先检查调用本身的error，再检查signal和退出码，最后解析JSON并检查本例必需字段。实测fail模式写stderr、退出2且stdout为空；partial模式退出0却只打印半个JSON，协议解析仍失败。

wait模式故意不结束，测试把预算设为100毫秒，父调用报告ETIMEDOUT，不能被当作正常结果。这个数字是允许等待的预算，不是精确计时断言。本例worker没有忽略终止信号，也没有派生孙进程；不能从它推导任意进程树都能被一个timeout清理。

spawnSync会阻塞父Node事件循环，适合这里短小、受控的教学编排；服务端请求路径选择同步或异步需要另行判断。退出0只表明约定上的进程成功，仍需校验应用协议与业务结果；它不是数据库提交或物理持久性的证明。

## 练习与清理

运行后可看到child-only、合成内容、days=3与完整“海湾 城”参数。所有临时文件清理，父环境未改；未知worker模式被维护入口拒绝。

练习：把cwd设到你另建的空临时目录，预测相对文件读取在哪一步失败；再让worker输出合法JSON但缺少input.days，说明为什么退出0仍不够。若需要从子进程连续接收记录，应规定字节编码、记录分隔和输出上限，而非把每一块data事件当作完整JSON。

接着阅读[分块解码与背压](stream-boundaries.md)。终止请求和协作退出的区别也可对照[Java任务取消](../01-languages/java-tasks-and-cancellation.md)。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run basics --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
