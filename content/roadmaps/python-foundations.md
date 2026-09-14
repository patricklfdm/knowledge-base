---
id: roadmap-python-foundations
title: Python基础与数据处理路线
description: 从解释器与语言规则走到类型、文件、测试和可重跑的合成数据汇总。
note_type: navigation
status: seed
draft: false
publish: true
tags: [language, data]
---

先掌握[模块与错误](../topics/01-languages/modules-and-errors.md)。这条路线为已有语言基础的读者补齐Python语法与工程边界，不预设会Python；例子只用标准库、合成数据和自建临时目录。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| P00 | [解释器、venv与模块](../topics/01-languages/python-runtime-and-modules.md) | 区分版本、路径、解析与导入问题 |
| P01 | [值、函数与输入规则](../topics/01-languages/python-values-and-functions.md) | 解释除法、ASCII转换、范围和bool边界 |
| P02 | [容器与错误边界](../topics/01-languages/python-containers-and-errors.md) | 画出共享引用，拒绝重复而非静默覆盖 |
| P03 | [类型注解与模型](../topics/01-languages/python-types-and-models.md) | 区分提示与运行时约束 |
| P04 | [JSON与文件资源](../topics/01-languages/python-json-and-resources.md) | 检查字节/语法/字段，坏行无半结果 |
| P05 | [CSV与十进制金额](../topics/01-languages/python-csv-and-decimal.md) | 保留引号字段，拒绝静默丢分 |
| P06 | [测试与CLI协议](../topics/01-languages/python-tests-and-cli.md) | 对照退出/输出/输入副作用与故意错误 |
| P07 | [迭代器与资源上限](../topics/01-languages/python-iterators-and-limits.md) | 解释惰性失败、一次消费与所有权 |
| P08 | [可重跑数据汇总](../topics/01-languages/python-data-pipeline.md) | 校验关联/重复、零费用、排序与输入摘要 |

P00–P08主线已实现。完整代码在examples/python-basics；个人练习记录留仓库之外，浏览器等全部规划内容完成后统一验收。

[知识地图](../knowledge-map.md) · [全栈基础](fullstack-foundations.md)

## 综合自测

在自己的临时目录，写两条合成行程和带引号备注的费用，先预测各行计数、整数分合计与零费用行；运行维护pipeline，再改金额、重复id、孤儿关联和输入顺序，记录正确结果与失败出口。用逐行生成器比较第二条失败的时机，解释哪些输出已经被消费。

这条主线覆盖基础语言与有界数据处理，第三方数值库、数据平台和AI在后续专题；文章reviewed不表示个人掌握。
