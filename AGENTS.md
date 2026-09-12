# KnowledgeBase: Codex working agreement

## Mission

维护中文全栈工程知识库：Markdown + Obsidian + Git + Quartz 5 + GitHub Pages。文章必须渐进、易懂、有实际场景和验证证据。平台工程和内容建设并行；不要自研 Notion，不迁移框架。

## Read before changes

从 `docs/knowledge-base/codex/INDEX.md` 开始。必读 `PROJECT_CHARTER.md`、`STATE.md`、`BACKLOG.json`、`OPERATING_MODEL.md` 与 `QUALITY_GATES.md`；按任务读取其余规范。复杂或跨文件工作依据 `PLANS.md` 写可恢复执行计划。已存在的更高优先级指令和当前用户授权始终有效。

## Start every session

确认 Git 根目录、工作区、HEAD 和 origin；目标只能是 `patricklfdm/knowledge-base`。预计工作/部署分支是 `v5`，但以实际检查和用户授权为准。保护已有修改，不擅自切分支或覆盖。读取上次检查点，然后实际实现下一项，不只写方案。

## Preserve

- `content/` 是 Obsidian Vault 与公开正文源；`docs/knowledge-base/` 是可公开工程文档。
- 私密笔记、凭证、个人学习进度、私有项目材料在整个仓库之外。`draft`、`publish` 与隐藏链接不是保密机制。
- `@quartz-themes/core` 保持禁用；不要重跑初始化、整体升级依赖、改仓库/分支/部署地址。
- 保留 Quartz 许可证与署名。知识库任务不授权修改 Wayvia/GSE。

## Work and evidence

先验收最小基础检查，再以 1–3 篇/批编写可验证笔记。遵循 `CONTENT_STANDARD.md`、`METADATA_CONTRACT.md`。示例执行、来源核验、性能数字必须有真实证据；未运行写 NOT_RUN。计划/草稿/已测试/已部署/学习掌握是不同状态。

已核对命令：`npm ci`、`npx quartz plugin install --from-config`、`npx quartz build`、`npx quartz build --serve`。以实际 package.json/锁文件为准。`npm run docs` 构建上游 docs，不是本站。H1/H2 已实现的 `kb:*` 命令与支持边界见 `docs/knowledge-base/VALIDATION.md`；新增命令仍须先实现再声明可用。

在隔离环境验证依赖安装和构建，检查锁文件漂移；不要批量格式化整套上游源码掩盖差异。检查必须有能故意失败的测试用例，不能只证明“正常文件可通过”。

## Autonomy and publishing

按 BACKLOG 依赖自主实施、小提交和更新计划，不需要每阶段回 ChatGPT。默认 `review-before-push`：不推送、不公开 PR、不打 tag。用户在当前 Codex 会话明确授权发布该批次后，才验证目标、门禁、提交范围并普通推送既有 v5；跟踪同 SHA 部署。遵守环境审批，不关闭沙箱或绕过权限。

禁止强推、破坏用户改动、读取秘密、生产数据操作、未授权付费或公开资料。高风险变化需要确认；普通可逆细节自行决定并记录。

## State and completion

`BACKLOG.json` 是任务状态唯一台账；`STATE.md` 只记录当前检查点与下一项引用。每批更新执行计划、报告、相关 backlog 状态。DONE 必须关联可读验收报告。会话结束前保存恢复指令，不能声称离线持续执行。中文汇报完成项、验证结果、风险、Git 状态、下一项，以及是否尚未发布。

当前用户覆盖（2026-09-11）：内容优先，暂不进行浏览器测试；每轮完成适用验证后自动普通 push 既有 v5，直到用户另行说明。优先于旧 prompt 默认值；具体范围与 UI 延期见 `docs/knowledge-base/codex/OPERATING_MODEL.md`。
