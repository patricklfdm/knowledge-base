---
id: p06-python-tests-and-cli
title: Python测试通过，怎样证明命令行工具真的按约定工作？
description: 把规则断言、真实子进程和退出协议分开验证，让错误能阻止成功输出。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [p05-python-csv-and-decimal]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 测试从输入和预期开始

已经有[CSV和金额规则](python-csv-and-decimal.md)，现在让用户通过命令行生成报告。单独验证parse_cents("1.15")==115还不够：如果CLI捕获所有错误后打印空报告，内部函数正确，用户仍会收到错误的成功信号。

单元测试（unit test）检查有明确输入输出的小边界，集成测试（integration test）检查模块组合；真实子进程测试还覆盖入口参数、退出状态、stdout和stderr。它们回答不同问题，不用一个“运行成功”概括全部证据。

## 用独立预期检查业务结果

unittest.TestCase中以test_开头的方法被本例发现并执行。assertEqual比较实际值与预先确定的答案，assertRaises确认错误类型，subTest标记一组改变条件的输入。维护测试从1.15元应为115分出发，不再调用同一转换函数计算“预期”。[unittest说明](https://docs.python.org/3.13/library/unittest.html)

```python
self.assertEqual(parse_cents("1.15"), 115)
with self.assertRaises(InvalidData):
    parse_cents("1.001")
```

返回值和拒绝路径各有断言。测试目录由TemporaryDirectory创建，失败也会退出上下文清理；原始输入前后比较，防止只检查报错却漏掉文件已被改写。没有把用户目录作为临时测试数据。

独立副本已实际把Decimal换成float，金额测试失败，恢复后通过。suite还用一条故意错误的预期演示unittest的失败结果，并由外层断言核对其确实失败；不是把失败输出忽略后宣称全部正确。

## CLI有自己的协议

run.py summarize接受两个路径：行程JSON和费用CSV。argparse负责参数形状、--help与用法错误，业务解析交给已有模块；把参数成功解析成Path不表示文件存在或内容合法。[argparse](https://docs.python.org/3.13/library/argparse.html)

正常时，工具先完整构建报告，再向stdout打印一份JSON并退出0。已知输入错误写stderr并退出2，stdout为空；未知RuntimeError继续传播，不能被转换为一份空报告。数字2是本例CLI约定，不应推断所有程序都采用相同退出码。

```sh
python3 -I -B examples/python-basics/run.py summarize --help
```

这条帮助命令可直接从仓库根运行。具体输入样本由pipeline演示和tests中的sample_files在各自临时目录创建；如果自己调用summarize，只传入自己的合成文件，本工具只读取输入、不写输出路径。

## 真实进程比同进程调用多证明一层

测试用当前解释器绝对路径启动run.py，并把cwd改到含空格的新临时目录；参数以列表传递，不经shell拼接。两次成功运行stdout字节完全一致，stderr为空，JSON总额为144分。缺参数、未知选项、缺文件、坏表头与重复费用都明确非零，失败前后输入不变。

测试还有一个人工注入的RuntimeError，确认没有被宽泛捕获。入口不从任意Markdown代码块抽取命令；根npm test的Node桥实际启动Python unittest，Python失败会使根检查失败。Node测试数量和桥内部Python测试数量分别记录。

## 成功输出也有边界

“输入错误时stdout为空”依赖先验证再输出的流程。输出管道本身中断时，可能已经传出部分字节，这不是对外输出的事务承诺。它也没有给远程数据库写入提供回滚，相关故障需要下一层协议。

练习：把未知异常错误地捕获成返回[]，预测哪个测试应失败；再让CSV第二条重复id，分别核对退出码、stdout、stderr与源文件，解释为什么只看退出码不够。最后改一个正确预期为114，确认测试发现错误并在恢复后重新通过。

下一篇：[迭代器与资源上限](python-iterators-and-limits.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py pipeline
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
