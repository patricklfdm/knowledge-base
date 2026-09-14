---
id: p02-python-containers-and-errors
title: 复制了Python列表，为什么原来的行程仍被改动？
description: 结合列表、字典和异常理解对象共享、缺失与重复数据，避免悄悄覆盖。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [p01-python-values-and-functions]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 一份列表可能有多个名字

先理解[值、函数和输入规则](python-values-and-functions.md)。现在列表中存放行程字典，每个字典还有labels列表。执行alias = source只让两个名称指向同一对象，没有复制数据；source.copy()创建新的外层列表，但里面仍是原来的字典。

```python
source = [{"id": "t1", "labels": ["山城"]}]
shallow = list(source)
shallow[0]["labels"].append("徒步")
```

这段改变也能从source看到，因为两份外层列表共享嵌套对象。测试分别检查外层身份、内层身份和最终内容；只检查列表长度相同不足以发现共享。[数据结构教程](https://docs.python.org/3.13/tutorial/datastructures.html)

浅复制（shallow copy）复制一层容器；深复制（deep copy）递归处理对象图。对本例普通列表/字典/字符串，copy.deepcopy产生独立labels，修改浅副本后深副本仍只有“山城”。不能由此推导数据库连接或文件句柄都适合深复制；先考虑数据的所有权和修改范围。[copy模块](https://docs.python.org/3.13/library/copy.html)

## 默认参数对象不会每次重建

函数参数默认值在定义执行时求值。维护shared_default故意写成labels=[]，调用a再调用b，两次返回同一个列表，第一次拿到的结果也变成[a,b]。这个函数仅作反例，测试在前后清理它自己的默认列表，避免互相污染。

修复版add_label用None表示“调用者没提供列表”，在函数内部创建，并返回一个新列表：

```python
def add_label(label, labels=None):
    if labels is None:
        labels = []
    return [*labels, label]
```

星号在这里展开已有元素。实测分别调用a、b得到[a]与[b]。若labels中的元素本身可变，这种展开仍是浅复制，不能把前面的问题遗忘。[默认参数规则](https://docs.python.org/3.13/tutorial/controlflow.html#default-argument-values)

## 字典按键查找，但默认不替你拒绝重复

字典（dict）将键关联到值。result["missing"]会抛KeyError；result.get("missing")默认返回None。若合法值也可能为None，需要用`key in result`判断存在，不能用真假值猜测。集合set可以表达唯一值集合，但没有本例需要的键到行程映射。[内置映射类型](https://docs.python.org/3.13/library/stdtypes.html#mapping-types-dict)

用字典推导式收集两条同id记录时，后者会覆盖前者。维护index_unique明确先检查重复，再保存dict(row)浅副本。测试证明重复被拒绝，修改返回行的days不改原行；它没有承诺嵌套对象完全独立。

推导式是构造容器的紧凑语法，不是数据质量规则。业务要求唯一就应显式拒绝重复，不能把“最终只有一个键”当输入没有重复的证据。

## 异常要在知道怎样处理的地方处理

ValueError表示本例输入值不合契约；KeyError表示查找缺失键。try/except只捕获明确可处理的错误，未知异常继续向外传播，避免返回一份看似完整的空结果。`raise`可以把当前异常重新交给上层。[Python异常处理](https://docs.python.org/3.13/tutorial/errors.html)

index_unique在内部新建结果，遇重复直接抛错，没有把半份结果写进调用者字典。与之不同，如果函数已经写文件或发请求，抛异常不会自动撤销副作用。后续文件与CLI单元会继续明确这个边界。

## 迁移练习

先画source、shallow、内层字典与labels的引用关系，再运行别名对照。把行程增加一个嵌套字段，预测dict(row)修改哪些字段会影响原对象。最后输入同id两行，比较“后者覆盖”“保留第一条”“拒绝重复”三种策略，并为自己选择的契约写预期。

下一部分将给行程增加明确类型模型和文件输入，当前学习顺序见[Python路线](../../roadmaps/python-foundations.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py basics
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
