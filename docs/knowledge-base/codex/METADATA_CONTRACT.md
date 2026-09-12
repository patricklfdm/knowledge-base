# 元数据与链接契约 v1

本契约的 H1 核心规则已实现并测试，实际支持范围见 [VALIDATION](../VALIDATION.md)。兼容起步笔记的 `note_type`、`status`、`level` 等字段，不擅自另起 type/difficulty/review_status 多套语义。

## 字段

| 字段 | 规则 |
| --- | --- |
| id | content 内唯一、稳定、小写字母/数字/连字符；改路径不必改 ID |
| title | 非空中文可读标题 |
| description | 一句话说明学习成果或导航用途 |
| note_type | navigation / concept / tutorial / how-to / reference / case-study / lab |
| level | 教学正文 L0–L5；navigation 可省略 |
| status | seed / draft / reviewed / needs-update；seed 只给起步导航 |
| draft | YAML boolean，不能是字符串 "false" |
| publish | YAML boolean；默认 false，不能用 truthy 字符串 |
| prerequisites | 教学正文必填数组，元素为已存在 note id，不用模糊标题 |
| topics | 教学正文的领域/主题标识数组，少量稳定标签 |
| tags / aliases | 可选非空字符串数组；别名不允许制造歧义 |
| tested_with | 教学正文必填数组，可空；只列实测环境 |
| verified_on | reviewed 正文必填 ISO 日期；草稿为 null；导航可省略 |

现有 navigation 不强制补大量无意义字段，保留简单。新正文使用 templates/ARTICLE_TEMPLATE.md。不可运行的 concept 可以 tested_with=[]，在核验段说明“概念来源核验，未声明可执行示例”，而不是伪造环境。

## 编辑状态与发布状态

- 正式进入网站：`publish: true` 且 `draft: false`，并满足 reviewed 或 navigation+seed 的质量条件。
- 草稿：status=draft，draft=true，publish=false。保密资料完全不进仓库。
- needs-update：默认撤下发布。若内容仍正确、仅版本复查到期，可记录明确的维护例外，站点展示警示、原因、复核截止日期及负责人；不能无限期例外。
- `status` 不是 Quartz 的天然发布过滤字段，因此必须由项目验证器检查，不能假设网站自己执行这条规则。

不要用 verified_on 自动过期就批量撤站；年龄只是复核提醒，是否错误要分析。没有 reviewed 证据的文章不得仅改字段获得发布资格。

## 先修与引用

所有 prerequisite ID 必须存在；不允许自依赖、重复依赖或环。对发布正文的必要先修必须也已发布，或者在同篇明确完整讲清并删除该外部前置依赖。普通“相关知识”可以成环，不能用先修 DAG 限制所有双向链接。

优先普通相对 Markdown 链接。Obsidian 链接是后续兼容目标，当前验证器明确拒绝 wiki/block 语法；实现后必须采用与 Quartz 相同的解析语义，并报告歧义。检查相对路径、扩展名、省略扩展、中文/URL 编码、锚点、图片/附件、别名和大小写。不要用一个简单正则就声称完整支持所有 Markdown/Obsidian 语法。

检查应忽略代码块中的示意链接，区分外部 URL、mailto、锚点和本地目标；不对规划文字强行生成文件。线上 base path `/knowledge-base/` 下也要验证链接、资源、404。

## 迁移方案

先扫描 content，输出兼容性报告；仅修正实际不符合的自有文件。旧导航字段豁免和起步 seed 状态必须有明确规则。docs/knowledge-base/codex 下的模板和规划不是 content 正文，不受公开笔记 schema 强制要求。

避免“同时改所有 ID/路径/字段/布局”的大迁移。需要路径迁移时建立映射和重定向并测试外链兼容。FIELD 变更必须带 schema 版本、迁移和负面用例。

H3 内容优先阶段：reviewed/verified_on 表示已执行的内容、来源与非浏览器示例复核，不能解读为页面或教学应用 UI 已验收。受当前用户授权延期的 UI 在正文核验段和报告明确 NOT_RUN，详见 QUALITY_GATES；tested_with 不填写未经实际测试的浏览器。
