---
id: e01-react-request-lifecycle
title: 旧请求晚到时，怎样避免覆盖新结果？
description: 用受控Promise和请求代次验证取消、过期结果、错误与Effect清理。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e00-react-state-ownership]
topics: [react, async]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, React 19.3.0, esbuild 0.27.2, macOS arm64]
verified_on: 2026-09-13
---

先修：[状态归属](react-state-ownership.md)。目标：画出两次读取的完成顺序，区分“请求被要求取消”和“结果仍有权更新页面”。

## 完成顺序不等于发出顺序

用户先读取A，再读取B；B先返回，A后返回。若每个成功回调都直接写rows，界面最后显示A，虽然用户最近的意图是B。这个错误不需要多线程：Promise完成顺序与发起顺序不同就足够。与[缓存失效竞争](../02-foundations-tools/cache-invalidation-races.md)相似，核心是旧工作是否仍可发布。

[维护控制器](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/reliable-app/web/request.mjs)为每次读取记录generation。load先调用cancel，让代次递增并abort旧控制器，再保存本次代次。成功与失败都要确认它仍是当前代次：

```js
const rows = await read(signal)
if (mine === generation) emit({ type: "success", rows })
```

这是本例协议，代次只属于一个loader实例，不是跨进程时钟或服务端版本号。被取消的请求即使完成也不能发布；当前请求失败才显示错误。

## 为什么abort还不够？

AbortController通过signal通知愿意合作的API。它不是强制终止所有Promise的开关，也不能回滚已经完成的服务器写入。本例read是本地异步适配器，故意允许忽略signal；所以代次检查必须独立存在。[AbortController文档](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 描述了它控制支持取消的异步操作的用途。

测试不用猜网络延时。它创建两个可手动resolve的Promise，先兑现B再兑现A，最终只应有B的一次success。另一个用例先cancel再让旧任务reject，不应出现错误提示。恢复后再load必须还能成功，模拟setup—cleanup—setup所需的控制器协议。

## Effect管理外部工作的生命周期

App在Effect中load，在清理函数中cancel：

```js
useEffect(() => {
  void loader.load()
  return loader.cancel
}, [loader])
```

Effect用于把组件与外部异步系统同步，不用于再存一份可直接计算的筛选条数。依赖变更及卸载会触发对应清理；开发Strict Mode还会额外执行一次setup与cleanup，帮助暴露不对称的资源处理。[React Effect生命周期](https://react.dev/learn/synchronizing-with-effects) 对此有具体说明。

本例用useMemo建立loader，并列出稳定dispatch依赖；loader身份若重建，Effect会取消旧实例再启动新实例。正确性依靠清理与代次守卫，不能依赖缓存永远不失效。不能为了压制重复请求把真实依赖删掉，否则闭包可能长期使用旧值。

## 错误属于哪次读取？

loading清除旧error；当前失败清空rows并显示“读取失败，请重试”。loading期间旧rows仍可见，但文字明确提示“可能为旧结果”，不会把旧内容伪装成最新成功。重试成功将phase改为success，即使结果为空也显示“找到0条”。空结果、未读取和失败具有不同含义。

完整例子和命令沿用E00。`npm test --prefix examples/reliable-app`实际验证晚到成功、清理后失败、当前失败与恢复。独立副本故意去掉成功分支的代次检查，会使“只有B发布”的断言失败。它证明控制器协议，不证明React在真实浏览器中的Effect调用次数或网络取消行为；这些仍为 **NOT_RUN**。

## 改变条件再判断

把读取改成保存：A请求已经写入服务器，随后客户端cancel。能否显示“没有保存”？不能；取消客户端等待不等于撤销写入。练习保留保存输入，设计“结果不确定，先查询确认”的提示，并思考为什么重发创建需要服务端幂等协议。不要直接把latest-wins读取策略套到每一次写操作。

本控制器适合单个读取窗口的最新结果覆盖语义，不实现共享请求缓存、分页合并或事务取消。下一篇：[语义表单与成本证据](react-accessibility-and-cost.md)。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
