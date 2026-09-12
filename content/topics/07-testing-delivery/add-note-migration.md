---
id: f12b-add-note-migration
title: 添加备注字段，为什么不能只改表单？
description: 在隔离应用副本中同步修改页面、转换、API、SQL和旧表迁移，验证默认值、拒绝路径与迁移回滚。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f12a-test-boundaries]
topics: [schema, migration, testing]
tags: [testing]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-12
---

难度 **L0** · 先修：[测试边界](test-boundaries.md) · 目标：给已有行程添加note备注，解释旧数据默认值、各层传递和迁移失败后的状态。

核验：旧库迁移、事务回滚、真实HTTP、页面控制器和新进程读取通过。真实DOM与浏览器 **NOT_RUN：用户批准集中验收**；页面补丁只做源码、语法与HTTP资源检查。

## 先定义一个小而明确的契约

备注是可选文字，省略时为空字符串，最多120个UTF-16代码单元；不自动trim，保留用户原文字。PUT是完整替换本例业务字段，未提供note时也会变为空串，不是保留旧备注。这一约定需要在页面、请求和存储处一致。

F11基础应用保持不变。练习在新建临时目录复制明确列出的运行文件，覆盖备注版本的输入/存储模块，并精确补入页面、控制器字段。替换位置缺失或重复会立即失败，避免无声漏改；这只是受控教学快照的组装，不是通用代码生成器。

从仓库根目录执行：

```sh
cd examples/trip-app
npm ci
npm test
npm run exercise
```

[完整练习文件](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/trip-app/exercises) 和 [验收测试](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/trip-app/evolution.test.mjs) 可逐个阅读。demo先建立有一条旧行程的临时库，再启动扩展应用，最后清理；不接受用户已有数据库作为实验输入。

实测输出：

```text
迁移旧行 [{"id":1,"destination":"山城","days":3,"note":""}]
保存备注 {"id":1,"destination":"山城","days":3,"note":"靠窗"}
重启备注 [{"id":1,"destination":"山城","days":3,"note":"靠窗"}]
```

## 一个字段要穿过哪些地方？

| 层           | 本练习改动                                         |
| ------------ | -------------------------------------------------- |
| HTML/DOM适配 | 增加note输入、修改时填回、提交读取、列表用文字显示 |
| 转换/控制器  | 第四个字段传入parseTripFields，检查类型和长度      |
| API输入      | parseTrip返回note；缺省空串，非法422               |
| SQL          | INSERT/UPDATE增加绑定值，SELECT返回note            |
| 旧数据       | 增加列并提供DEFAULT，记录迁移版本                  |
| 测试         | 旧行、新写入、非法无副作用、重启和回滚             |

如果只添加输入框，后端可能丢弃未知字段；只修改INSERT，SELECT可能仍不返回note；只改CREATE TABLE，已有表不会增加列。F10的IF NOT EXISTS反例在这里变成了实际迁移需求。

## 旧行为什么需要DEFAULT？

本练习的迁移SQL核心为：

```sql
ALTER TABLE trips ADD COLUMN note TEXT NOT NULL DEFAULT '';
```

增加列后，旧行没有手动填写过备注，空字符串提供兼容的读取值。NOT NULL禁止空值NULL；长度上限仍由API与字段转换执行，数据库没有复刻UTF-16长度校验。[SQLite ADD COLUMN文档](https://www.sqlite.org/lang_altertable.html#altertabaddcol) 说明了增加非空列与默认值的约束。

存储函数读取PRAGMA user_version，0表示本练习旧表，1表示备注版；版本和列名不在支持范围时拒绝继续。[SQLite user_version](https://www.sqlite.org/pragma.html#pragma_user_version) 是供应用管理的整数，不会替你自动推断迁移。这里的结构检查只适用于本例受控旧库，不是任意数据库的兼容审计。

## 改结构和记版本必须一起成功

事务（transaction）在这里把增加列与更新版本放在同一成功/失败单元：BEGIN IMMEDIATE后执行ALTER和版本更新，成功COMMIT，异常ROLLBACK。不要先把版本写成1，再发现增加列失败。

测试在ALTER之后、写版本之前故意抛错：回滚后仍是三列、版本0、原行还在。随后正常迁移，旧note为空，版本1；再次执行迁移不会重复加列。以上是实际SQLite事务实验，不是生产零停机或崩溃恢复演练。[SQLite事务说明](https://www.sqlite.org/lang_transaction.html) 提供提交与回滚语义。

## 输入失败仍要保护旧备注

测试通过生成后的页面控制器把“靠窗”经真实HTTP写入；随后直接发送null、数字或121长度的note，得到422，列表内容保持不变。120个汉字通过，重启新服务器进程后备注仍在。

客户端限制不能代替服务端限制；绕过页面直接请求仍要拒绝。数据库只存合法绑定值，SQL样式文字也不应拼成语句。真实浏览器事件尚未执行，不能以控制器测试代替点击输入的验收。

## 练习：把备注上限改为60

先列出要同步修改的地方：页面maxlength、字段转换、API输入、边界测试；迁移列的类型和默认值可以保持。只改页面会怎样？直接HTTP仍能写入61长度，说明规则分裂。

基础练习上限为120；另在隔离副本实跑60版本：60通过，61在字段转换和直接HTTP处都拒绝，原备注仍保持60长度。自己的练习还应重启读回确认文件路径；不要只改页面限制。下一篇：[怎样启动、停止并检查教学应用？](run-and-smoke.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
