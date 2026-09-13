---
id: j06-java-files-and-resources
title: 读文件失败时，怎样关闭资源并避免半份结果？
description: 用UTF-8行程文件分离读取、校验和结果交付，并验证资源关闭及异常保留。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [j05-java-interfaces-and-exceptions]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L1** · 先修：[接口与异常](java-interfaces-and-exceptions.md) · 目标：读取一份小型行程文件，说明失败时谁负责关闭资源、调用者为什么拿不到半份成功结果。

## 文本先从字节解码，再解释为业务数据

文件内容约定为两列：名称、天数，以制表符分隔，一行一个行程。例如源码中的 `"山城\t3\n海湾\t2\n"` 写入后是两行，`\t` 是制表符，`\n` 是换行。它不是支持引号/转义的通用CSV格式，名称中不接受额外制表符。

`Path` 表示路径，`Files` 提供文件操作，`StandardCharsets.UTF_8` 明确字节到字符的编码。路径字符串不是文件内容。`FileLesson` 只创建自己的临时目录，写入合成文件，结束后删除。示例中的Files.writeString默认选项可能创建或截断文件，因此不把教学路径替换成个人资料。具体行为见 [Files文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html)。

## 结果先留在局部列表

维护实现的load打开reader，再把资源所有权交给readAndClose：

```java
static List<TripModel> load(Path file) throws IOException {
    return readAndClose(Files.newBufferedReader(file, StandardCharsets.UTF_8));
}
```

`BufferedReader` 按字符读并提供readLine。readAndClose内部用while反复读，直到readLine返回null；空行返回空字符串，不能当成文件结束。每行先split成两列，再用DaysInput与TripModel校验，只有成功的对象才加入局部staged列表。

第二行非法时抛IOException，信息带行号，并把原IllegalArgumentException作为cause保留。**只有所有行读完且资源关闭成功，才返回List.copyOf(staged)**。调用方 `current = load(file)` 必须等右侧成功才赋值。实测先读两条合法记录，再读取第二行31天的文件：报“第2行无效”，current仍保留原两条。若捕获后返回staged，调用者会误把第一行当作完整导入结果，负面测试会失败。

这不等于数据库事务。代码没有边读边写外部系统，局部列表失败后不会交付；如果中途发送消息或写库，必须另外设计那些副作用的恢复。

## try-with-resources明确结束所有权

```java
try (BufferedReader reader = owned) {
    // 读取和校验；完整循环见FileLesson.java
}
```

资源实现AutoCloseable时，可用try-with-resources在离开代码块时调用close，正常、return或抛异常都会经过相应关闭逻辑。维护方法名字readAndClose明确它接管并关闭传入reader；调用者不能以为读完后还能继续使用它。

测试用真实BufferedReader的受控子类记录close调用，在成功、空文件和解析失败时都确认关闭；另外覆盖缺文件和坏UTF-8。仅凭“Unix上文件能删除”不能证明reader已关闭，所以这里不拿删除结果替代关闭断言。

资源关闭自己也可能抛异常。`ResourceLesson` 创建A、B两个实现AutoCloseable的小资源，主体故意失败，B与A的close也故意失败。实测关闭顺序为B、A；主异常仍为body failed，两个关闭错误通过getSuppressed保留。规则见 [JLS try-with-resources](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.3)。如果主体成功而关闭失败，也不能把方法当作无错误完成。

## 练习与边界

把第二行改成没有天数、额外第三列或空行，预测应报哪一行，再运行。随后仅在独立副本把抛错改成返回staged，确认原测试发现错误，再恢复。另将资源声明顺序交换，预测关闭顺序与suppressed顺序也随之改变。

本例累计把记录放入内存，适合受控小文件；没有文件大小/记录数限制，不是大文件流式管线。未证明磁盘断电持久性、原子替换或操作系统异常下的清理保证。下一篇：[怎样把多文件Java程序打成可运行JAR？](java-packages-and-jar.md)

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run files --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
