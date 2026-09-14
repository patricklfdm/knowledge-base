---
id: p01-python-values-and-functions
title: Python中的值怎样变成一条可验证的业务规则？
description: 从数值、字符串、控制流与函数开始，分开文本语法、转换和天数范围。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [p00-python-runtime-and-modules]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 先说清函数接收什么

你已经能[运行维护例子](python-runtime-and-modules.md)。现在从命令行收到天数文本“03”，希望得到整数3；空串、全角数字和31都不能直接当合法行程。先把规则写成三个阶段：检查输入表示、转换成整数、检查业务范围。Python能转换某个文本，并不表示你的接口必须接受那个表示。

函数用def定义，参数名称写在括号内，return把结果交给调用者。代码块由冒号和缩进表达；不写return时，函数正常结束会返回None。print只输出文字，不能代替返回一个供后续计算的值。[函数和控制流](https://docs.python.org/3.13/tutorial/controlflow.html)

## 值的运算遵守具体类型

int表达整数，str表达文本，float表达浮点数。实测7/2得到3.5，-7//2得到-4：//向下取整，不能把它当作一律向零截断。普通Python整数不固定为Java的32位int，本例10**30+1-10**30仍得到1；这不意味着内存和计算时间无限。[数值与运算入门](https://docs.python.org/3.13/tutorial/introduction.html)

字符串"3"与整数3不同。字符串相加可拼接文本，数字相加做数值运算；不要先把所有输入随便转str，否则None和True也被掩盖成一段文字。None用来表达本例的缺失情形，而不是0或空字符串的另一个写法。

## 文本检查先于int转换

维护parse_days的核心如下：

```python
if not isinstance(text, str) or not text or len(text) > 2:
    raise ValueError("days must be 1–2 ASCII digits")
if any(c not in "0123456789" for c in text):
    raise ValueError("days must be 1–2 ASCII digits")
days = int(text)
if not 1 <= days <= 30:
    raise ValueError("days outside 1..30")
return days
```

这是把维护函数的首个条件拆开后的等价说明，不是独立脚本。any检查是否至少一个字符不在允许集合；短路or使前面的类型或空值检查失败时，不再对不合适对象调用后续操作。我们有意接受"03"，拒绝"003"、空白、加号、小数形式和其他数字字符；规则可以不同，但应先明确再验证。

真实测试接受1与30边界，拒绝0、31、"３"和"٣"。这里只处理长度很短的合成天数，不是完整国际化数字输入器。

## 循环累加也需要输入契约

for逐个取得可迭代对象中的值，total从0开始，每次执行total += value。total_days([])得到0；[1,30,2]得到33。函数没有修改输入列表。

一个容易遗漏的边界是bool：Python中bool是int的子类，isinstance(True,int)为真。若业务只接受整数天数而拒绝布尔值，本例用type(value) is int进行精确类型检查，再检查1–30范围。[内置类型规则](https://docs.python.org/3.13/library/stdtypes.html#boolean-type-bool)

这不是宣称所有代码都应禁止子类，而是本例边界契约。独立副本把精确检查换成isinstance时，True被当成1参与累加，维护测试应失败。捕获异常也不能把它随便替换成0，否则错误输入会变成看似成功的统计。

## 预测、运行，再解释差异

演示中的days为3、total为5、division为3.5、floor为-4。练习：把业务范围改为1–14，先列14与15的预期；文本语法是否也要改变？再给total_days传[1,True]，解释它与[1,1]为什么必须得到不同的验证结果。

下一篇：[列表、字典与错误边界](python-containers-and-errors.md)，把单个值组合成行程集合。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py basics
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
