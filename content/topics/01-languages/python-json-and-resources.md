---
id: p04-python-json-and-resources
title: JSON能解析，就代表文件里的行程可以使用吗？
description: 区分字节、文本、JSON与业务记录，并明确文件资源和失败结果的边界。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [p03-python-types-and-models]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 一份文件要经过四层检查

已有[Trip类型模型](python-types-and-models.md)后，可以把文件内容转换成对象。整个过程是：读取有限字节→严格UTF-8解码→解析JSON→逐条业务校验。每层都有自己的错误；JSON语法合法不代表字段完整，也不代表行程id唯一。

文件路径由维护演示的TemporaryDirectory创建，测试不把用户已有文件当实验材料。read_utf8接受路径只读，不会因为文件不存在就创建一个空库或空文件。

## 读取上限按字节计算

read_utf8先以rb二进制模式打开，最多读取limit+1字节，超过limit立即拒绝。多读一个字节是为了区分“恰好到上限”和“实际还有数据”，避免先无限read()再补长度判断。

```python
with path.open("rb") as source:
    raw = source.read(limit + 1)
if len(raw) > limit:
    raise InvalidData("input byte limit exceeded")
return raw.decode("utf-8", errors="strict")
```

with是上下文管理（context management）语法；离开文件上下文时会关闭文件，包括异常路径。这里关闭在解码前发生，解码失败也不会留着打开的句柄。它不负责撤销已经写出去的业务操作。[文件读写与with](https://docs.python.org/3.13/tutorial/inputoutput.html#reading-and-writing-files)

测试用一个汉字：UTF-8为3字节，上限3接受，上限2拒绝；0xff触发UnicodeDecodeError。默认8192字节只适合本课程的小JSON，不应直接当作大文件导入方案。

## JSON默认行为可能比业务契约宽

json.loads把文本转换成Python值：数组变list，对象变dict，true变True，null变None。本例顶层要求list，最多100条；每条必须通过Trip.from_mapping，重复行程id拒绝。空数组是合法的零行程数据，不等于缺文件。

另有两类需要显式处理的默认行为：重复对象键可能只保留后值；NaN/Infinity扩展不符合本例要求的严格JSON数值。维护代码用object_pairs_hook逐对检查重复键，用parse_constant拒绝这些特殊常量。[json解析钩子与默认扩展](https://docs.python.org/3.13/library/json.html)

因此不要把重复键检查放到解析完成的普通字典之后：那时重复信息已经可能丢失。这些钩子仍不是文件真实性、签名或访问授权机制。

## 第二条失败，不返回第一条当完整导入

load_trips在局部result中收集已校验对象，只在全列表通过后返回tuple。第二条days=False时，异常带trip record 2上下文，并用`raise ... from error`保留原始原因。调用者不会获得一个伪装成成功的单条结果；输入文件字节在前后保持不变。

这里的“没有半结果”只针对该函数的返回值。若改成逐条写数据库，就必须另行定义事务与回滚；with或tuple本身都不能代替事务。也不要用except Exception后return []，把缺文件、坏编码和程序错误混成“没有行程”。[异常链](https://docs.python.org/3.13/tutorial/errors.html#exception-chaining)

## 验证与改变条件

真实测试覆盖中文往返、字节上限、缺文件、坏编码、截断JSON、重复键、特殊数值、错误顶层、第二条业务错误及重复id。演示读取山城3天，来源与得到的对象字段一致。

练习：先写一个合法第一条、非法第二条的合成文件，预测调用者能拿到什么；再把第二条改合法，返回条数应怎样变化？最后比较删除字段、多余字段和重复JSON键，指出错误分别在解析钩子还是模型层被发现。只在自己创建的临时目录操作。

下一篇：[CSV字段与十进制金额](python-csv-and-decimal.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py data
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
