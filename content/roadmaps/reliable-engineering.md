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
| E06 | [就绪与关闭](../topics/08-production/readiness-and-shutdown.md) | 排空期间拒绝新工作，强制退出不能算成功 |
| E07 | [恢复与发布证据](../topics/08-production/restore-and-release-evidence.md) | 检查所有权、版本、可写性与同SHA发布 |
| E08 | [服务目标与错误预算](../topics/08-production/service-objectives-and-budget.md) | 明确分母、窗口、零流量与观察盲区 |

E00–E08有限教学主线已实现；不是整个React生态或生产平台。浏览器统一延期，静态输出与控制器测试不能代替UI验收。

[知识地图](../knowledge-map.md)

## 综合自测

依次制造晚到请求、越权写、旧版本更新、依赖超时、关闭中新请求与缺行备份。说明每一项应由哪层拒绝，记录状态/退出码/数据副作用；再改变一个输入条件并预测结果。练习只在自己的临时副本做，个人掌握记录留仓库之外。分布式、数据工程与AI留后续课程。
