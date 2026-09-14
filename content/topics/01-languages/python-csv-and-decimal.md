---
id: p05-python-csv-and-decimal
title: CSV里的逗号和1.15元，为什么不能随便split和转float？
description: 用标准CSV解析和明确金额语法保留字段边界，验证十进制到整数分的精确转换。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [p04-python-json-and-resources]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 先确定文件格式与金额契约

你已经会[分层读取JSON](python-json-and-resources.md)。费用文件改成CSV，表头为expense_id,trip_id,amount,note；一条备注是“车票,往返”，另一条包含换行。如果直接split逗号或把每个物理行当一条记录，合法备注会被拆坏。

CSV用分隔符、引号等规则表达字段，具体方言仍需约定。本例固定逗号、双引号和四个表头字段，使用csv.reader(...,strict=True)，不自动猜任意文件的分隔符。[csv模块](https://docs.python.org/3.13/library/csv.html)

## 记录边界不等于换行字符的位置

维护代码通过io.StringIO(text,newline="")提供文本流，让CSV解析器处理引号内的逗号和换行。真实测试读取"车票,往返"为一个字段，另一个字段保留“一行
二行”；按splitlines计出的物理行数多于逻辑记录数。

如果从真实文本文件直接读CSV，同样应明确UTF-8和newline=""；本例先限制总字节再在内存中解析，最多64KiB与100条费用记录。它是有界小文件处理器，暂不声称流式大数据。

表头顺序必须匹配；缺列、多列、不闭合引号、超条数或金额非法都拒绝。报错的expense record编号是表头之后的逻辑记录序号，不是引号跨行时的物理行号。

## 十进制输入不要先经过二进制float

我们要求非负金额，整数部分最多6位、无多余前导零，小数最多2位，不接受空白、指数、正负号、NaN或Infinity。这里金额仅为合成数据中的“元到分”，没有多币种、税率、退款和舍入政策。

维护parse_cents先用fullmatch检查整个文本，再从原字符串构造Decimal：

```python
with localcontext() as context:
    context.prec = 16
    return int(Decimal(text) * 100)
```

局部上下文不改变调用者全局精度；在本例限制内，乘100得到精确整数分。Decimal(text)保留十进制表示，Decimal(float(text))则已经接收了浮点近似，不能补回原字符串的精度。[Decimal与上下文](https://docs.python.org/3.13/library/decimal.html)

实际对照：int(float("1.15")*100)为114，而维护解析结果为115；0.29得到29，999999.99得到99999999。这里int在浮点乘法后截断，把近似误差变成丢分。不是所有金额都会触发相同错误，所以必须选择能检出的测试输入。

## 不默默决定怎样舍入

1.001在本契约中被拒绝，不自动改成1.00。若业务后来接受三位小数，必须先决定舍入发生时机、模式和累计规则，再用Decimal.quantize等机制实现并核验；不能一看到Decimal就认为财务语义已经完整。

每条费用构造成Expense，包含自身id、trip_id、整数分与备注。当前解析器验证单条字段和文件形状；跨文件的行程存在性与费用id唯一性留综合处理单元明确检查。解析成功不表示关联完整。

## 迁移练习

先给备注加入逗号、引号与换行，预测标准CSV解析和手写split的不同结果。再把金额换成1.001、1e2与0.29，分别说明失败、失败、29的原因；不要把拒绝指数误称为Python不能处理指数。

独立故障对照把Decimal转换改成float后，金额断言应检出114与115的差异，恢复后重跑整套测试。下一部分把这些规则接到测试、迭代器和可重跑汇总中，见[Python路线](../../roadmaps/python-foundations.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py data
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
