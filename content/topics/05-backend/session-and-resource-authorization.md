---
id: e03-session-resource-authorization
title: 知道用户是谁以后，为什么还要检查每一条资源？
description: 分开认证、会话和资源授权，用两个合成身份验证读取与修改边界。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e02-react-accessibility-cost, f11a-persistent-trip-api]
topics: [authentication, authorization]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, SQLite 3.53.4, macOS arm64]
verified_on: 2026-09-13
---

先修：[前端状态与反馈](../04-frontend/react-accessibility-and-cost.md)、[持久化接口](persistent-trip-api.md)。目标：解释“已登录但不能改别人的便笺”，并写出能发现越权的测试。

## 三个问题分别回答

认证（authentication）核实身份；会话（session）让后续请求关联已核实的身份；授权（authorization）判断该身份能对目标资源做什么。把任意body.owner当身份，相当于让请求自己证明自己；只检查“有token”而不查目标owner，则可能让任何已登录者修改所有数据。[OWASP授权指导](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) 强调默认拒绝及逐请求检查权限。

[完整实验](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/reliable-app)只有alice和bob两种合成身份。issueFixture是测试进程的可信签发入口，没有HTTP登录路由；它假定前置身份核验已完成，**不演示密码验证、账号找回或真实认证服务**。不能把这个入口开放成“提交用户名即可拿会话”的接口。

## 会话不是把用户名换个编码

session.mjs使用Node crypto.randomBytes生成32字节随机值，再编码为十六进制。服务器Map保存token到owner和绝对过期时刻的映射，请求只发送不透明token。随机值不携带可读用户名，也不代表加密了某段用户资料。[Node对应版本crypto文档](https://raw.githubusercontent.com/nodejs/node/v24.21.0/doc/api/crypto.md) 描述了随机字节API。

authenticate检查Bearer格式、是否存在及当前时刻是否小于expires；恰好到期即无效，revoke删除会话。测试注入时钟，从100推进到110，无需等真实十毫秒。会话标识一旦被窃取，通常可被用来冒用对应会话，因此不能记录、放入URL或提交到仓库。[OWASP会话指导](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) 讨论了标识生成、生命周期与传输保护。

本Map只供有限测试，重启清空，没有多实例共享、定期清扫、空闲过期、权限变化轮换或生产容量控制。本机HTTP只传临时合成token；生产传输需要TLS及成熟认证方案，不能照搬这个练习服务。

## 权限条件靠近数据操作

读取使用`WHERE id = ? AND owner = ?`，owner来自服务器会话映射。更新同样包含owner条件；前端隐藏按钮不构成安全边界。请求体只允许title，额外owner字段会被拒绝；“身份是谁”和“想改什么”不混在一个对象里。

本例对不存在和不属于当前身份的资源均返回404，以减少资源存在性暴露；缺失、失效会话返回401并带WWW-Authenticate。404不是适合所有产品的唯一政策，关键是读取和写入采用一致明确的策略。状态码通用含义参见[HTTP语义](https://www.rfc-editor.org/rfc/rfc9110.html)。

前端A批用本地数据，B批用HTTP测试客户端，没有悄悄把token存进localStorage。若以后用Cookie，需要另处理浏览器自动携带凭据、SameSite/HttpOnly/Secure和CSRF；使用Bearer也不等于自动消除XSS、泄漏和所有跨源风险。

## 真实请求怎样验证？

仓库固定Node24.21.0，在根执行：

```sh
npm ci --prefix examples/reliable-app
npm test --prefix examples/reliable-app
npm run backend --prefix examples/reliable-app
```

backend入口只监听127.0.0.1随机端口，结束关闭服务器与内存数据库，不输出token。确定性结果为own=200、otherOwner=404、update=200、stale=412、revision=2。测试另覆盖bob读取alice条目、alice修改bob条目、撤销后401；不仅检查状态码，还检查bob标题未被修改。

练习增加合成角色“只读协作者”。先写出谁可读、谁可改，再把规则分别放进读取和修改路径。提示：共享读权不能自动推出写权；至少加入“能读但改失败且数据未变”的反例。不要直接把owner条件删除当作协作功能。

来源、合成会话和真实HTTP/数据库非浏览器验证已完成；真实登录、Cookie与UI接线 **NOT_RUN且不在本实验实现范围**。下一篇：[版本冲突与迁移](conditional-update-and-migration.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
