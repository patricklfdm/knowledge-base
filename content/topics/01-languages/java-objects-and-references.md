---
id: j03-java-objects-and-references
title: 复制了变量，为什么原来的行程也变了？
description: 用构造方法与私有字段建立行程对象，区分别名、对象复制和方法参数重新赋值。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [j02-java-input-validation]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L0** · 先修：[输入校验](java-input-validation.md) · 目标：创建一个一直满足约束的对象，并预测引用赋值和方法调用的影响。

## 把名称和天数放在同一个对象里

多个行程不能都靠一组同名局部变量管理。类描述字段与操作，对象是按这份描述创建的具体实例。维护的 `TripModel` 有不可重新赋值的名称和可修改的天数：

```java
private final String name;
private int days;
public TripModel(String name, int days) {
    if (name == null || name.isBlank()) throw new IllegalArgumentException("名称不能为空");
    this.name = name;
    setDays(days);
}
public void setDays(int days) {
    if (days < 1 || days > 30) throw new IllegalArgumentException("天数必须在1–30之间");
    this.days = days;
}
```

这是类内片段，完整定义在 `TripModel.java`。与类同名、没有返回类型的是构造方法（constructor），`new TripModel("山城", 3)` 调用它创建对象。`this.days` 指当前对象的字段，右边的 `days` 是方法参数；名称相同不表示它们是同一个变量。

`private` 让调用者通过方法操作而不能直接写字段。先校验再赋值，非法修改不会把对象留在99天的状态。测试从3天尝试改成0或31，失败后仍为3；直接写 `t.days = 99` 会编译失败。`final String name` 限制字段再次赋值，不意味着任意final引用指向的对象都不可变。

## 引用赋值不创建另一个对象

```java
TripModel original = new TripModel("山城", 3);
TripModel alias = original;
TripModel copy = original.copy();
alias.setDays(5);
```

对象引用（reference）是定位对象的值。赋值给alias后，两个变量持有指向同一对象的引用；经alias修改，original读到的也是5。`copy()` 则实际调用 `new TripModel(name, days)`，创建新对象，仍保留3天。对象与引用的区别见 [JLS 引用类型与对象](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3.1)。

本例的name是不可变String、days是基本类型，所以这样复制足以分离可变状态。如果将来对象内部增加可变列表，必须重新决定是否复制列表和列表元素，不能给这个方法一个“万能深复制”的保证。

## Java参数也是值传递

```java
static void change(TripModel trip) { trip.setDays(5); }
static void rebind(TripModel trip) { trip = new TripModel("另一程", 9); }
```

调用方法时，参数获得传入值的副本；对引用参数而言，复制的是引用值。`change` 仍能到达原对象并修改字段；`rebind` 只把自己的局部参数换成新引用，调用者的变量不跟着改。这与基本类型参数复制数值属于同一个值传递规则，不需要发明“对象按引用传递”的例外。[JLS 方法调用与形参赋值](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5)给出了机制。

`ObjectLesson` 实测依次得到original=5、alias=5、copy=3。`original == alias`为true，`original == copy`为false：引用的 `==` 比较是否指向同一对象。字符串内容比较使用 `.equals`；例子特意创建另一个同内容String，内容比较仍为true。自定义类未重写equals时不要假定它会逐字段比较。

## 练习：在不修改原对象时延长行程

先预测 `TripModel changed = original; changed.setDays(7)` 的结果，再改成调用copy后修改。需要保留原行程3天时，前者不满足需求。另把setDays的赋值移动到校验之前，观察非法输入测试能否发现原值已被破坏，然后恢复。

对象封装能维护单个对象的约束，但不是线程同步，也不会自动保存到数据库。下一篇将把多个对象放入[集合](java-collections-and-copies.md)。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run objects --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
