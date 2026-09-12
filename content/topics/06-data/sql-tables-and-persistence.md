---
id: f10a-sql-tables-and-persistence
title: 怎样用SQL保存行程，让新进程还能读到？
description: 从内存数组过渡到SQLite表，运行建表、写入、查询，并用独立进程验证文件保存的边界。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f09b-request-validation-boundaries]
topics: [sql, sqlite, persistence]
tags: [data]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[创建接口的输入边界](../05-backend/request-validation-boundaries.md) · 目标：建表、写入和读取行程，解释换一个进程后为什么仍能读到文件中的记录。

核验：Node24.21.0内置SQLite3.53.4，真实临时数据库与新进程实验通过。浏览器 **NOT_RUN：用户批准移至集中验收阶段**。页面/API/数据库整合留F11，尚未实施；本篇没有操作生产数据。

## 数组关闭了，行程放在哪里？

F09将行程放在服务器实例的数组里。新实例从空数组开始，即使接口此前返回201，也没有跨实例保存。本篇先单独学习存储：让SQLite把数据放入一个数据库文件，再由另一个程序进程打开同一个文件。

SQLite是嵌入程序使用的数据库引擎，本例通过Node内置接口调用，不需要启动独立数据库服务器。SQL（Structured Query Language，结构化查询语言）用来描述建什么表、写入什么行、选出哪些数据。JS仍负责调用顺序和错误处理；SQL字符串由数据库解释执行。

## 先运行一个完整生命周期

从仓库根目录开始，使用Node24.21.0：

```sh
cd examples/sql-trips
npm ci
npm test
npm run demo
```

[完整sql-trips示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/sql-trips) 无npm依赖。demo创建自己的临时目录和trips.sqlite，完成写入，关闭连接，启动另一个Node进程读取，最后清理目录。它不会把数据库留在仓库，也不要求你提供现有数据库。

实测标准输出：

```text
创建 {"id":1,"destination":"山城","days":3}
至少3天 [{"id":1,"destination":"山城","days":3}]
31天被CHECK拒绝
条数 2
新进程读取 [{"id":1,"destination":"山城","days":3},{"id":2,"destination":"海湾","days":1}]
```

“条数2”来自两次合法写入；31天没有成为第三条。“新进程读取”由独立read.mjs输出，证明结果不是旧JS数组的残留。测试还用两个独立的 `:memory:` 连接作对照：前一个写入并关闭，后一个为空。[SQLite内存数据库文档](https://www.sqlite.org/inmemorydb.html) 说明了这个特殊路径的生命周期。

## 表、行、列怎样对应行程？

表（table）是一组遵守共同结构的数据；行（row）是一条行程；列（column）是id、destination、days这些字段。表结构（schema）描述允许的列和约束，本例完整schema.sql是：

```sql
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY,
  destination TEXT NOT NULL CHECK (destination <> ''),
  days INTEGER NOT NULL CHECK (days BETWEEN 1 AND 30)
) STRICT;
```

CREATE TABLE创建表；IF NOT EXISTS表示已有同名表时不重复创建。INTEGER和TEXT描述整数与文字；PRIMARY KEY是主键，用于识别一行。本例省略id写入，由SQLite分配整数编号；这与F09的t1字符串不同，不能直接替换API编号。这里不承诺编号永不复用或永远连续。

NOT NULL和CHECK限制数据内容，STRICT启用该表的严格类型规则，下一篇展开。它们写在数据库里，不是JavaScript的if。表名与列名固定在维护的源码中。[SQLite建表文档](https://www.sqlite.org/lang_createtable.html) 是这些语法的依据。

## 从准备语句到写入一行

store.mjs中的openTrips接收本例文件路径，创建DatabaseSync连接，再执行固定schema.sql。写入的核心摘录如下，db是该连接，参数来自调用者：

```js
const insert = db.prepare("INSERT INTO trips (destination, days) VALUES (?, ?)")
const result = insert.run("山城", 3)
```

prepare准备SQL语句；INSERT INTO说明目标表和列，VALUES列出对应值的位置。两个问号是参数占位符，run按顺序绑定目的地、天数并执行。result不是新行正文；本例利用其中lastInsertRowid再查询这行。[Node SQLite接口](https://nodejs.org/api/sqlite.html) 说明了prepare/run/get/all的职责；本篇命令与实际行为以已测Node24.21.0为准。

DatabaseSync接口同步执行，会占用当前JS线程直到操作返回。这里便于观察小数据步骤，不把它当作高并发服务方案。数据库查询对象也不是HTTP Response；JSON.stringify只是把结果显示成稳定文字。

## 查询必须写清选择与顺序

查询三天及以上的行程：

```sql
SELECT id, destination, days
FROM trips
WHERE days >= ?
ORDER BY days, id;
```

SELECT选择返回的列，FROM指定表，WHERE过滤行，ORDER BY先按天数、再按编号排列。本例用 `statement.all(3)`绑定阈值并得到数组；没有匹配则为空数组。按主键查一条时用get，缺失返回undefined。

不要因为本次输出恰好像插入顺序，就认为数据库会永远如此返回。需要顺序时明确ORDER BY；测试覆盖了1、3、30天的过滤和排序。[SQLite SELECT文档](https://www.sqlite.org/lang_select.html) 解释了筛选与排序的含义。

## 文件保存的证据到哪里为止？

本例未显式开启多语句事务；写语句在SQLite的隐式事务规则下完成提交。close释放连接，新进程只读打开同一文件，读取先前记录。提交不是“等close才保存”的同义词。[SQLite事务说明](https://www.sqlite.org/lang_transaction.html) 给出了隐式事务的边界。

这次实验没有模拟断电、磁盘损坏或备份恢复，也没有并发写入；正常重开成功不能替代这些可靠性测试。demo最后删除的是它自己刚创建的临时目录，所以退出后再次运行会从新库开始。不要把演示的自动清理操作搬到用户数据库上。

## 练习：只读取四天及以上

在自己的demo副本中把 `store.atLeast(3)`改成 `store.atLeast(4)`，保留两条1天和3天记录，先预测输出再运行。参考结果应为空数组，但 `store.list()`仍有两条：查询条件改变返回集合，不会删除数据。测试已覆盖阈值高于全部记录时返回空数组。

如果把SELECT误写成SELEC，prepare会报语法错误；如果查询合法但没有匹配，得到空数组。这是两种不同情况。接下来学习：[参数绑定和数据库约束分别保护什么？](sql-parameters-and-constraints.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
