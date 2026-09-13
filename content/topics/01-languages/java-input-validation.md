---
id: j02-java-input-validation
title: 把文本转成整数以后，为什么还要校验？
description: 将命令行天数按字符格式、整数表示范围和业务范围分层验证，失败时保留错误与原有值。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [j01-java-values-and-operations]
topics: [java, validation, errors]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L0** · 先修：[值、类型与运算](java-values-and-operations.md) · 目标：把外部文本转换为1–30天的整数，解释不同失败，并确认失败没有伪装成成功。

核验：合法值、端点、前导零、空白、符号、小数、非ASCII数字、整数溢出、null、CLI参数个数和退出码均已实跑。浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。

## 命令行传进来的是文本

上一例的 `int days = 3` 是作者写进源码的值。现在希望运行时传入天数：用户给出的 `"3"`、`"31"`、`"3.0"` 都先进入 `String[] args`。编译器知道参数是 String，却不知道文字是否符合业务规则。

本例的输入契约是：**一个参数，只含ASCII字符0–9，允许前导零，数值在1–30之间**。不自动去除空白，不接受正负号、小数或其他数字字符。这是教学产品的明确选择，不是Java所有数字解析的统一规则。真实产品可选择不同政策，但实现、说明和测试要一起改变。

| 输入 | 结果 | 原因 |
| --- | --- | --- |
| `1`、`30` | 接受 | 两端点都包含 |
| `03` | 得到3 | 本例允许前导零，按十进制解析 |
| 空字符串、` 3`、`+3`、`-1`、`3.0`、`٣`、`３` | 拒绝 | 不满足ASCII数字串契约 |
| `2147483648` | 拒绝 | 字符格式正确，但超过int最大值 |
| `0`、`31`、`2147483647` | 拒绝 | 能表示为int，但不是1–30天 |

## 三层检查分别回答什么

维护实现位于 [DaysInput.java](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/java-basics/DaysInput.java)。下面是类中的完整解析方法，需放在该类内编译；CLI入口见源码。

```java
public static int parse(String raw) {
    if (raw == null || !raw.matches("[0-9]+")) {
        throw new IllegalArgumentException("天数只能包含ASCII数字0–9，不能为空");
    }
    final int days;
    try {
        days = Integer.parseInt(raw);
    } catch (NumberFormatException error) {
        throw new IllegalArgumentException("天数超出int表示范围", error);
    }
    if (days < 1 || days > 30) {
        throw new IllegalArgumentException("天数必须在1–30之间");
    }
    return days;
}
```

第一层是字符格式。`null` 表示没有字符串对象，它和空字符串 `""` 不同；`||` 是短路“或”，前面已经为true，就不执行后面的 `raw.matches`，从而避免在null上调用方法。`!` 表示取反。正则表达式 `[0-9]+` 表示一个或多个ASCII数字；`String.matches` 检查整个字符串，尾部换行也不会被当成合法数字。参见 [String.matches](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html#matches(java.lang.String))。

第二层是转换与表示范围。`Integer.parseInt` 返回int，不能表示的输入会抛出 `NumberFormatException`。这里已经限定了非空数字串，因此该失败被解释为超出int范围，并保留原异常作为原因。`final int days` 表示这个局部变量赋值后不再重新赋值；编译器也会检查正常路径使用前已赋值。

第三层是业务规则。`days < 1 || days > 30` 明确拒绝范围之外的数，全部通过才 `return days`。返回类型int保证调用者拿到整数，额外的检查才保证它属于本例的合法天数。

[Integer.parseInt文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html#parseInt(java.lang.String))的语法比本例宽：它允许前置正负号，并通过数字字符规则解析。本批实际对照确认 `Integer.parseInt("+3")` 和 `Integer.parseInt("٣")` 都得到3，而我们的方法拒绝它们。不能把前置ASCII限制的效果归功于parseInt本身。

## 在入口显示错误，在规则里保留失败

`IllegalArgumentException` 表示本次参数不满足方法约定；`throw` 立即中断正常返回路径，调用者用 `try/catch` 在合适边界处理。本例只在CLI入口将预期输入错误转为可读文字：失败写标准错误 stderr，退出码为2；成功才向标准输出 stdout 写 `已验证天数: 3`，退出码为0。参数不是恰好一个时显示用法并退出，不忽略多余参数。

不要捕获后返回0作为“默认成功”。0既不在合法范围内，也会让调用者丢失失败原因。本例的Java直接调用测试从 `current = 5` 开始，在 `current = DaysInput.parse(raw)` 处传入null、31或bad：异常让赋值无法完成，current仍是5；之后合法30仍可成功。原字符串 `"03"` 也保持原样，解析返回3而不修改输入。

这个方法没有文件、数据库或网络写入。因此这里的“无副作用”只指纯解析与调用者赋值的实际观察，不承诺任意应用的保存操作会自动回滚。接入服务时，应在所有必要校验之后才进入写入步骤。

## 重现和改变规则

在仓库根目录使用固定Node24.21.0、Microsoft JDK21.0.11；`KB_JAVA_HOME` 必须替换为自己的真实JDK根目录：

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run input --prefix examples/java-basics -- 3
KB_JAVA_HOME="/path/to/jdk21" npm run input --prefix examples/java-basics -- 31
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

第二条输出成功摘要。第三条故意失败，stderr为“天数必须在1–30之间”，退出2，没有成功摘要；不要把这一步的预期非零当作安装失败。Node入口保留Java退出码并清理临时编译产物。测试入口包含J00和本单元共15组，均调用真实JDK。

练习：把业务上限改为14，先列出1、14、15、30的预期结果，再在独立副本同步修改实现、错误文字和测试。另做故障对照：只删除上界判断，保留原测试，31必须让测试失败；恢复后重跑。单测需要证明坏输入被拒绝，不能只证明3能通过。

本例不是公网请求入口，没有输入字节上限、速率控制或并发压测，不声称可直接承担生产输入防护。下一篇[对象与引用](java-objects-and-references.md)继续组织行程数据，也可回到 [Java基础路线](../../roadmaps/java-foundations.md) 可查看已有内容。
