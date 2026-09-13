---
id: j05-java-interfaces-and-exceptions
title: 接口和异常怎样划清调用契约？
description: 用两种摘要格式实现同一接口，区分可替换行为、受检异常与入口错误反馈。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [j04-java-collections-and-copies]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[集合与复制](java-collections-and-copies.md) · 目标：让调用者依赖行为约定，并让“未找到”作为明确失败传到入口。

## 同一份行程有两种展示方式

不要为了切换一句摘要，在每个调用处复制一份if分支。接口（interface）描述调用者可用的操作，实现类提供操作的具体行为：

```java
interface Formatter { String format(TripModel trip); }
static final class Compact implements Formatter {
    @Override public String format(TripModel trip) {
        return trip.name() + ":" + trip.days();
    }
}
static String render(TripModel trip, Formatter formatter) {
    return formatter.format(trip);
}
```

这是 `ContractLesson` 类里的片段。为保持文件小，Compact等辅助类型嵌套在外层类内；这里的static使其不需要外层对象。`implements` 表示类承诺实现接口，`@Override` 帮编译器检查方法确实覆盖约定。漏写format会编译失败。`public` 不能缩窄接口方法对调用者的可见性。

render只需要Formatter，不需要知道传入的是Compact还是Sentence。实际传入两个实现，得到 `山城:3` 和 `山城安排3天`。这种按对象的实际实现选择方法的行为是多态（polymorphism）。接口不自动创建实现，也不是网络API；可替换性还要求各实现遵守语义约定，而不仅方法名相同。[JLS接口](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)定义了这些类型关系。

## 缺失不等于一个空行程

```java
static TripModel find(Map<String, TripModel> trips, String id)
        throws MissingTripException {
    TripModel trip = trips.get(id);
    if (trip == null) throw new MissingTripException(id);
    return trip;
}
```

本例Map不存null值，缺失时抛自定义MissingTripException。这个类型通过 `extends Exception` 继承异常基类，用 `super(message)` 让基类保存信息。继承在这里用来表达异常类型关系；不需要为每个业务差异都建立复杂类层级。

`throws` 是方法声明的一部分，告诉调用者可能有这种失败；`throw` 才是在执行时抛出具体异常。该类型属于受检异常（checked exception），调用它的方法必须捕获或继续声明。测试故意漏掉两者，javac报告unreported exception。此前IllegalArgumentException属于非受检异常，不要求同样的声明，但仍然可能在运行时发生。[JLS异常检查](https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html)解释了差别。

受检不代表错误一定可恢复；非受检也不意味着应该忽略。选择异常类型是调用契约的一部分，真正如何恢复由场景决定。

## 在知道怎样反馈的层处理

CLI入口捕获MissingTripException，向stderr显示 `未找到行程: missing` 并退出2。正常路径才调用format和输出。测试确认错误时stdout为空，不产生假摘要。维护命令追加 `-- missing` 可重现该失败；无参数默认读取t1。

更底层的find不打印日志、不返回一个默认“成功对象”，使上层能选择命令行提示或其他反馈。不要写宽泛的 `catch (Exception e) { return "成功"; }`，也不要在不知道如何恢复时吃掉异常。下篇文件读取会继续使用异常，但那里还需要释放资源，单有catch不够。

## 练习：增加第三种格式

在独立副本增加一个Formatter实现，只返回名称，不修改render。分别运行原两种和新格式，确认改变被限制在实现选择处；再尝试删掉format或改成返回int，观察编译器拒绝。随后传缺失id，三种格式都不应被调用。

本例没有依赖注入框架、跨网络重试或数据库写入，也没有将“接口实现可换”扩展为线程安全保证。后续[Java路线](../../roadmaps/java-foundations.md)将继续文件资源、包与运行时。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run contracts --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
