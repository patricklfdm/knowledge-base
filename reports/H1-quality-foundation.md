# H1 最小质量底座验收

## 范围与基线
2026-09-11 America/Los_Angeles；基线 6a4b2eaadb1750e4da9ae872b851b0f5bffe7710 + 本地 diff。H1-001、H1-002、H1-GATE。H0 前置证据见 H0-baseline.md。

新增 scripts/knowledge-base/{check,check-output,verify-publish}.mjs、tests/knowledge-base/、knowledge-base-checks.yml；发布工作流显式依赖检查；package 增加真实 kb:*；.node-version 与 .nvmrc 对齐。PROJECT_RULES、旧模板入口、README 与 VALIDATION.md 协调。无新增依赖、无锁文件变化、无 Quartz 上游源码修改。

## 实测证据
在 H0 的干净依赖副本叠加明确的脚本、测试、配置文件；未复制用户编辑器目录。Node 24.21.0/npm 11.19.0，macOS arm64。

| Gate / 命令 | 结果 | 证据与断言 |
| --- | --- | --- |
| G1/G2 npm run kb:check | PASS | 7 篇种子导航，0 errors；代码中伪链接不误报 |
| G4 npm run kb:test | PASS | 最终 32 tests；缺字段、类型、重复 ID/URL/alias、先修未知/自依赖/重复/环、坏路径/锚点/大小写、未发布先修、CLI 非零等 |
| G6 tsc --noEmit | PASS | kb:verify 内真实执行，没有跳过类型错误 |
| G6 npm run kb:build | PASS | 同一 Quartz CLI；7 篇、79 产物 |
| G2 npm run kb:output | PASS | 实际 14 个 HTML、79 文件；base /knowledge-base/、内部链接/资源/锚点，0 errors |
| G3 npm run kb:publish-test | PASS | 合成公开 control 被构建；draft=true/publish=true、publish=false、缺省 publish 三种 marker 全产物均无；HTML/搜索/RSS/sitemap 存在；注入泄漏后检测命中 |
| 汇总 npm run kb:verify | PASS | check → test → tsc → build → output → publish-test 顺序非零即停 |
| 上游及自有 npm test | PASS | 最终 195 tests / 45 suites，0 fail；沙箱 IPC 受限，审批后在隔离副本执行 |
| 锁文件 | PASS | package-lock.json 与 H0 相同；新增 scripts 不改变依赖树 |
| 针对性 Prettier / git diff --check | PASS | 自有脚本、测试、修改文档与 workflow；未整体格式化上游 |
| CI 依赖结构 | PASS（本地） | workflow.test.mjs 解析实际 YAML；build needs quality、deploy needs build；破坏 needs 或允许忽略失败时测试抛错；checkout 不改 ref |
| G7 UI | NOT_APPLICABLE | 此批未改 content/样式/布局；H2 开始真实阅读验证 |
| G8 同 SHA 远端 checks/deploy | NOT_RUN | 当前批次未授权发布；不能把本地 YAML 证明称为云端成功 |

临时 h1-verify.log/h1-regression-final.log 保存完整运行输出，本报告和受维护测试为持久证据。复现：按 VALIDATION.md 干净安装后运行 kb:verify 与 npm test。

## 发现、边界与风险
测试先抓到重复 ID 覆盖节点导致漏判环的问题，改为保留首个节点并拒绝重复；大小写另行检查源文件，避免 Quartz URL 小写化掩盖错误。404 返回首页使用 /knowledge-base 无末尾斜杠，为合法目录入口，与 /knowledge-base/ 等价，产物检查已覆盖。

H1 是明确有限范围的门禁：支持 Markdown AST/GFM 链接、中文编码与标题；wiki/block/脚注/原始 HTML/query/srcset/附件尚未支持时拒绝并给出 UNSUPPORTED，不默默跳过。不声称完成 Obsidian 全语法或 H4 附件验收。配置假设有回归测试。外部链接在线可达性留内容逐篇核验。

原有 npm check 格式差异未批量修复；配置 Excalidraw 缺包与联网字体依赖仍属 H0 基线问题。当前内容无 Excalidraw，因此 H1 未为它增加依赖。远端分支保护 unknown，工作流更新未发布。

## Git、结论与恢复
H1 三个任务可标 done；review-before-push，部署 not_requested，未 push/PR/tag。本次小提交仅选择自有实现/报告/计划及明确修改的跟踪文件；用户初始未跟踪交接资料保持未跟踪。状态文件按授权更新但不混入实现提交。

下一项 H2-001：F00–F02 三篇连续样板及 examples 独立环境，随后 H2-002 阅读检查。恢复看 BACKLOG、STATE 与 plans/H2-001-foundations.md。
