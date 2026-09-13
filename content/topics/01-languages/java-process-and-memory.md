---
id: j08-java-process-and-memory
title: 重启Java进程后，内存里的行程去了哪里？
description: 区分class文件与运行状态，观察新JVM的static字段、小堆上限及受控内存分配失败。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [j07-java-packages-and-jar]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[包与JAR](java-packages-and-jar.md) · 目标：解释为什么class还在、内存状态却不能跨进程保留，并区分Java堆上限与进程总内存。

## 可执行产物没有自动保存运行状态

`ProcessLesson`有一个static计数器：

```java
private static int counter;
// count分支中执行：
System.out.println("counter=" + (++counter));
```

static字段属于相应加载的类。示例分别启动两个新Java进程，每次都从新状态开始，分别输出counter=1，并非第二次输出2。class或JAR描述可加载的程序，不是上次进程的内存快照。需要跨重启保留行程时，要选择文件、数据库或其他持久化方式，并按它们的规则保存。

这也不是说一个进程中的任意代码都共享同一个全局计数器；类加载边界还有更细的身份规则。本例只比较普通启动的两个独立JVM，未研究自定义类加载器。

## 调用、对象和堆的层次

JVM执行方法时使用栈帧，保存局部变量、操作数等运行信息；堆是对象和数组分配所涉及的共享运行时区域。局部变量可以保存引用，引用指向对象，不要把“变量写在方法里”简化成“整个对象必定在栈上”。[JVM规范的运行时数据区](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)描述的是抽象结构，具体优化与物理布局由实现决定。

垃圾收集（GC）负责自动内存管理，但“没有任何有用业务用途”不等于“已不可达”。持续被集合引用的对象可能一直保留。即使对象已不再被强引用到达，也不能靠一行代码保证立即回收。关闭文件句柄应使用上篇资源所有权机制，不能等待GC碰巧替代业务清理。

## 只在受控子进程里观察堆上限

维护脚本编译ProcessLesson后用如下参数启动独立JVM：

```text
java -Xmx32m -cp <临时class目录> ProcessLesson heap
java -Xmx32m -XX:-HeapDumpOnOutOfMemoryError -cp <临时class目录> ProcessLesson oom
```

heap分支打印 `Runtime.getRuntime().maxMemory()` 的字节数；测试允许合理的实现对齐差异，不把它硬写成跨JVM恒定输出。oom分支尝试创建一个64 MiB字节数组，在这个32 MiB最大堆的子进程中实际失败，stderr出现OutOfMemoryError并非零退出。脚本明确关闭该子进程的错误堆转储选项，检查自建目录没有hprof文件，所有子进程都有超时。

`-Xmx`约束Java堆，不是操作系统看到的进程总内存。线程栈、类元数据、代码缓存及本地分配也会消耗内存；这个实验没有测它们的总量。[java参数手册](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)说明了最大堆选项。不要从heap分支打印的数字推断RSS或生产容量。

## 错误信息该支持什么结论

本轮证据只说明这次固定分配超过这个受控堆条件，不证明任何OutOfMemoryError都由同一原因引起，也不证明调大堆就能修复真实泄漏。我们没有向长时间运行的用户进程施加压力，没有制造系统内存耗尽，更没有尝试在内存错误后继续宣称服务健康。

源码的 `switch` 按count/heap/oom选择实验分支，箭头分支不需要靠break避免传统贯穿；这属于Java21已支持的语法，不使用预览特性。未认识这种写法时可先逐项对照三个入口，而不把三类结果混在一次运行中。

练习：先预测“同一main里打印两次++counter”和“启动两个main进程各打印一次”的区别，再在独立副本验证。讨论哪些状态需要持久化；不要用放大分配来测试个人电脑极限。下一单元进入同一进程内的[线程与共享状态](java-threads-and-shared-state.md)。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run process --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
