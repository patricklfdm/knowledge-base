# 第一次接手：H0 → H1 → H2

## 不能跳过的前置读取

AGENTS、INDEX、BASELINE、CHARTER、OPERATING_MODEL、现有 PROJECT_RULES、QUARTZ config、package/锁文件、所有 workflow 触发条件。当前工作区比快照更权威。

## H0-001 身份、文件与变更审计

先运行只读命令：`pwd`、`git rev-parse --show-toplevel`、`git status --short`、`git branch --show-current`、`git log -3 --oneline`、`git remote -v`。remote URL 含凭据时不得记录原始输出。读取 `.nvmrc`、`.node-version`、package scripts、quartz.config.yaml 和已有规则。

把用户未提交改动单独记录，安装交接包文件可识别为本次新增。读取 gitignore，确认 content 之外也没有误纳私密文件。只在本项目范围内检查，不搜索整个用户 home。

## H0-002 干净基线与发布链

在不会破坏用户环境的隔离副本/worktree 中复现依赖安装、插件安装、Quartz build。记录版本、锁文件变化与第一条错误，不用升级解决所有问题。不自动删除用户 node_modules 或改全局 Node。对已有 npm check/test 运行并分类，避免将上游格式问题误称本站测试通过。

审计所有 .github/workflows：哪些运行、哪些上游限定、是否有无关镜像/tag/预览任务、本站部署需要什么权限。读取发布运行信息可作为历史证据，但重新构建和新 CI 验证另计。

输出 `reports/H0-baseline.md`：事实、命令、结果、未知、风险、需保留内容；更新 STATE/BACKLOG。需要少量修复可做，但不要扩大成主题迁移或全面依赖升级。

## H1 最小可执行契约

把 METADATA_CONTRACT 落为可测代码；扫描当前种子导航并兼容；新增 fixtures，证明缺字段/类型错/重复 ID/先修环/坏链接会失败。为 draft/unpublished 排除做合成构建测试。校验器不执行文章 shell。

建立项目专属 CI，并让 publish 的 build/deploy 等待同提交的必要 gate。继续沿用现有发布入口，不重建仓库。新增命令、规则和旧规则在同一批次对齐。

## H2 样板而不是再写计划

H1 通过后写 F00–F02 三篇连续样板。每篇都有来源、可复制例子、实际结果、至少一个失败路径和迁移练习。建立独立 examples 目录但不一次搭完整后端。改善当前文章显示和必要导航，实际查看桌面/窄屏。

没有浏览器工具时，完成其他可测内容并记下 G7 NOT_RUN，不能宣称视觉验收通过。下一会话继续该阻塞，不重复创建样板。

## 首次工作停止条件

不是“写完计划就停”。至少完成一个真实可验收增量；阻塞则交付能做部分与具体证据。会话有余力且下项依赖满足，就继续本地下一项；不能不经发布授权 push。
