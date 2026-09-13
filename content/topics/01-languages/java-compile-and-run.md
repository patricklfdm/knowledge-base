---
id: j00-java-compile-and-run
title: Java 源码如何变成正在运行的程序？
description: 从行程摘要开始，区分源码、编译产物和启动过程，并定位类型错误、类路径错误与旧产物。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f04-modules-errors]
topics: [java, compilation, debugging]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L0** · 先修：[模块与错误边界](modules-and-errors.md) · 目标：亲手编译并运行一个 Java 程序，根据失败发生的阶段寻找原因。

核验：真实 JDK 编译、启动、含空格中文参数、类型错误、主类错误、旧 class 与重新编译均已执行。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 为什么改了源码，输出还是旧的？

假设你已经用 JavaScript 输出过行程，现在希望学习 Java，把“山城，3天”写成一个小程序。容易混淆的地方是：编辑器保存的是源码，而下面选择的启动方式运行的是编译产物。两个文件不是同一件东西。

开发工具包 JDK（Java Development Kit）提供编译器 `javac` 和启动命令 `java`。`javac` 检查源码并生成 class 文件；`java` 启动 Java 虚拟机 JVM（Java Virtual Machine），加载指定的类，调用入口方法。class 文件含字节码等信息，不是可以直接当 shell 脚本执行的文本。[javac 官方说明](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html)解释了源文件与类文件的关系。

```text
TripSummary.java --javac--> classes/TripSummary.class
                                      |
                            java -cp classes TripSummary
                                      |
                                调用 main，输出摘要
```

Java 也支持直接启动源文件的模式。本篇刻意分开编译和运行，让每个阶段可观察；并不是说 Java 永远需要手工执行两条命令。[java 启动模式](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)区分了类、JAR 和源文件等入口。

## 先读懂最小程序

维护源码在 [examples/java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)，其中 `TripSummary.java` 完整内容如下：

```java
public class TripSummary {
    public static void main(String[] args) {
        String destination = args.length == 0 ? "山城" : args[0];
        int days = 3;
        System.out.println(destination + ": " + days + "天");
    }
}
```

这里的类（class）先作为代码的命名容器理解，后续再讨论对象。公开顶层类名是 `TripSummary`，文件名必须匹配为 `TripSummary.java`，大小写也保留。大括号限定代码块，语句以分号结束。

`main` 是本例采用的标准入口。`public` 使入口可被访问；`static` 表示调用它不用先创建本类对象；`void` 表示方法不返回一个值；`String[] args` 是字符串数组，保存启动时传入的参数。它不会包含命令里的类名。

`String` 用于文本，`int` 用于本例的整数天数。`args.length == 0 ? "山城" : args[0]` 是条件表达式：没有参数就用山城，否则取第一个参数。先检查长度，才不会在空数组里取第一项。`System.out.println` 向标准输出写一行；这行中的 `+` 将文字和天数组合成摘要。这里暂不接受天数参数，也没有声称完成输入校验。

## 编译到自己的临时目录

需要已安装的 **JDK 21.0.11**。本批实际使用 Microsoft OpenJDK 21.0.11+10；其他版本未作为本例验收环境。`npm ci` 不会安装 JDK。下面在仓库根目录、macOS/Linux 的 sh 兼容终端执行；将第一行替换为你自己的 JDK 根目录，里面应有 `bin/java` 和 `bin/javac`。不要照抄占位路径。

```sh
KB_JAVA_HOME="/path/to/jdk21"
"$KB_JAVA_HOME/bin/java" --version
"$KB_JAVA_HOME/bin/javac" --version
KB_JAVA_OUT=$(mktemp -d)
"$KB_JAVA_HOME/bin/javac" -encoding UTF-8 --release 21 \
  -d "$KB_JAVA_OUT" examples/java-basics/TripSummary.java
"$KB_JAVA_HOME/bin/java" -cp "$KB_JAVA_OUT" TripSummary
"$KB_JAVA_HOME/bin/java" -cp "$KB_JAVA_OUT" TripSummary "海湾 城"
```

最后两条分别输出 `山城: 3天`、`海湾 城: 3天`。引号让“海湾 城”作为一个参数，而不是按空格分成两个；程序只使用第一个参数，多余参数在本例中被忽略。

`-encoding UTF-8` 指定源码编码；`--release 21` 指定编译目标版本，它并不会替你安装 JDK；`-d` 指定生成文件的目录。`-cp` 是类路径（classpath）：启动器到哪里找类。这里传的是包含 `TripSummary.class` 的目录，后面传类名 `TripSummary`，不写 `.class` 后缀。相关选项可对照 [javac](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) 和 [java](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) 手册。

本篇无包声明、第三方库或 JAR；引入包以后，类名和目录层次需要一起理解，不能把当前单文件命令直接套到任意工程。上面变量只在当前 shell 中设置，不修改系统默认 Java。核对输出后，仅清理刚创建的产物目录：

```sh
rm -r -- "$KB_JAVA_OUT"
unset KB_JAVA_OUT
```

## 用错误发生的位置缩小范围

在独立副本中做错误练习，不要修改唯一的维护源码。

| 改变条件 | 本轮实测 | 应检查什么 |
| --- | --- | --- |
| `int days = "3";` | javac 非零退出，报告 incompatible types | 文本不能直接赋给 int；先改源码 |
| 源文件改名 WrongName.java，公开类仍叫 TripSummary | javac 非零退出 | 公开类名与文件名不匹配 |
| 编译成功，启动时传错类名或类路径 | java 非零退出，找不到主类 | 查找目录、类名，而非先改业务规则 |
| `public class NoMain {}` | 可编译，启动时找不到 main | 编译出一个类不代表它具有程序入口 |

英文错误片段来自本批实测，不要求其他 JDK 或本地语言设置逐字相同。重点先看是 `javac` 还是 `java` 失败，再结合退出码和错误信息定位。本例测试特意固定子进程语言便于断言，不修改你的全局语言设置。

## 一次旧产物练习

先编译天数3的副本，再把源码改成5，只运行 `java`。你预测看到多少？然后重新运行 `javac` 和 `java`。最后将源码改成错误的 `int days = "bad";`，编译失败后，原来的 class 还在不在？

参考结果：只保存源码后仍输出3；成功重新编译后输出5；本例的失败编译不会删除此前成功生成的 class，所以继续启动仍可能输出5。看到“程序还能运行”不能证明“当前源码编译成功”。测试在全新输出目录中另外验证，第一次编译就失败时并没有生成可运行 class。

实际工作中应检查编译退出状态，失败就停止后续运行。维护演示脚本正是先确认编译成功，再启动；测试旧产物时则刻意分开两步，以观察容易误判的情况。这个单文件实验不等于承诺任意大型增量构建在失败后的产物状态。

## 自动重现与下一步

使用仓库固定的 Node 24.21.0，在根目录执行；`KB_JAVA_HOME` 的值仍需换成实际 JDK 路径：

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run demo --prefix examples/java-basics -- "海湾 城"
```

Node 仅编排真实的 `javac`/`java` 子进程，未模拟 Java。其中J00的七组测试覆盖正常、边界、故障和清理；整个包还运行后续单元，当前清单见示例README。每次编译使用自建临时目录，结束后删除，仓库不保存 class。缺 JDK 或版本不符会失败，不会悄悄跳过。详细环境约束见示例 README。

下一篇：[Java 的类型怎样影响运算结果？](java-values-and-operations.md)，继续观察数字、文字与整数边界，再进入输入校验。也可返回 [Java 基础路线](../../roadmaps/java-foundations.md)。
