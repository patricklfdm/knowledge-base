---
id: roadmap-reliable-engineering
title: 前后端工程与运行可靠性路线
description: 从React状态走到资源授权、版本冲突和可验证恢复。
note_type: navigation
status: seed
draft: false
publish: true
tags: [engineering]
---

先完成[全栈基础](fullstack-foundations.md)，按需回看[SQL](sql-foundations.md)与[系统](systems-foundations.md)。例子在examples/reliable-app，只有合成数据和自建临时资源；Pages发布教材，不运行教学后端。

| 顺序 | 正文 | 自测 |
| --- | --- | --- |
| E00 | [组件与状态归属](../topics/04-frontend/react-state-ownership.md) | 区分props、状态、派生值与不可变更新 |
| E01 | [请求代次与清理](../topics/04-frontend/react-request-lifecycle.md) | 让旧请求晚到而不能覆盖最新结果 |
| E02 | [表单语义与成本](../topics/04-frontend/react-accessibility-and-cost.md) | 区分结构、交互与渲染测量证据 |
| E03 | [会话与资源授权](../topics/05-backend/session-and-resource-authorization.md) | 已登录身份能否修改他人资源 |
| E04 | [版本冲突与迁移](../topics/05-backend/conditional-update-and-migration.md) | 旧标签失败且旧数据不被覆盖 |
| E05 | [日志与有界等待](../topics/05-backend/safe-observation-and-deadlines.md) | 区分请求结束、用户成功和任务停止 |

后续批次：E06–E08启停、恢复与服务目标。尚未交付的部分不算完成。浏览器统一延期，静态输出与控制器测试不能代替UI验收。

[知识地图](../knowledge-map.md)
