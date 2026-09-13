---
id: j11-java-measurement-and-evidence
title: 一段Java代码更快，需要哪些证据？
description: 先断言结果等价，再控制输入、记录环境和重复采样，避免用单次耗时排序。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [j10-java-tasks-and-cancellation]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

行程统计可以写成循环，也可以用Stream求和。只跑一次、看到某个数字较小，就宣布一种写法更快，会遗漏正确性、JIT编译、机器负载和输入规模。先完成[任务结果与取消](java-tasks-and-cancellation.md)：并发增加了需要控制的变量，本篇先在单线程里练习测量步骤。

## 先证明算的是同一个结果

维护例子 `MeasurementLesson.java` 比较以下两个函数。Stream在这里是一条聚合数据的处理链，不是文件I/O流，也没有调用parallel。

```java
static long sumLoop(int[] values) {
    long total = 0;
    for (int value : values) total += value;
    return total;
}
static long sumStream(int[] values) {
    return Arrays.stream(values).asLongStream().sum();
}
```

先转为long流再求和，避免先用int累计溢出后才转long的错误；回看[类型与运算](java-values-and-operations.md)。真实测试分别用独立预期值检查空数组零、`{2,-1,3}`得四、两个Integer.MAX_VALUE得4294967294。只断言两个实现相等不够，因为二者可能犯同一个错。long也有范围上限，不是任意精度。[IntStream转换与聚合契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/IntStream.html#asLongStream())

## 固定输入，测量一段时间差

正式样本使用一到一千的int数组，先断言每个实现结果为500500。数组构造和打印放在计时区外。每个样本重复求和二百次，累计结果必须是100100000；任何错误都会使采样函数抛出AssertionError。样本耗时是**二百次调用合计的纳秒差值**，不能直接标成单次请求延迟。

`System.nanoTime()` 适合在同一JVM内用两次读数相减观察经过时间。它不是日期时间，绝对值没有跨进程意义；纳秒单位不等于纳秒精度。[System.nanoTime契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#nanoTime())

```java
long start = System.nanoTime();
for (int i = 0; i < rounds; i++)
    checksum += stream ? sumStream(values) : sumLoop(values);
long elapsed = System.nanoTime() - start;
sink = checksum; // 写入本例volatile字段，并在计时区外检查预期
```

消费结果与断言有助于暴露无效工作，但不能凭一行volatile就断言所有JIT优化干扰都已排除。布尔分支、计时成本、调用内联、固定输入和缓存仍会影响结果。

## 记录采样条件，不替数字编故事

运行先打印java.runtime.version、VM名称和os.arch，再打印 `n=1000 rounds=200 warmups=20 samples=5 checksum=100100000`。每个实现先执行二十个预热批次，随后各记录五个样本，并交替两者的测量顺序。预热次数固定只是可复现条件，不证明JIT已经稳定。

每行形如 `sample=1 loopNs=<本次实测整数> streamNs=<本次实测整数>`；尖括号是阅读占位，实际程序打印真实数字。最后输出 `consumed=100100000`。测试检查五行、非负耗时、环境字段和校验值，没有“必须快于对方”的阈值。

这次实测证据能说明程序确实执行并记录了样本，不能说明循环或Stream普遍更快。需要严肃微基准时，应进一步使用[OpenJDK JMH](https://github.com/openjdk/jmh)，理解fork、预热、测量迭代与结果消费。JMH本身也要求实验设计，不能替代业务负载验证；本篇没有安装或运行JMH。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run measure --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 失败对照与迁移练习

已执行的负面测试把预期校验值传错，采样必须拒绝；rounds为零也必须拒绝。完整包还运行独立副本故意错误对照，防止只有成功路径的“验证”。性能数据只来自命令实测，本篇不发布跨机器或生产速度结论。

1. 暂时把Stream实现改为 `Arrays.stream(values).sum()`，先运行测试再运行测量。哪个边界能检出溢出？为什么一到一千的输入发现不了它？
2. 为一百、一千、一万的输入分别写出独立预期求和与校验值，保留每次完整输出；每次另启JVM，记录CPU、操作系统、JDK、输入和是否有其他负载。改变输入时先改正确性断言，不能只改规模标签。
3. 假设某次第一个样本远高于其他样本，列出可能解释和下一步需要的证据。不要为得到期待结论而删除异常值；先保存全部原始样本，说明预先约定的筛选方法。

到这里，Java主线从编译、输入、对象、集合和异常，走到文件、打包、JVM、线程、任务与测量。请回到[Java路线](../../roadmaps/java-foundations.md)完成综合迁移练习；本主线完成不代表覆盖Spring、JDBC、模块系统、垃圾收集器调优或你已掌握全部知识。
