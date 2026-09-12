# H0 接手与基线复现

## 目标与范围
保护现有站点，确认实际环境与部署链，再进入 H1 最小检查。仅本仓库；不初始化、不发布、不访问其他项目。

## 当前事实
根目录为当前 knowledge-base；origin=patricklfdm/knowledge-base；分支 v5；HEAD=6a4b2eaadb1750e4da9ae872b851b0f5bffe7710。用户已有未跟踪 AGENTS.md 与 docs/knowledge-base/codex/，保留且不混入实现提交。
.nvmrc=24.21.0，.node-version=v22.16.0，默认 shell Node=20.20.2/npm=10.8.2；本机已有 Node 24.21.0，使用命令级 PATH，不修改全局设置。

## 步骤与验证
1. 核对身份、文件、所有 workflow 与旧规则。
2. 用 git archive HEAD 在 /tmp 创建无 node_modules/.quartz 缓存的副本；npm ci、插件安装、正式构建；记录锁文件散列。
3. 分别运行 npm check/test，分类上游问题。
4. 记录 reports/H0-baseline.md，更新 BACKLOG/STATE，进入 H1。

## Progress
- 已完成：身份与既有改动记录、规则及工作流读取。
- 已完成：隔离安装、构建、上游 check/test 分类、报告、H0 gate。

## Decisions and discoveries
所有五份继承 workflow 的实际 jobs 均限定上游，本站发布缺内容检查。quartz.lock.json 未跟踪。Node 版本文件不一致将在 H1 小范围修复。

## Recovery
先读 reports/H0-baseline.md（若存在），然后查看 /tmp/kb-h0-path.txt 指向的本轮副本与日志。只清理本轮生成目录，保留原工作区依赖与用户文档。

## Outcome
见 reports/H0-baseline.md。H0 已验收，继续 H1；部署 not_requested。
