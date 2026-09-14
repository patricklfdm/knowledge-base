---
id: r03-retrieval-context-citations
title: 找到资料后，怎样把可追溯的证据交给回答步骤？
description: 从文档检索构造有字符预算的片段上下文，保留原文偏移、摘要与引用标识。
note_type: lab
level: L3
status: reviewed
draft: false
publish: true
prerequisites: [r02-offline-retrieval-evaluation]
topics: [ai-applications, evidence-validation]
tags: [search-ai]
aliases: []
tested_with: [CPython 3.13.0, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

先修：[离线检索评估](offline-retrieval-evaluation.md)。目标：把候选文档变成可核对的证据片段，并解释“检索到了”与“能够据此回答”之间还有哪些步骤。

## 资料多，不代表上下文就该全部塞满

问HTTP超时时，检索到一篇包含超时和幂等的短文。直接把整篇甚至全库放进回答步骤，既增加输入，也会混入无关内容。检索上下文（retrieval context）需要有选取规则、资源预算和出处信息，而不是一段无法追溯的大字符串。

检索增强生成（RAG）把外部检索与生成模型结合。[Lewis等人的原始论文](https://arxiv.org/abs/2005.11401)研究了神经检索与生成模型的组合。本实验使用词法检索和逐字抽取基线，**没有运行该论文模型或任何LLM**；它让读者先把资料选择与证据传递做成能测试的工程接口。

## 从原文位置生成片段

[answers.py](https://github.com/patricklfdm/knowledge-base/blob/v5/examples/search-lab/answers.py)按句末标点分段，过长句子再按最多80个Python字符切开，不设重叠。每段保留doc_id、chunk_id、原文start/end、quote以及文档摘要。偏移指向原文，使用text[start:end]就能复原引用。

固定长度切割会截断语义，80也不是普适最佳值。这里选择简单可预测的规则，练习中可以改变它并观察召回与引用的变化；修改切割规则要连同上下文版本和评估一起复核。

## 预算落在哪一层？

程序先取最多2篇可见候选文档，再按各篇内片段与查询词元的重合数排序，同分按原文位置。没有词元交集的片段跳过；单片段放不进剩余预算时整段跳过，不临时截断已记录的quote。默认最多2段，总引用正文最多160字符，允许参数上限512字符/4段。

这不是模型token预算，也不包含question、policy和JSON字段等完整请求开销。Python字符串长度也不等同视觉字形数量。真正接模型时，需要在传输适配器中按选定模型的完整请求协议另算预算，不能把160字符当成160个收费token。

## 看一个实际上下文

```sh
npm test --prefix examples/search-lab
npm run context --prefix examples/search-lab
```

固定CPython3.13.0运行“HTTP超时”，选中http-timeout:0，quote为“HTTP超时可能留下未知结果。”，source_chars=15。原文另一句“使用幂等键处理重复请求。”没有共享查询词元，被本规则跳过。

这个现象恰好展示边界：上下文选择准确可追溯，也可能丢掉有帮助的解释。把查询改为“HTTP超时 幂等键”后再观察，不能把一段逐字正确的引用当成已完整回答用户需求。

## 身份、指令与资料分开

上下文对象分别保存question、policy、sources和budget，再对整个payload生成context_sha256。相同输入重跑摘要相同；即便片段不变，改变预算配置也改变摘要。后续输出必须带回本次上下文摘要，避免误接上一轮结果；摘要用于身份比对，不提供认证。

policy文字声明检索资料只是数据，sources保留原文。结构分开方便审计，但JSON字段名或分隔符本身不会自动给真实模型建立安全边界。R05会用没有工具执行能力的本地工作流演示更具体的限制。

## 无证据与迁移练习

没有候选，或预算小到放不下任何片段时，抽取基线返回abstained且citations为空。这表示“当前流程不提供证据”，不证明整个知识库没有答案；R02同义查询失败也会走到这里。

练习把char_budget设为1，预测是否会返回被截断的“H”。提示：不会，整段被跳过。再把长句加到80字符以上，核对每段≤80且偏移拼接仍能还原原文；然后讨论语义完整性为何需要另一类评估。

真实偏移/预算/重复运行/空证据已测试，作者另按引用追溯任务复核。浏览器、真实RAG模型、向量库、token计费与回答质量评估 **NOT_RUN**。下一篇：[结构化输出契约](structured-output-and-evidence.md)。

[返回搜索与AI应用路线](../../roadmaps/search-ai-foundations.md)
