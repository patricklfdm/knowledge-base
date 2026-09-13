---
id: j01-java-values-and-operations
title: Java 的类型怎样影响运算结果？
description: 用行程天数观察数字与文本、整数除法、条件表达式，以及先运算后转换造成的溢出。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [j00-java-compile-and-run]
topics: [java, types, arithmetic]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L0** · 先修：[源码、编译与运行](java-compile-and-run.md) · 目标：在运行前判断一个表达式做的是数值运算还是文字拼接，解释整数除法和溢出反例。

核验：本文的九行输出及整数作为条件的编译失败均由真实 JDK 验证。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 同样是3，数字和文字用途不同

行程增加两天，应该得到5天；将摘要文字后面追加字符，则可能得到“32”。先看变量保存什么：

```java
int days = 3;
int extra = 2;
String label = "3";
boolean withinLimit = days >= 1 && days <= 30;
```

`int` 是32位有符号整数，`long` 是64位有符号整数；它们的可表示范围有限。`double` 是浮点数类型，可以表示本例的2.5，但不能据此推断所有十进制小数都精确。`boolean` 只有 `true` 和 `false`。这几种是基本类型（primitive type），`String` 则属于引用类型（reference type），这里用于文字。类型决定表达式能做哪些运算，见 [JLS 类型与变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)。对象引用的复制和比较留后续对象单元，本篇不将 String 当作“特殊的整数”。

`days >= 1` 和 `days <= 30` 都产生布尔值，`&&` 表示两者都成立。Java 的条件需要布尔表达式，`if (3) {}` 不能像某些语言一样依赖数字的真假转换；维护测试确认它在编译时失败。这里的范围检查是我们选择的业务规则，Java 的 int 本身并没有30天的限制。

## 加法和拼接从左边逐步观察

```java
System.out.println(days + extra);                 // 5
System.out.println("天数: " + days + extra);       // 天数: 32
System.out.println("天数: " + (days + extra));     // 天数: 5
```

第二行先把“天数: ”和3拼成文字，再追加2。第三行的括号先完成整数加法，再把5写进文字。区别来自表达式结构和操作数类型，不是 println 随机决定格式。[JLS 字符串拼接](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.1)规定了字符串参与 `+` 的行为。

不要把展示文本重新当数值算，也不要用拼接去实现数字相加。下一篇会明确区分 `"3"` 的解析和对3的计算。

## 两个整数相除不会自动保留小数

```java
System.out.println(5 / 2);    // 2
System.out.println(5 / 2.0);  // 2.5
System.out.println(-5 / 2);   // -2
```

前一行的两个操作数都是整数，因此执行整数除法。它朝0截断，`-5 / 2` 的结果为-2，并非向负无穷取整得到-3。`2.0` 是 double 字面量，让第二行进行浮点运算。[JLS 除法](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17.2)给出了整数与浮点除法的区别。

本例用2.5展示类型影响，不是完整的浮点精度教程，也没有验证金额计算方案。需要精确金额时不能从“打印看起来正确”推断算法满足要求。

## 把结果放进long，为什么仍然错？

```java
int largest = Integer.MAX_VALUE;
long tooLate = largest + 1;
long promoted = (long) largest + 1;
System.out.println(tooLate);  // -2147483648
System.out.println(promoted); // 2147483648
```

`Integer.MAX_VALUE` 是 int 最大值2147483647。第二行先按 int 做加法，已经超出 int 范围，得到溢出后的负数，然后才把这个负数转换为 long。接收变量更宽，不能修复先前已经发生的溢出。

第三行的 `(long)` 是显式类型转换（cast）：先将操作数提升为 long，再加1，因此本例可表示2147483648。普通整数加法不会仅因溢出而自动抛异常；具体范围和数值提升规则见 [JLS 整数运算](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.2)。long 也有限，提前转换只解决这个已知边界，不代表任意大数都安全。

## 运行与迁移练习

完整源码是 [java-basics/NumericValues.java](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/java-basics/NumericValues.java)。在仓库根目录使用 Node24.21.0 与 Microsoft JDK21.0.11；将占位路径替换为自己的 JDK 根目录，运行：

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run values --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

演示依次输出5、“天数: 32”、“天数: 5”、2、2.5、-2、true、-2147483648、2147483648。Node 只编排真实编译与启动，临时 class 用完清理，`npm ci` 不会安装 JDK。

练习：在独立副本中把 `extra` 改为4，先预测三个输出，再重新编译；最后把 `(long) largest + 1` 改为 `(long) (largest + 1)`。后一种写法应重新出现溢出的负数，因为括号里的加法仍先按 int 执行。用已有九行断言检查变化，别把预期输出未经修改就当新需求的正确答案。

下一篇：[把文本转成整数以后，为什么还要校验？](java-input-validation.md)
