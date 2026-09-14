---
id: r04-structured-output-evidence
title: 返回的是合法JSON，为什么仍然不能直接相信它？
description: 区分语法、字段契约、上下文身份和引用证据校验，拒绝伪造或越界输出。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [r03-retrieval-context-citations]
topics: [ai-applications, evidence-validation]
tags: [search-ai]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[检索上下文与引用](retrieval-context-and-citations.md)。目标：把输出接收过程拆成明确校验层，知道每层能证明什么、还不能证明什么。

## 三个看起来都很像答案的响应

一个响应是坏JSON；另一个JSON完全合法，却给出不存在的chunk_id；第三个引用id真实，但把原文改成“超时说明肯定没执行”。它们的失败原因不同，不能只捕获JSON解析异常就宣布输出可靠。

[Python json文档](https://docs.python.org/3.13/library/json.html)描述了解析与对象键处理。本例先要求bytes且最多4096字节，按UTF-8解析，并通过object_pairs_hook拒绝重复对象键；解析失败、过深嵌套或非UTF-8均不能进入后续业务流程。

## 一个有意收窄的输出契约

本例只允许三个顶层字段：context_sha256、status、citations。status只能是answered或abstained；citations是数组，每项只允许chunk_id和quote。answered必须有引用，abstained必须没有，最多4项且不重复。

字段形状对应结构化输出（structured output）的基本思想。[JSON Schema对象约束文档](https://json-schema.org/understanding-json-schema/reference/object)区分属性、必需字段和额外字段等约束。这里用手写Python检查精确字段集合，并未安装JSON Schema验证器，也不宣称实现了完整标准。

基线没有任意“生成答案正文”字段，只输出抽取引用，因此契约比通常的自由问答窄。为自由生成增加answer字符串很容易，但逐字引用检查并不能自动证明那个字符串受资料支持；不能暗中把这个示例扩展成已经完成自由回答的事实校验器。

## 身份与证据要继续检查

通过形状校验后还要比较context_sha256是否等于本次可信上下文，再检查每个chunk_id都在本次sources中，quote必须与对应片段逐字相等。来自另一轮的合法引用也不直接接受，因为本轮可能有不同问题或预算。

[维护校验器](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/search-lab/answers.py)仅接收程序自己构建的上下文作为验证依据；工作流交给adapter的是深拷贝，防止adapter通过修改同一个对象来同时污染答案与对照证据。这是本机接口隔离，不是对任意恶意Python代码的沙箱。

```sh
npm test --prefix examples/search-lab
npm run context --prefix examples/search-lab
```

CPython3.13.0实测基线返回http-timeout:0原句并通过验证。tests分别把quote改成相反含义、chunk_id改成invented:0、摘要改成old、附加tool字段，以及重复引用或空answered，全部得到失败。独立删除quote相等守卫时，原失败断言也必须发现它。

## 格式正确与事实正确仍相隔一层

逐字引用证明的是“来自本次选中的原文片段”，不能证明原文真实、新鲜、完整或相关。若原文是错误教学假设，照抄也会通过；若查询含否定词但词法检索忽略其作用，引用可能答非所问。

允许在有资料时返回abstained，是保守输出选择，不是自动断定失败；后续评估要看该拒答是否合理。缺少资料却answered则会因引用不在允许集合而失败。这些规则对应业务契约，不是对真实模型可靠性的测量。

## 练习与资源边界

练习仅在quote末尾增加一个空格，预测是否通过。提示：本例是严格相等检查，会拒绝；若要允许格式变化，需先定义不会改变证据含义的规范化规则并补测试。再把相同引用放两次，检查为什么不能通过增加数量制造更强证据。

4096字节限制检查的是adapter返回以后拿到的响应。它不能阻止一个错误adapter在内存里先构造巨大对象；真正的网络接收器还需在读取过程中限流/限长。本例adapter是受控fixture，没有真实网络。

语法、形状、身份与引用的正常/失败路径已运行；JSON Schema库、真实模型约束解码、生成事实判定和浏览器 **NOT_RUN**。下一篇：[预算、重试与资料权限](bounded-ai-workflow.md)。

[返回搜索与AI应用路线](../../roadmaps/search-ai-foundations.md)
