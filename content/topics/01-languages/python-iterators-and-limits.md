---
id: p07-python-iterators-and-limits
title: 拿到生成器后，为什么错误还没有发生？
description: 用逐行合成记录观察惰性执行、一次消费和文件所有权，明确行与条数上限。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [p06-python-tests-and-cli]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 列表已经有结果，生成器还没有开始工作

先看过[测试与CLI协议](python-tests-and-cli.md)。JSON小文件可以整体读入，但你也会遇到每行一个JSON对象的流。此处采用另一种明确格式：每条独立JSON后必须有LF，字段仍是Trip模型；它不是上一单元的JSON数组文件，也不是CSV。

迭代器（iterator）保存逐次取值的位置；next取下一项，到末尾以StopIteration表示结束，for自动处理这个结束信号。包含yield的函数返回生成器（generator），函数体通常要等实际迭代时才推进。[迭代器与生成器](https://docs.python.org/3.13/tutorial/classes.html#generators)

维护iter_trip_lines接收调用者借给它的二进制流。创建iterator后source.tell()仍为0；next一次只消费第一条，list(iterator)消费剩余部分，再次list得到空列表。实测演示第一条41字节、总共82字节，第一次next后位置为41。

## 惰性也会延后错误

第一行合法、第二行days=False时，创建生成器不会报错，第一次next返回合法Trip，第二次next才抛带line 2上下文的InvalidData。try只包住“创建生成器”捕获不到后面消费时的失败，需要覆盖真正的迭代范围。

```python
iterator = iter_trip_lines(source)
first = next(iterator)       # 第一条通过
# 消费第二条时才会执行第二条的解析和校验
```

这和load_trips全数组验证后才返回不同。生成器可以已经把第一条交给下游；若下游此时写了数据库，后面报错不会自动撤销。惰性提高了增量处理的可能性，却不能替代事务、暂存或重放协议。

## 边消费边限制资源

本例用source.readline(max_line_bytes+1)，默认每行最多256字节，计入行尾LF或CRLF；多读一个字节识别超限。最多100条记录，循环为判断超条数可能再读取第101条后拒绝。设置值也有明确范围，不接受True假装1。

读取后要求行尾LF，严格解码UTF-8，再用既有JSON钩子和Trip模型校验。空输入得到零条；空行、缺末尾换行、非法字节、重复键和字段错误都拒绝。这是当前格式约定，不是所有JSON Lines工具都必须拒绝无末尾换行。

生成器没有累计整份输入，但调用者若执行list(iterator)，仍会保存所有产出对象。去重集合、汇总字典等下游结构也可能增长，不能仅因函数含yield就声称整个系统恒定内存。本例用明确条数与每行上限界定教学资源，不做大文件吞吐基准。[迭代协议](https://docs.python.org/3.13/library/stdtypes.html#iterator-types)

## 谁打开流，谁负责关闭

iter_trip_lines借用source，不在内部关闭它。调用者在with中持有文件或BytesIO，整个消费和错误处理位于该上下文内。测试验证生成器出错或主动close后source仍开着，离开调用者with后才关闭。

不要在一个函数的with内创建生成器、尚未消费就返回，让调用方收到依赖已关闭文件的对象。也不要等待垃圾回收来隐式决定关键资源的释放时机；本例的所有权约定是显式的。

## 迁移练习

先把第二条改坏，预测创建、第一次next、第二次next分别发生什么；然后只取一条就停止，检查是谁关闭源。把单行上限设为第一行精确字节数及少一字节，对照边界测试。最后给下游加一个不断保存所有id的set，解释为何上游逐行处理不等于整体内存不增长。

下一篇把类型、解析和质量规则组合成[可重跑数据汇总](python-data-pipeline.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py iterators
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
