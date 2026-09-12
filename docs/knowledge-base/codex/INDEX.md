# Codex 交接索引

## 必须保留的上下文

用户已完成本地构建和 GitHub Pages 上线，后续整体移交 Codex。不是从零初始化项目，也不是让 Codex一次性生成整个百科。目标是可逐步使用、持续维护、有测试和来源的中文全栈工程教材。

## 读取顺序

首次接手：AGENTS → BASELINE → PROJECT_CHARTER → OPERATING_MODEL → FIRST_TASK → ROADMAP → BACKLOG/STATE → 当前任务相关规范。

后续会话：AGENTS → STATE/BACKLOG → 当前执行计划和报告 → 当前任务相关规范。不要每次重新浏览全部上游文档或所有课程。

| 文档 | 作用 |
| --- | --- |
| [BASELINE](BASELINE.md) | 快照证据、用户反馈与未知项 |
| [PROJECT_CHARTER](PROJECT_CHARTER.md) | 产品目标、固定边界与非目标 |
| [ROADMAP](ROADMAP.md) | H0–H7 全周期里程碑与验收 |
| [CURRICULUM](CURRICULUM.md) | 11 个领域、学习路径和样板路线 |
| [CONTENT_STANDARD](CONTENT_STANDARD.md) | 写作、案例、例子、练习与来源 |
| [METADATA_CONTRACT](METADATA_CONTRACT.md) | 兼容现有笔记的结构与状态规则 |
| [ENGINEERING_SPEC](ENGINEERING_SPEC.md) | 平台、工具、示例、CI 与性能范围 |
| [QUALITY_GATES](QUALITY_GATES.md) | 自动与人工验收以及失败分类 |
| [OPERATING_MODEL](OPERATING_MODEL.md) | 授权、自主执行、提交、发布与恢复 |
| [PLANS](PLANS.md) | 执行计划格式与维护要求 |
| [BACKLOG](BACKLOG.json) | 任务 ID、依赖、状态、证据 |
| [STATE](STATE.md) | 下一次执行从哪里恢复 |
| [FIRST_TASK](FIRST_TASK.md) | 首次接手的实作清单 |
| [DECISIONS](DECISIONS.md) | 已接受决策与待实证决策 |
| [SOURCES](SOURCES.md) | 基线和外部依据 |

## 冲突与事实来源

遵守运行环境/系统/开发者指令和当前用户明确授权。项目既定目标用 CHARTER；实际状态由当前文件、Git、命令和测试决定；任务状态用 BACKLOG。BASELINE 是历史快照，不是永远正确的运行状态。

旧 `docs/knowledge-base/PROJECT_RULES.md` 和旧模板保留为起步依据。H0/H1 应将其过期描述修正或改为指向现行规范，例如“尚未核验 ExplicitPublish”已不符合本包核对的配置。不能同时维护两份互相矛盾的现行规则，也不能默默忽略用户已有修改。

本交接引入 H0–H7 编号，用于区别已经完成的旧阶段 1/2。H0 是接手审计，不是重建旧阶段 1。
