---
id: e02-react-accessibility-cost
title: 怎样同时检查表单语义和渲染成本的证据？
description: 给筛选器建立可观察反馈，并区分静态结构、真实交互和性能测量。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [e01-react-request-lifecycle]
topics: [accessibility, performance]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, React 19.3.0, esbuild 0.27.2, macOS arm64]
verified_on: 2026-09-13
---

先修：[异步生命周期](react-request-lifecycle.md)。目标：修复一个无标签表单，说明一次缓存实验究竟证明了什么。可访问性与性能在这里共享一个原则：先定义用户任务和可观察证据，再判断实现。

## 输入框不能只靠位置解释

“左边那个框”依赖视觉位置；placeholder会在输入后消失。本例使用可见label，其htmlFor与input.id均为query，并用aria-describedby关联持久帮助文字。label说明要输入什么，帮助文字说明筛选范围；错误与结果另行显示。优先使用原生form、input、button，避免把div变成按钮后再补键盘协议。[WAI表单教程](https://www.w3.org/WAI/tutorials/forms/) 说明了标签、说明和反馈的不同职责。

Board只有一个实例，因此示例固定id；复制多个Board到同页时必须给每个实例生成不同的关联id。增加ARIA属性不会自动修复重复id、焦点丢失或键盘陷阱。

## 状态反馈要说清楚发生了什么

读取按钮忙时disabled，列表aria-busy表示正在更新；常驻的role=status区域描述读取中或结果条数。失败用role=alert显示清晰文字。状态区位于busy列表之外，避免把“读取中”也放进正在等待更新的区域。没有只用颜色区分成功失败。[WAI用户通知](https://www.w3.org/WAI/tutorials/forms/notifications/) 给出了错误识别和动态通知的指导。

这些是实现意图。真实屏幕阅读器何时朗读、disabled后的焦点是否符合任务需要、输入法和窄屏布局，都需要实际环境检查。本轮不把这些写成已通过。

## 静态测试能抓到什么？

[frontend.test.mjs](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/reliable-app/frontend.test.mjs)用React的renderToStaticMarkup生成HTML，检查label/描述关联、忙碌属性、错误及零结果文字。故意把for改为missing，断言会拒绝；标题含`<script>`时检查它被输出为转义文字。

这是明确几个结构约束的测试，不是完整HTML验证器或WCAG合规扫描。静态渲染不会绑定交互，也不触发客户端Effect。[renderToStaticMarkup参考](https://react.dev/reference/react-dom/server/renderToStaticMarkup) 说明其结果是不可交互的HTML，不能拿它当已测试水合的证据。

## 缓存前先测哪一种成本？

本例筛选每次访问n行。`frontend`命令对两行数据连续执行相同查询两次；手写单项缓存累计访问2行，若两次都直接筛选则访问4行。输入换成另一个查询后再访问2行；数组换成三行的新对象后再访问3行。测试实际断言累计2、4、7。它测的是函数访问次数，不是毫秒或浏览器帧率。

缓存键包含rows引用和query。若原地改rows，引用不变会错误复用结果，因此E00不可变更新也支撑此处正确性。测试替换数组并验证结果更新；缓存返回值也由调用方视为只读。单项缓存额外保留一份结果，不保证对频繁变化查询更快。

App中的useMemo缓存派生筛选；它是性能优化，不能成为正确性的必需条件，依赖按Object.is比较，缓存也可能被丢弃。[useMemo参考](https://react.dev/reference/react/useMemo) 解释了这些约束。示例中的手写缓存用于确定性计数，不冒称执行了React内部缓存测试。

## 真正的渲染优化怎样继续？

在浏览器集中验收时，可用[React Profiler](https://react.dev/reference/react/Profiler)记录明确组件树的提交与actualDuration，再比较固定数据、交互和构建方式。它衡量React渲染相关工作，不代表完整网络、布局和端到端响应。当前Profiler、键盘、辅助技术、手机阅读全部 **NOT_RUN**；没有“快了几倍”的实测声明。

运行E00的test、frontend、build即可复现本篇非浏览器证据。练习先加入第三行，再预测相同引用、复制数组、变化查询三种访问次数；之后故意漏掉缓存键中的query，写一个“切换筛选必须变化”的失败用例。只有成本减少且结果仍正确，优化才有意义。

后端授权、版本与运行恢复接在同一路线后续批次；这里不携带真实会话，也没有把SSR页面部署成在线业务应用。

[返回工程纵深路线](../../roadmaps/reliable-engineering.md)
