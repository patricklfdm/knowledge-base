# H0 接手验收报告

## 范围与基线

2026-09-11 America/Los_Angeles；H0-001、H0-002、H0-GATE。
基线 SHA `6a4b2eaadb1750e4da9ae872b851b0f5bffe7710`，origin `https://github.com/patricklfdm/knowledge-base.git`，v5；upstream 仍为 Quartz。与交接快照一致。
用户已有未跟踪 AGENTS.md 与 docs/knowledge-base/codex/，保留且不自动纳入实现提交。无其他已跟踪修改；没有读取凭据、私密笔记或其他项目。

## 环境与验证

以 `git archive HEAD` 解包至本轮临时目录，未复制 node_modules、.quartz 或用户 content/.obsidian。命令级 PATH 使用已有 Node v24.21.0/npm 11.19.0，macOS arm64。默认 shell Node v20.20.2/npm 10.8.2 不满足项目 engine；.node-version=v22.16.0 与 .nvmrc=24.21.0 不一致。

| 命令 / Gate                             | 结果         | 实际观察                                                                                               |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| G0 Git 身份/改动检查                    | PASS         | 根目录、origin、v5、HEAD 已核对                                                                        |
| npm ci（沙箱）                          | FAIL         | registry.npmjs.org ENOTFOUND；不属于代码回归                                                           |
| npm ci（环境审批后）                    | PASS         | 368 packages，审计 0 vulnerabilities；npm 11 提示 4 个包 install scripts 需 review，未擅自修改全局设置 |
| npx quartz plugin install --from-config | PASS         | 沙箱首次缓存写入 EPERM；审批后 `All configured plugins are already installed`                          |
| npx quartz build                        | FAIL         | 输出 Quartz banner 前 V8 heap OOM（约 2 GB）；不是内容解析失败，具体 npm 原因未确定                    |
| npm run quartz -- build（同一仓库 CLI） | PASS         | 沙箱字体下载失败导致 CustomOgImages 异常；审批联网重试后 7 Markdown / 79 产物、exit 0                  |
| npm run check                           | FAIL（既有） | tsc 通过，Prettier 报 7 个 content 文件与发布 workflow 格式差异                                        |
| npm test                                | PASS         | 沙箱首次 tsx IPC EPERM；审批后 163 tests / 45 suites、0 fail                                           |
| package-lock 漂移                       | PASS         | 安装前后 SHA256 均为 6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0                  |
| G7 界面 / G8 本批远端执行               | NOT_RUN      | H0 未改 UI；没有本批发布授权                                                                           |

`quartz.lock.json` 未跟踪，也未由本次安装生成。当前配置使用 npm source，由 package-lock 锁定 npm 包；from-config 的 Git/local 安装路径不是 frozen npm 安装。实际配置包含未安装的 obsidian-plugin-excalidraw，构建警告跳过；现有正文无此内容。禁用的 @quartz-themes/core 保持禁用。archive 无 .git 导致 created-modified-date 的 Git 日期警告，构建可回退 filesystem；正式 checkout 保留 Git 历史。

本轮完整日志在隔离目录的 h0-*.log；临时位置记录于 /tmp/kb-h0-path.txt（不作为永久证据）。本报告保留可复现命令与关键结果，未把本机绝对路径和原始堆栈入库。复现时从目标 SHA archive，设置 .nvmrc 对应 PATH，再按上表安装/构建；需要字体网络。

## 工作流审计

| 文件                       | 触发器                                          | 在本仓库的行为 / 权限                                                                                       |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ci.yaml                    | PR v5、push v5、dispatch                        | 两 job 均限 jackyzha0/quartz；上游 build/test 和 tag contents:write 不在本站运行                            |
| build-preview.yaml         | PR opened/synchronize、dispatch                 | job 限上游；build docs 上传 preview，Node 22                                                                |
| deploy-preview.yaml        | Build Preview Deployment workflow_run completed | job 限上游且 success；Cloudflare，声明 deployments/PR write，不在本站执行                                   |
| deploy-v5.yaml             | push v5、dispatch                               | job 限上游；Cloudflare，deployments:write，不在本站执行                                                     |
| docker-build-push.yaml     | push v5/tags v*、PR v5 paths、dispatch          | job 限上游；GHCR 镜像发布不在本站执行                                                                       |
| publish-knowledge-base.yml | push v5、dispatch                               | 唯一本站发布链；contents:read，deploy 单独 pages/id-token write；deploy needs build，目前只有构建无内容检查 |

未改变分支、部署 URL、许可证、主题或上游保护。未查远端 branch protection 设置，状态 unknown。历史线上成功来自交接快照，不冒充本批运行。

## 问题、结论与恢复

H0 接手基线可继续使用，标 done；发现的 npm 启动、字体网络、Excalidraw 配置和既有格式问题保留。H1 使用已有 `npm run quartz --` 直接 CLI，统一 Node 文件、实现内容门禁和部署依赖，不批量格式化上游源码。附件/UI/云端证据留后续明确验收。

Git：本批报告与检查实现正在工作区编写，尚未提交；部署 not_requested，未 push/PR/tag。下一项 H1-001，执行计划 `docs/knowledge-base/codex/plans/H1-001-quality-foundation.md`。
