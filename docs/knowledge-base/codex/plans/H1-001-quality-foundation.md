# H1 最小质量底座

## 目标
让元数据、必要先修或链接错误在本地与 Pages 部署前失败；现有七篇种子导航继续可用。

## 当前事实与范围
H0 已通过，见 reports/H0-baseline.md。已有 yaml、unified、remark-parse、github-slugger、HAST 工具与 GFM 插件可复用，不新增依赖。默认 review-before-push，所有远端执行 NOT_RUN。

## 步骤与验证
1. scripts/knowledge-base/check.mjs：类型/状态/唯一性/先修 DAG，Markdown AST 链接和锚点；明确拒绝未支持语法。
2. tests/knowledge-base/：正常导航、缺字段、类型、重复、环、失效链接等临时 fixtures，验证 CLI 非零。
3. 构建后检查真实 HTML 链接/资源；临时正文构建合成禁发 marker，扫描全部产物，破坏产物证明检查会失败。
4. package.json 增加实际实现的 kb:*；新专属检查 workflow 被发布工作流显式 needs 引用；测试依赖关系与错误不可忽略。
5. 同步旧规则与模板入口，统一 .node-version；隔离副本验证所有门禁，记录 reports/H1-quality-foundation.md。

## Progress
- 已完成：读取规范与可复用解析器/工作流审计。
- 已完成：实现、32 个测试、隔离构建与过滤器验证、报告。

## Decisions and discoveries
H1 先完整覆盖现有 Markdown 写法。Obsidian 特殊语法/原始 HTML 等若未实现应报 UNSUPPORTED 并拒绝，不冒充全格式支持。附件全矩阵留 H4。不得执行正文 shell。

## Recovery
读 H0 报告确认前置；检查本计划 Progress；npm 使用 .nvmrc 版本。用户交接文档保持未跟踪来源边界，小提交只包含自己新增实现与明确修改的跟踪文件。

## Outcome
本地 H1 已验收，证据 reports/H1-quality-foundation.md；远端 NOT_RUN；部署 not_requested。
