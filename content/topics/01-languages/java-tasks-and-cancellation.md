---
id: j10-java-tasks-and-cancellation
title: 等任务超时以后，它真的停了吗？
description: 区分Future结果、异常、等待超时和协作取消，并验证执行器关闭。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [j09-java-threads-and-shared-state]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

用户点击生成行程摘要，页面只愿意等一段时间。等待超时以后，后台计算可能还在运行。若立刻重试，两个任务可能同时产生副作用。先完成[线程与共享状态](java-threads-and-shared-state.md)，理解start、等待条件、中断和结束信号；本文只使用无外部副作用的合成任务。

## 用Future取回结果和错误

`ExecutorService` 管理任务执行。`submit` 返回一个 `Future<T>`，代表未来结果；有返回值的lambda可用作 `Callable<T>`。创建线程池并不表示提交的任务已经完成。

```java
ExecutorService pool = Executors.newFixedThreadPool(2);
Future<Integer> result = pool.submit(() -> 6);
System.out.println(result.get(5, TimeUnit.SECONDS));
```

这段核心代码输出六，完整维护例子 `TaskLesson.java` 还负责关闭池。任务里抛出IllegalArgumentException时，调用者的get抛出ExecutionException，原始错误在getCause中；不要把失败当作正常的零值。get也可能因调用线程被中断而抛出InterruptedException，或因等待时间耗尽而抛出TimeoutException。这些是不同的恢复条件。[Future契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html)

## 固定一个仍在等待的任务

任务先发出started信号，再阻塞在尚未打开的release门闩。主线程先确认started，随后调用 `get(1, TimeUnit.MILLISECONDS)`。门始终关闭，因此get按预期超时，`doneAfterTimeout=false`。这里一毫秒是等待预算，测试不要求操作恰好耗时一毫秒。

超时仅结束这次get等待，没有调用cancel，也没有替任务回滚。实际应用应明确是继续保留任务、稍后查询，还是发出取消请求；存在写入、付款等外部副作用时，还必须另行设计幂等与结果确认，本例不提供这些保证。

## 取消状态和真正停止分别观察

维护例子的下一步是 `blocked.cancel(true)`。true允许尝试中断正在执行的线程；取消成功后get抛出CancellationException，isCancelled为true。但这个状态不能证明用户代码已经退出。任务可能不响应中断，正在做的外部工作也不会自动撤回。

本例的await是可中断的。任务捕获InterruptedException，设置一个AtomicBoolean观察标记，恢复当前线程的中断标记并向外抛出异常。finally释放stopped信号。主线程**另外等待stopped**，才检查 `workerInterrupted=true`；这是对协作行为的实测。finally信号也不是线程池终止，池还可能有空闲工作线程。

| 观察 | 能说明什么 |
| --- | --- |
| get超时 | 本次等待没有及时取得结果 |
| cancel返回true、isCancelled为true | Future接受取消并进入取消状态 |
| 本例stopped信号到达 | 任务运行到了退出时的finally |
| awaitTermination返回true | 执行器已经终止 |

## 给执行器一个结束边界

完整代码在finally打开release，调用shutdownNow，再用有上限的awaitTermination验证池退出。即使前面的断言失败，也会进入清理。shutdownNow是停止尝试，不保证任意任务马上退出；普通shutdown则允许已提交任务继续结束，拒绝后续任务。[ExecutorService关闭契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)

固定两个工作线程也不等于限制待处理任务总数。本例没有负载测试或背压策略，不能把这段教学池配置直接当生产容量方案。[newFixedThreadPool契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html#newFixedThreadPool(int))

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run tasks --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 验证与迁移练习

真实输出依次包含 `result=6`、`cause=IllegalArgumentException`、`doneAfterTimeout=false`、`cancelAccepted=true`、`cancelled=true`、`workerInterrupted=true` 和 `poolTerminated=true`。测试检查每一项，任何一个缺失都会失败；所有等待均有退出路径，Node对子进程另有15秒上限。

1. 不看输出，先预测“get超时”“get获取任务异常”“取消后get”各是什么异常，再运行验证。
2. 在个人临时副本把cancel(true)改为cancel(false)。为了让任务结束，须在等待stopped**之前**手动打开release。预测Future仍取消，但workerInterrupted会变为false；原测试应因此失败。别只改断言而不解释新的退出路径。
3. 若任务改成CPU循环，找出检查中断标记和尽早退出的位置。不要用空catch吞掉InterruptedException。写下取消前已完成的动作中，哪些不会自动撤销。

没有验证忽略中断的无限循环、生产I/O取消或虚拟线程。接下来学习[先验证结果，再测量耗时](java-measurement-and-evidence.md)。
