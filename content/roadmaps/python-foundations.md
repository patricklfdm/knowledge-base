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

后续P06–P08测试/迭代/可重跑汇总正在本轮连续建设。完整代码在examples/python-basics；个人练习记录留仓库之外，浏览器等全部规划内容完成后统一验收。

[知识地图](../knowledge-map.md) · [全栈基础](fullstack-foundations.md)
