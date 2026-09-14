---
id: p03-python-types-and-models
title: 写了Python类型注解，为什么错误数据仍能进来？
description: 用dataclass和显式边界校验区分类型提示、对象构造与业务约束。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [p02-python-containers-and-errors]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 从任意字典到可信行程

先完成[容器与错误边界](python-containers-and-errors.md)。文件里的一条记录可能缺少days，也可能写成true。给函数参数标上dict或给字段写int，Python会替我们拒绝这些输入吗？维护annotated_name声明输入和返回为str，但实际传入3仍返回3，证明注解本身不执行转换或拒绝。

类型注解（type annotation）向读者和静态检查工具描述预期。它有助于发现程序内的类型使用问题，却不是文件、网络或用户输入的运行时验证器。本例没有运行第三方静态类型检查器，不把unittest成功称作类型检查成功。[typing说明](https://docs.python.org/3.13/library/typing.html)

## 用数据类表达字段，但自己维护不变量

Trip用数据类（dataclass）声明id、destination与days。类（class）描述对象的字段和行为；self指向当前实例。装饰器@dataclass为类添加常用方法，例如按字段生成的初始化与相等比较，减少重复样板代码。

```python
@dataclass(frozen=True)
class Trip:
    id: str
    destination: str
    days: int

    def __post_init__(self):
        # 维护代码在此校验id、名称与天数
        if type(self.days) is not int or not 1 <= self.days <= 30:
            raise InvalidData("days must be integer 1..30")
```

这是维护模型的核心片段，完整校验见model.py。自动生成初始化完成字段赋值后，会调用__post_init__；正是我们写出的判断拒绝了False和字符串"3"，不是字段后的int注解。InvalidData继承ValueError，代表本例已知输入契约错误。[dataclass规则](https://docs.python.org/3.13/library/dataclasses.html)

## 外部形状和内部字段各检查一次

from_mapping先确认对象是字典、键恰好为id/destination/days，再构造Trip。@classmethod使方法收到类本身cls，因此可以返回cls(...)创建该类实例；调用者使用Trip.from_mapping(row)。

本例id为1–16个小写ASCII字母或数字且首位为字母；名称长度1–80且没有首尾空白；days为真正的int且在1–30内。我们拒绝多余字段，避免输入拼错字段却被悄悄忽略。若以后要允许额外字段，需要显式改变契约及测试，而不是随手删检查。

名称长度用Python len计字符串码点，不是UTF-8字节数，也不是所有组合文字的视觉字符数。代码没有做Unicode规范化或地区语言规则；文件输入字节限额在下一单元另行处理。

## frozen不等于任何状态都不可变

frozen=True阻止普通字段赋值。实测对已构造Trip执行trip.days=4得到FrozenInstanceError；两份字段相同的Trip可以相等比较。本例字段都是字符串或整数，不暴露可变列表。

如果以后把labels:list[str]加入frozen数据类，外层不能重新赋值不代表labels.append被禁止。这个边界与上一篇浅复制的问题相连。不要把frozen称作权限保护或整个对象图绝对不可变。[冻结实例限制](https://docs.python.org/3.13/library/dataclasses.html#frozen-instances)

## 测什么，才证明入口有保护？

维护测试既调用from_mapping，也直接调用Trip构造：缺字段、多余字段、类型错误、非法id、空/超长/首尾空白名称与天数边界都被拒绝。有效对象的字段和相等结果另有断言，不是只判断“某条输入能抛错”。

练习：给Trip添加可选标签，先决定共享可变列表是否允许；然后把days上界改14，对直接构造与from_mapping都测试14/15。最后去掉__post_init__，预测哪几组测试应失败，解释为什么注解仍然没有执行校验。

下一篇：[从UTF-8和JSON读取行程](python-json-and-resources.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py data
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
