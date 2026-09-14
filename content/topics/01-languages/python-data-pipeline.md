---
id: p08-python-data-pipeline
title: 同一批行程数据，怎样得到可核对、可重跑的汇总？
description: 组合解析、关联、质量校验、确定排序与输入摘要，明确本地可重复和生产重放的边界。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [p07-python-iterators-and-limits]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 先定义输出，再连接两个输入

沿着[迭代与资源边界](python-iterators-and-limits.md)，现在完成这条Python主线的综合任务：读取行程JSON和费用CSV，返回每个行程的费用条数与整数分合计，包括零费用行程。输入均为合成小文件，不连接SQL库、云存储或真实账目。

复用Trip/Expense模型与既有解析函数，不在CLI里再复制另一份金额规则。build_report对每个输入只读一次，使用同一份有限文本解析和计算摘要，避免先统计旧内容、再重读新文件生成摘要的简单错配。两个文件并非一起原子读取；运行时仍要求输入保持不变。

## 关联和分组各有一个不变量

aggregate先为每个Trip建立计数0、金额0的结果，再遍历费用。每条费用必须有唯一expense id，trip_id必须在行程集合中；只有通过这两项检查，才更新对应行程的count和cents。

```python
key = expense.id
if key in seen:
    raise InvalidData(f"duplicate expense id: {key}")
seen.add(key)
if expense.trip_id not in totals:
    raise InvalidData(f"orphan expense: {key}")
```

这段来自维护聚合器。先创建所有行程的结果，才能保留没有费用的雪原；不能只从费用出发分组后，认为少了一个行程只是“没有数据”。关系语义也可对照[SQL的连接与NULL](../06-data/joins-and-null.md)，本例并没有执行SQL。

重复id不是自动幂等处理：本例选择报错，避免重复累计。重复行程id、孤儿费用和超过100条的数据都被拒绝。局部字典只在全输入通过后作为列表返回，不修改模型对象或输入集合。

## 正确答案不仅是一个总数

维护样本有山城和雪原两个行程；两笔费用115分、29分都属于山城。输出按trip_id排序，山城count=2/cents=144，雪原count=0/cents=0，总额144。即使输入行程顺序和费用顺序反转，各行结果仍一致。

只检查grand_cents等于144会漏掉“算到错误行程”的问题，所以测试比较整份按id排序的结果和零费用行。排序是协议的一部分，不依赖输入字典碰巧以某种顺序插入。

## 可重复输出要说明输入版本

报告包含format_version、记录数量、totals和input_sha256。SHA-256对读取的UTF-8字节计算摘要，帮助核对是否使用同一份输入；它不是数据真实性、来源授权或数字签名。[hashlib](https://docs.python.org/3.13/library/hashlib.html)

相同输入重复运行得到相同stdout字节。把0.29改0.30，总额变145，对应费用输入摘要改变。若只调整空白或记录顺序，业务汇总可能相同，但原始输入字节不同，摘要仍会变化；不要把它误称为业务等价摘要。

工具不写用户输出文件，只把完成的JSON发到stdout。若接下来要持久化结果，需要另行定义临时文件替换、失败和确认边界，参见[文件发布](../02-foundations-tools/file-publication-boundaries.md)。不能把“重复本地计算一致”称为跨进程exactly-once或生产ETL可靠性。

## 综合迁移练习

先预测增加第三个无费用行程时的输出行数，再运行自己的副本；给它增加1.00元费用后，分组与总额应怎样变化？随后复制一条expense id，必须拒绝整次报告；把它改成新id但引用不存在行程，仍应拒绝。

再将费用顺序打乱，比较业务totals与输入摘要；最后让第二条金额非法，核对CLI退出2、stdout为空、源文件不变。独立故障对照移除费用id去重时，原重复测试和CLI失败契约测试会检出错误，恢复后通过。

至此，[Python路线](../../roadmaps/python-foundations.md)完成运行环境、语言、类型、文件、测试、迭代与有界数据处理。pandas/NumPy、批流平台、分布式故障和AI评估仍由后续任务承担；本例没有测生产性能、并发文件替换或任意超大输入。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py pipeline
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
