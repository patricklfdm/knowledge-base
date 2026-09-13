---
id: roadmap-java-foundations
title: Java 基础与系统学习路线
description: 从编译运行开始，逐步学习 Java 语言和系统边界；只链接已经核验的正文。
note_type: navigation
status: seed
draft: false
publish: true
tags: [languages]
---

先具备[模块与错误边界](../topics/01-languages/modules-and-errors.md)所用的变量、函数和数组基础，再进入第二条语言主线。本文不要求先学框架，也不读取其他项目材料。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| J00 | [Java 源码如何变成正在运行的程序？](../topics/01-languages/java-compile-and-run.md) | 区分源码、class 与 JVM；预测未重新编译和编译失败后的输出 |
| J01 | [类型与运算结果](../topics/01-languages/java-values-and-operations.md) | 解释拼接、整数除法及先运算后转long的反例 |
| J02 | [文本转换与输入校验](../topics/01-languages/java-input-validation.md) | 区分字符、表示范围和业务规则，验证失败没有成功输出 |
| J03 | [对象与引用](../topics/01-languages/java-objects-and-references.md) | 区分别名、复制与形参重绑 |
| J04 | [集合与复制](../topics/01-languages/java-collections-and-copies.md) | 解释容器与元素的两层共享 |
| J05 | [接口与异常](../topics/01-languages/java-interfaces-and-exceptions.md) | 替换实现，保留缺失错误 |

文件资源、包/JAR、JVM进程、线程/任务取消与测量方法是本Java主线剩余单元，按工程计划连续实现。当前路线不是全部Java生态的目录。

维护例子在仓库 `examples/java-basics/`，使用固定 JDK 的真实编译与启动，产物仅在临时目录。正文记录核验环境和未测边界，学习掌握情况不写入公开站点。

[全栈基础路线](fullstack-foundations.md) · [SQL 深入路线](sql-foundations.md) · [知识地图](../knowledge-map.md)
