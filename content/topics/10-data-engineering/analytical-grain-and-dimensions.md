---
id: q01-analytical-grain-dimensions
title: 汇总金额翻倍，可能是关联粒度出了什么问题？
description: 区分事件事实与窗口汇总，使用维度唯一键和守恒断言防止金额放大。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [q00-event-contract-quarantine]
topics: [data-engineering, data-quality]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[事件质量契约](event-contract-and-quarantine.md)。目标：先写明“一行代表什么”，再决定分组、关联和校验方式。

## 一条路线为什么能变成两条？

事件e1属于路线a，金额100分。路线维度表本应只有a→north一条映射，却意外出现两个a。直接按键关联，e1会匹配两行，之后sum就可能得到200。结果的错误来自关联基数，不能靠给报表金额除以二修好。

事实粒度（grain）描述一行代表的观察单位。本例输入是一条唯一事件，输出是一条“路线×60分钟窗口”的汇总。维度（dimension）只补充路线名称，不应增加事实行。是否允许一个键对应多个历史版本，需要明确生效时间等额外条件；本例选择无历史版本的静态维度，并强制键唯一。

## 在汇总前阻止放大

[维护实现](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/data-pipeline/pipeline.py)先把维度建为映射；遇到任何重复键立即抛dimension key not unique，即便两个名称相同也失败。找不到路线则抛missing dimension，不静默丢掉金额。

随后要求传入的事件id已唯一。Q00负责分类重复；aggregate再次检查输入约定，以防调用者绕过质量步骤直接传入重复事件。这个检查有实际收益：重复维度和重复事实是不同错误，不能让一个随意DISTINCT掩盖两个问题。

窗口起点采用minute // 60 * 60，即[0,60)、[60,120)这样的半开区间。分组键是(start, route)，名称只是展示字段。到达顺序不会改变整数求和结果，输出按分组键排序以便对账。SQL的GROUP BY聚合语义可参阅[SQLite SELECT文档](https://www.sqlite.org/lang_select.html)；本例实际执行的是Python映射聚合，没有假装运行SQL分析查询。

## 先预测，再运行

```sh
npm test --prefix examples/data-pipeline
npm run batch --prefix examples/data-pipeline
```

固定CPython3.13.0运行的fixture经质量步骤后保留三条事件：a在10分钟100分、20分钟200分、80分钟300分。实测输出：

| start | route | name | count | cents |
| --- | --- | --- | --- | --- |
| 0 | a | north | 2 | 300 |
| 60 | a | north | 1 | 300 |

测试同时检查输出金额和为600、计数和为3，并反转输入顺序验证同样结果。守恒断言不只看“函数返回了两行”。若以后过滤部分事件，守恒两边必须使用同一业务集合，不能把合法过滤误报为丢数。

## 内存上限不随“生成器”三个字消失

输入和维度各最多100行，聚合默认最多20组。把max_groups设为1处理上述输入，第二个窗口使函数抛group state limit；它不会返回第一组冒充完整结果。此处先把有限输入放入内存，空间受事件数和不同分组数限制，没有声称流式常量内存。

真实大数据可能需要分区、溢写或分布式聚合；本实验没有测量这些方案的吞吐。即便逐条读取，若每条事件都属于新路线，状态仍持续增长。检查分组基数比只控制每次读取多少字节更接近这个问题。

## 练习：名称改了，什么才是稳定键？

把a名称改为north-new，预测分组键和金额是否改变。提示：仍按route分组，输出名称变化，金额不变；Q02的维度摘要会变化，从而记录汇总使用了哪份映射。

再添加同名的路线b及一条0分事件。如果错误地按name分组，可能合并本应不同的路线。为输出保留两条不同route写断言，比只检查总额更能发现粒度错误。最后尝试两条相同id事件直接调用aggregate，应该得到明确错误。

来源、正常/重复/缺维度/组上限断言已核验。浏览器、SQL分析引擎、真实大数据资源与性能 **NOT_RUN**。下一篇：[完整批次发布](batch-manifest-publication.md)。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
