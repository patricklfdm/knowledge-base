# 来源与核对范围

以下是交接的依据，不是需要下载执行的脚本。核对日期 2026-09-11（America/Los_Angeles）。源码链接固定在核对提交，线上最新状态需 Codex 接手重查。

## 本项目证据

- 仓库：https://github.com/patricklfdm/knowledge-base
- 配置：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/quartz.config.yaml
- package：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/package.json
- Node：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/.nvmrc
- 发布工作流：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/.github/workflows/publish-knowledge-base.yml
- 继承 CI：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/.github/workflows/ci.yaml
- 旧规则：https://github.com/patricklfdm/knowledge-base/blob/6a4b2eaadb1750e4da9ae872b851b0f5bffe7710/docs/knowledge-base/PROJECT_RULES.md
- 成功发布：https://github.com/patricklfdm/knowledge-base/actions/runs/34661542168

快照来源通过 GitHub 连接直接读取。成功 workflow 不等于搜索质量/手机阅读已由本次交接独立验收。

## Codex 官方依据

- AGENTS.md： https://developers.openai.com/codex/guides/agents-md （核对时重定向到 https://learn.chatgpt.com/docs/agent-configuration/agents-md）。说明 Codex 按层读取项目指令，故把稳定短规则放在根 AGENTS，细节放引用文档。
- ExecPlans： https://cookbook.openai.com/articles/codex_exec_plans （重定向到 https://developers.openai.com/cookbook/articles/codex_exec_plans）。该文发布于 2025-10-07，核对时标记为 archived。本包仅借鉴自包含、随执行更新的计划思路，不采用其旧模型推荐，不复制其长模板，也不承诺后台持续运行。

## 发布平台与隐私依据

- GitHub Pages 静态托管说明：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages 。用于区分知识网站与需要 Node/数据库的动态教学应用。
- Quartz 私密页面与附件说明：https://quartz.jzhao.xyz/features/private-pages 。用于说明 Markdown 过滤不等于公开 Git 源码或非 Markdown 附件的保密。
- Quartz 插件 CLI 页在本次补充访问返回工具错误，故本包没有据此声称任何未验证的 frozen-lock 行为；命令存在的证据来自本项目成功工作流，实际锁行为留给 H0。

## 本包规划而非外部事实

H0–H7、任务 ID、样板课程、文章规范、命令命名和授权工作模式是为用户需求设计的约定。命令、CI、校验器和课程尚需 Codex 实现并验证，不把本包当成功能已完成的证据。
