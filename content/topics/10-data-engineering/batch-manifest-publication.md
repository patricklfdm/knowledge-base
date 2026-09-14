---
id: q02-batch-manifest-publication
title: 批次写到一半失败，怎样继续提供上一份完整报表？
description: 使用不可变批次目录、清单与一次指针替换，验证发布中断和结果摘要检查。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [q01-analytical-grain-dimensions]
topics: [data-engineering, data-quality]
tags: [data-engineering]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[汇总粒度与维度](analytical-grain-and-dimensions.md)。目标：把“算出来了”与“读者可以读取这一版”分开，并观察切换之前失败的结果。

## 文件存在不等于批次完整

假设写出rows.json后还要写质量报告。若直接覆盖公开目录，读者可能拿到新报表配旧报告，或者只有半个JSON。先在新的批次目录准备完整产物，再切换一个很小的入口，可以使正常进程中的读者选择更清楚。

本例单写者创建随机generation目录，内含rows.json与manifest.json。清单（manifest）记录输入字节SHA-256、维度摘要、规则event-v1-window60、质量计数和输出摘要。它们提供血缘（lineage）的最小线索：这一版来自哪些输入与规则。摘要算法入口见[Python hashlib文档](https://docs.python.org/3.13/library/hashlib.html)。摘要不证明输入可信，也不是数字签名。

## 把切换放在最后

处理顺序是：校验输入与拒绝阈值→汇总→写新目录的两份文件→写临时指针→os.replace切换CURRENT。读取者只读一次CURRENT，再在那个generation目录取清单和数据，核对输出摘要后返回。旧目录在本实验中保留，避免读者拿着旧指针时文件已被删掉。

[os.replace文档](https://docs.python.org/3.13/library/os.html#os.replace)说明成功重命名的原子性及跨文件系统限制。本例临时指针和CURRENT在同一目录；这个文件名替换不自动保证机器断电后的所有文件耐久。本例没有fsync协议、远程对象存储、并发多写者协商或自动垃圾回收，不能直接套用到生产发布系统。

## 一个小而完整的入口

```sh
npm ci --prefix examples/data-pipeline
npm test --prefix examples/data-pipeline
npm run batch --prefix examples/data-pipeline
```

[源代码与README](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/data-pipeline)使用CPython3.13.0标准库。batch自行创建临时目录，允许fixture中的1条坏行，输出质量计数与两条窗口汇总，退出时清理自有目录。它没有接收用户现存目录的公开CLI参数。

重复运行相同输入和维度会创建不同generation，但清单与报表内容相同；随机目录名不是业务数据版本。来源字节哪怕只改变JSON空格，其SHA也会改变，而规范化后的汇总可能不变。这是输入身份与计算结果的区别。

## 从失败断言读出保证

| 实际测试 | 观测 | 解释 |
| --- | --- | --- |
| 先发布空批次，再用默认阈值发布含坏行fixture | quality budget exceeded，旧结果不变 | 质量门在切换前 |
| 新目录写完后注入异常 | 旧结果仍可读，留下未被指向的新目录 | 部分准备工作不等于发布 |
| 修改当前rows.json | digest mismatch | 读取者发现与清单不一致 |
| CURRENT写成../outside | invalid generation | 指针只允许32位十六进制批次名 |

故意改坏文件测试只操作TemporaryDirectory。别把这个摘要检查误认为能抵抗有权限同时修改清单和输出的人；它用于本实验的数据一致性检查。也不能仅凭摘要相符断定计算规则正确，Q01的业务断言仍然必要。

## 练习与回退思路

把max_rejected从1改回默认0，预测是否会产生新的可见结果。提示：失败应保留旧CURRENT，不应该清空站在旧版本上的读者。再改变维度名称，核对输入摘要保持不变而维度摘要与输出摘要发生变化。

如果设计清理策略，需说明哪些generation仍可能被读取。直接删除“不是CURRENT”的所有目录会与已读取旧指针的读者竞争。本练习仅在整个示例结束后清理自有临时目录，不提供危险的通用清理命令。

真实写入、读取、注入异常与损坏检测已测试；断电、磁盘损坏恢复、并发发布、浏览器 **NOT_RUN**。后续进入事件时间、持久检查点和补数；当前可返回路线查看进度。

[返回数据工程路线](../../roadmaps/data-engineering-foundations.md)
