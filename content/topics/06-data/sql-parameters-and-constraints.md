---
id: f10b-sql-parameters-and-constraints
title: 参数绑定和数据库约束分别保护什么？
description: 用单引号输入、越界天数和旧表反例，分清SQL结构、绑定值、数据库约束与API校验。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f10a-sql-tables-and-persistence]
topics: [sql, validation, constraints]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[SQL表与文件保存](sql-tables-and-persistence.md) · 目标：解释为什么输入要绑定为值、为什么数据库仍需约束，以及为什么它不能替代API校验。

核验：Node24.21.0/SQLite3.53.4，参数输入、约束拒绝、类型转换与旧表反例已实跑。浏览器和教学应用真实交互 **NOT_RUN：用户批准移至集中验收阶段**。

## 一个单引号为什么能改变问题？

目的地可能叫 `O'Brien`。如果将输入直接拼进SQL的引号之间，文字中的单引号就可能变成SQL语法的一部分。更糟时，输入会改变原本的查询条件。这类问题叫SQL注入（SQL injection）：数据被当成了查询结构。

本例保持SQL字符串固定，把变化的值单独传入：

```js
const insert = db.prepare("INSERT INTO trips (destination, days) VALUES (?, ?)")
insert.run("O'Brien", 3)
```

问号位置是值；参数绑定（parameter binding）不会把这个值重新当SQL源码解析。无需自己给单引号补转义，也不要把占位符写成带引号的字符串 `'?'`。[SQLite表达式与参数说明](https://www.sqlite.org/lang_expr.html#parameters) 定义了参数位置。

[完整示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips) 的测试还写入 `x'); DROP TABLE trips; --`，随后按编号读回相同文字，并确认表里仍有两行；查询编号传入 `1 OR 1=1` 时没有扩大成全部行。本实验只在自建临时库中运行。

这里验证的是固定语句的绑定边界，不表示所有SQL调用天然安全。表名、列名、ASC/DESC等结构不能靠值占位符任意替换；将来需要动态排序，应从程序允许的固定方案中选择，不能把输入直接接到SQL尾部。绑定也不负责判断31天是否符合业务要求。

## 数据库为什么还需要自己的规则？

即使F09接口已检查days，仍可能有另一个脚本直接写数据库。数据库约束（constraint）让所有到达这张表的写入遵守共同底线。schema.sql中的规则是：

| 规则                  | 本例实际拒绝的情况           |
| --------------------- | ---------------------------- |
| INTEGER PRIMARY KEY   | 显式重复编号7                |
| destination NOT NULL  | 目的地为NULL                 |
| destination CHECK非空 | 空字符串                     |
| days NOT NULL         | 天数为NULL                   |
| days CHECK 1–30       | 0或31                        |
| STRICT表的INTEGER列   | 无法无损转成整数的three或2.5 |

NULL代表数据库中的空值，与文字 `"null"` 不同。CHECK检验表达式；不要单靠范围CHECK假设NULL也会被拒绝，因此这里同时写NOT NULL。[SQLite约束说明](https://www.sqlite.org/lang_createtable.html#check_constraints) 说明了这两种规则各自的职责。

测试既通过store.create写入，也直接准备INSERT绕过存储函数：重复主键和31天仍失败。每次拒绝后再查询行数，确认本例的单条失败INSERT没有新增行。仅看到异常不足以证明库中状态；多语句操作的整体回滚则是另一项事务问题，本篇未实现。

## STRICT为什么仍不能替代JavaScript校验？

在本例直接调用 `store.create("山城", "3")`，实际保存的days是整数3。STRICT表仍允许能够无损完成的类型转换；它并不是JS的 `typeof input.days === "number"`。无法转换的 `"three"` 和非整数2.5则失败。[SQLite STRICT文档](https://www.sqlite.org/stricttables.html) 明确描述了这种转换行为。

同样，当前数据库只要求目的地非空，并未实现F09的trim和80个UTF-16代码单元限制。实际测试中，一个空格和81个汉字都能写入本表。因此本篇存储函数是学习数据库边界的入口，不能直接作为已经校验完毕的公开API。

后续整合的顺序仍应是：请求解析 → F09业务校验与规范化 → 参数绑定 → 数据库约束。前面给调用者明确错误，后面保护落库规则。不能通过“数据库能自动转换”悄悄把接口的数字契约改成数字或字符串都接受。

## 失败是怎样暴露出来的？

从仓库根目录进入 `examples/sql-trips`，先按上一篇安装并运行测试，再执行：

```sh
npm run fail
```

这个入口只创建内存库，提交31天，finally关闭连接，并让未捕获的CHECK错误使进程退出1。它是故意失败的教材入口，不是运行环境坏了。demo则捕获同一类预期错误、打印提示后继续，退出0。测试区分了这两个出口。

原始数据库错误文字用于本机学习；当前没有将它转换成HTTP状态，也没有实现日志脱敏或所有数据库故障分类。未来API要定义自己的稳定错误契约，不能简单把任意数据库异常都称作用户输入错误。

## 练习：把30天改为14天，旧表会跟着变吗？

在schema.sql副本将 `BETWEEN 1 AND 30`改为 `BETWEEN 1 AND 14`。做两组预测：对全新临时库运行新schema，然后写14和15；对已经按旧schema建好的临时文件再执行新schema，然后写15。

第7组测试的实测参考：新表14成功、15触发CHECK，条数1；旧文件的15仍能写入。原因是 `CREATE TABLE IF NOT EXISTS`遇到已有表就不再建表，不会比较和更新旧结构。修改schema文件不等于数据库迁移（migration）。

迁移意味着有计划地改变既有结构并处理旧数据，本篇只揭示这个缺口，没有提供生产迁移脚本。练习始终用可丢弃的自建临时库，不能用删除用户数据库来让新约束“生效”。

同样，检查要能够失败：验收时在独立副本故意放宽CHECK，现有测试应检出31天被放行；恢复正式schema后再验收。下一项F11会把页面、接口与数据库接起来，当前没有把本篇例子冒称为完整应用。

[返回SQL入门](sql-tables-and-persistence.md) · [返回全栈路线](../../roadmaps/fullstack-foundations.md)
