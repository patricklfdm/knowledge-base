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
| J06 | [文件与资源](../topics/01-languages/java-files-and-resources.md) | 错误不交付半份列表，关闭并保留异常 |
| J07 | [包与JAR](../topics/01-languages/java-packages-and-jar.md) | 打包完整依赖，独立启动并定位失败 |
| J08 | [JVM进程与内存](../topics/01-languages/java-process-and-memory.md) | 区分进程状态、class产物与堆上限 |
| J09 | [线程与共享状态](../topics/01-languages/java-threads-and-shared-state.md) | 构造丢更新，解释同一监视器保护的范围 |
| J10 | [任务与取消](../topics/01-languages/java-tasks-and-cancellation.md) | 分别证明等待超时、取消请求与实际结束 |
| J11 | [测量与证据](../topics/01-languages/java-measurement-and-evidence.md) | 先检查等价结果，再保留完整采样条件与输出 |

## 综合迁移练习

这条主线覆盖12个有界单元，使用固定JDK的真实编译、运行和故障对照。完成正文核验不代表读者个人掌握；Spring、JDBC、JPMS、垃圾收集器调优及生产服务留在后续专题，通用系统内容仍有独立路线。

依次完成下列任务，用自己的临时目录和合成数据保存结果；它们是读者练习，不是已交付生产应用：

1. 把命令行文字转换成合法行程对象，解释格式、数值范围与业务范围各在哪一层拒绝。
2. 导入两行UTF-8文本，第二行故意无效。证明没有返回半份列表、资源已关闭；说明返回只读列表为什么仍可能共享可变元素。
3. 将入口与格式化函数放在不同包，打成JAR；移走散装class后启动。缺主入口、缺依赖与业务输入错误各如何定位？
4. 用固定交错复现共享计数错误，再保护一次完整状态更新。另提交可取消任务，分别记录get超时、取消和线程池终止，最后对纯计算先验结果再采样。

遇到错误先回到表格相应单元重现最小例子。个人练习记录保存在仓库之外；不把静态路线用作公开学习进度。

维护例子在仓库 `examples/java-basics/`，使用固定 JDK 的真实编译与启动，产物仅在临时目录。正文记录核验环境和未测边界，学习掌握情况不写入公开站点。

[全栈基础路线](fullstack-foundations.md) · [SQL 深入路线](sql-foundations.md) · [知识地图](../knowledge-map.md)
