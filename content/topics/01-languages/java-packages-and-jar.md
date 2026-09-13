---
id: j07-java-packages-and-jar
title: 怎样把多文件Java程序打成可运行JAR？
description: 按包组织两份源码，实际编译和打包，定位主类名、入口清单与依赖类缺失。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [j06-java-files-and-resources]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[文件与资源](java-files-and-resources.md) · 目标：把两份Java源码编译成一个可独立启动的JAR，并区分三种常见启动失败。

## 类的名字也包含包名

此前例子为了入门使用未命名包。现在维护目录是：

```text
examples/java-basics/packaged/
  kb/app/Main.java
  kb/trips/TripText.java
```

Main文件以 `package kb.app;` 开头，并写 `import kb.trips.TripText;`。它的完整类名是 `kb.app.Main`，不是Main。TripText的完整类名则是kb.trips.TripText，它提供静态title方法返回摘要文字。

包（package）组织命名与访问边界；import让源码能使用短名字，不负责安装、下载或复制依赖。目录按包层次组织便于工具查找，javac输出也保留包目录。规则见 [JLS 包与模块](https://docs.oracle.com/javase/specs/jls/se21/html/jls-7.html)。包与Java模块系统不是同一个概念；本例使用普通classpath，不创建module-info.java。

## 从源码到产物分三步

在仓库根目录准备JDK21.0.11，替换下面占位路径。所有产物写入新临时目录：

```sh
KB_JAVA_HOME="/path/to/jdk21"
KB_JAVA_OUT=$(mktemp -d)
mkdir "$KB_JAVA_OUT/classes"
"$KB_JAVA_HOME/bin/javac" -encoding UTF-8 --release 21 \
  -d "$KB_JAVA_OUT/classes" \
  examples/java-basics/packaged/kb/app/Main.java \
  examples/java-basics/packaged/kb/trips/TripText.java
"$KB_JAVA_HOME/bin/jar" --create --file "$KB_JAVA_OUT/travel app.jar" \
  --main-class kb.app.Main -C "$KB_JAVA_OUT/classes" .
"$KB_JAVA_HOME/bin/java" -jar "$KB_JAVA_OUT/travel app.jar" "海湾 城"
```

结果为 `行程: 海湾 城`。第一步把两份源码一起编译；第二步将class目录内容放进JAR，`--main-class` 写入入口信息，`-C` 指定归档内容的起点；第三步按JAR入口启动。JAR是归档文件，通常包括class、资源和清单（manifest），它本身不包含你本机整套JDK。命令语义见 [javac](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) 与 [jar](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jar.html) 手册。

运行时仍要有能加载这些class的Java环境。`--release 21`控制目标语义/API和class版本，不把任意外部库变成兼容版本，也不会将JDK塞进JAR。

## “能编译”与“打包完整”分别检查

测试实际列出JAR内容，确认有kb/app/Main.class和kb/trips/TripText.class，再删除测试副本里的源码和散装class目录，仅用JAR成功启动。这样能发现演示偶然依赖工作区产物的情况。

| 故障 | 实际观察 | 修复方向 |
| --- | --- | --- |
| `java -cp classes Main`，实际有包名 | 找不到主类 | 指定kb.app.Main及正确classpath根目录 |
| 创建JAR时未声明入口 | no main manifest attribute | 设置正确的主类清单，或明确用classpath启动 |
| 只打进Main.class，漏掉TripText | NoClassDefFoundError | 包含实际运行依赖，不只复制入口类 |

这三类故障都非零退出，测试没有用“存在一个.jar文件”作为成功依据。[java启动器](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)区分了类启动和JAR启动模式。实际报错文字可能随发行版/语言设置变化，定位时先看阶段和缺失的名称。

## 练习与清理

练习：给TripText更换包名，列出package声明、Main的import、维护目录和JAR检查需要同步的地方。不要只把文件夹改名就认为源码中的包名会自动变化。再故意漏掉TripText，观察编译时可见的类为什么在运行时找不到。

手工例子核对完后，仅清理本次创建的目录：

```sh
rm -r -- "$KB_JAVA_OUT"
unset KB_JAVA_OUT
```

本单元没有引入Maven/Gradle、第三方库解析、模块化JAR或签名发布；这些工具可以自动组织类似步骤，但不能替代对编译产物和运行依赖的理解。下一篇：[JVM进程与内存边界](java-process-and-memory.md)。

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run package --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
