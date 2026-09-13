---
id: j09-java-threads-and-shared-state
title: 两个线程各加一次，为什么结果可能只有一？
description: 用确定交错复现丢更新，再用同一把锁保护共享状态。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [j08-java-process-and-memory]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

两个导入任务各完成一条行程，主线程想统计完成数。单线程的 `count++` 看起来只有一句，但两个任务同时执行时，结果不一定是二。先完成[JVM进程与内存](java-process-and-memory.md)：本篇的线程属于同一个JVM进程，可以访问同一个计数对象；上篇两个独立JVM的静态字段则各有一份。

## 从一个任务到两个线程

`Runnable` 是只有一个抽象方法 `run()` 的接口。`Runnable work = () -> { ... };` 用lambda提供这个方法的实现，可对照[接口与异常](java-interfaces-and-exceptions.md)。`new Thread(work).start()` 启动新线程；直接调用 `work.run()` 只是当前线程的普通方法调用。`join()` 用来等待线程结束，不能先打印结果再假定工作已经完成。

不要用“睡一会儿”代替等待条件。线程何时获得CPU并不确定，sleep不会建立共享变量所需的同步关系。Java对监视器、volatile、start与join的可见性约束见[JLS第17章](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)。

## 让错误按指定顺序发生

维护例子 `ThreadLesson.java` 将一次加法拆成读、算、写，并用两个 `CountDownLatch` 安排交错。`readers` 初值二，两个线程各读完旧值后减一；主线程等它归零，再打开初值一的 `release` 门。await等待归零，countDown减一；这个同步器不能复位。[CountDownLatch契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html)

```java
int old = unsafe;       // 两个线程都先读到0
readers.countDown();
await(release);          // 本例封装：最长等待5秒，否则失败
unsafe = old + 1;       // 两个线程最终都写入1
```

共享字段即使用 `volatile int unsafe` 声明，仍会得到一。volatile提供相关读写的可见性与顺序约束，却没有把读、计算、写合成一个不可分割的操作。此处同步器用来构造反例，并没有修复计数。两次真实JVM运行都得到 `lost=1`，不是从“不小心调度到一起”推测的结论。

## 把同一个状态的修改放在同一把锁内

```java
static final class Counter {
    private int value;
    synchronized void increment() { value = value + 1; }
    synchronized int value() { return value; }
}
```

实例同步方法锁住接收者对象。两个线程必须调用**同一个Counter实例**，才能用同一监视器保护整个更新；每次新建一个锁对象没有这种互斥效果。本例两个线程各调用一千次，主线程等待二者结束，真实输出 `locked=2000`。同步读取方法也遵守同一规则。锁的释放与后续获取提供可见性；它不保证公平调度，也不自动解决多个锁的死锁。

工作线程失败不能只写到日志而让主线程宣布成功。维护代码用 `AtomicReference<Throwable>` 收集第一个失败，在join之后重新抛出；等待中断会被记录并恢复中断标记。AtomicReference这里只用于安全传递失败，不承担计数。等待有上限，线程结束后检查 `workersStopped=true`。这不是生产线程管理框架。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run threads --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 失败对照与迁移练习

真实测试同时断言丢更新为一、锁内结果为两千以及所有线程结束。边界测试验证计数初值、前三次递增和被中断的await；它抛出InterruptedException时会清除中断标记，调用者应明确传播或恢复。

1. 先在纸上写出两个线程读取零、各写一的顺序，再运行例子对照。若去掉门闩，偶尔得到二不能证明代码正确。
2. 在你自己的临时副本把 `value = value + 1` 改成 `value = 1`，运行测试。应因累计值不对而失败；恢复后通过。这验证了断言真的检查每次更新，不只检查进程退出。
3. 若要同时维护“完成条数”和“累计天数”，先写出必须一起成立的关系，再让一次锁内方法更新二者。给每个字段分别加锁是否足以保护这条关系？请写出可能的交错说明判断。

本篇没有测吞吐量、调度公平性、死锁检测或虚拟线程。下一篇把任务交给执行器，并区分[任务结果、等待超时与取消](java-tasks-and-cancellation.md)。
