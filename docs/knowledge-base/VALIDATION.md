# 本地验证与部署门禁

使用 `.nvmrc` / `.node-version` 指定的 Node 24.21.0，npm >=10.9.2。本次实际测试 npm 11.19.0。先 `npm ci`，再 `npm run quartz -- plugin install --from-config`。根依赖未增加；检查脚本复用已有 yaml、unified/remark、GFM、github-slugger 与 Quartz utils。

| 命令                    | 实际工作                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| npm run kb:check        | content 元数据、唯一 ID/URL/别名、先修 DAG、Markdown 内部链接/标题锚点、发布状态         |
| npm run kb:test         | 临时正常/失败 fixtures；CLI 返回码；产物检测器；CI 依赖保护                              |
| npm run kb:examples     | 明确运行 foundations 的13组、typed-trips 的4组、web-forms 的5组、http-trips 的8组、trip-api 的10组、sql-trips 的18组与 trip-app 的13组示例测试                                  |
| npm run kb:build        | `npm run quartz -- build`，现有 Quartz CLI，默认 content/public                          |
| npm run kb:output       | 对 public 的实际 HTML DOM 检查本站 base path、链接、资源与锚点                           |
| npm run kb:publish-test | 临时正文与产物，真实构建正面对照和 3 种禁发 marker，扫描全部产物，再注入泄漏证明检测有效 |
| npm run kb:recovery-test | 临时无remote Git夹具，正常断言/故意坏提交/普通revert恢复与清理 |
| npm run kb:verify       | 顺序执行 check/test/examples/recovery-test/tsc/build/output/publish-test；任何非零即停止               |

`npm test` 保留为上游及自有回归测试，在 CI 必需运行。`npm run check` 包含全仓 Prettier，H0 存在 8 个既有格式差异；本站门禁单独保留 tsc，不把既有格式噪声伪装成通过，也不整体格式化上游。自有改动在提交前做针对性格式检查。

H0 的 npx 包装启动曾在 Quartz banner 前 OOM，故 kb:build 直接调用 package 中已有 quartz 脚本；没有切换构建器。`npm run docs` 是上游 docs 站点，不用于本站。Google Fonts/OG 图片当前需要网络；无字体时构建可能失败，应恢复网络后重试，不能把失败写成成功。

## H1 支持范围

普通 Markdown inline/reference 链接、GFM 表格中的链接、相对路径与省略 .md、中文/百分号编码、重复标题锚点、代码块/行内代码中的伪链接。目标使用已安装 Quartz `relative` resolver（H2 为普通相对 Markdown 链接校准配置）；检测源文件大小写和 URL 冲突，发布页不能链接到未发布页。别名作为同目录重定向路径检查冲突，不作为任意标题搜索的替代。

H1 尚不支持 Obsidian wiki/block、脚注、原始 HTML、内部 query、绝对站内路径、content 附件和 srcset；遇到这些语法会明确失败，需扩展解析和构建互证后使用。正文请使用普通 Markdown。H4 将增加附件允许清单/大小/引用检查；当前所有非 Markdown content 文件（排除配置忽略目录）均拒绝，避免宽松放行。

`private/templates/.obsidian/.trash` 与当前 Quartz ignorePatterns 一致；它们仍不是保密边界。符号链接拒绝。没有对外链可达性做网络爬取；来源由每篇核验记录证明。标题中的特殊插件格式如高亮/数学会以构建后 ID 为最终互证，不应只靠源码检查宣称链接有效。

## CI 与发布

`knowledge-base-checks.yml` 对 PR v5、其他分支 push 和手动检查运行，并提供 workflow_call。v5 push 的现有 publish 工作流调用同提交 quality；build needs quality，deploy needs build。build 限定本仓库 v5，再检查实际上传产物。内容、测试、类型、真实过滤测试或原有回归失败都会阻止 deploy。锁文件漂移检查也必须通过。

本地测试证明配置依赖与失败返回码；真实远端执行在当前批次未授权时为 NOT_RUN。只有明确授权发布本批次后，才普通 push origin/v5 并跟踪同 SHA 部署。五份继承 workflow 的上游限制保持不变。

## H3-001B TypeScript 示例

首次运行根门禁前，另执行 `npm ci --prefix examples/typed-trips`。`kb:examples` 显式运行 foundations、typed-trips、无依赖 web-forms 、http-trips 、trip-api 、sql-trips 和 trip-app 七个包；typed-trips 测试真实调用固定 TypeScript 5.9.3 检查器，并用 Node24 执行类型擦除后的程序。根 `npm ci` 不会安装独立包依赖。CI 已登记独立安装及全部示例 manifest/lock 的漂移检查，遗漏安装步骤的负面用例会失败。

web-forms 的测试含浏览器脚本语法检查与纯输入转换，未执行 DOM/键盘/屏幕阅读器测试。H3 内容优先期间 G7 与应用交互按用户要求 NOT_RUN，见 codex/QUALITY_GATES.md；HTTP 文本请求不替代浏览器验收。

http-trips 使用Node内置HTTP/fetch，自动监听并关闭127.0.0.1随机端口；8组测试验证真实请求、查询/片段、400/404/405/500、坏JSON、重复消费、断连和独立入口退出。环境若限制本机监听需正常审批，不是浏览器测试；没有业务写入。

trip-api为独立无依赖的内存创建/读取API，10组测试含201/Location、业务输入、媒体/编码、1024/1025字节、分块/UTF-8、失败无写入和新实例数据为空。仍只监听本机临时端口，不是数据库或浏览器验收。

sql-trips使用Node内置SQLite，无npm依赖；8组测试覆盖参数绑定、数据库约束、类型转换、旧表不自动迁移、文件跨进程读取与内存对照。只写自建临时数据库并清理，不连接API或用户数据。

trip-app提供同源教学页面、HTTP创建/查询/PUT和SQLite；13组测试覆盖持久化、非法修改、500故障、静态白名单与Host/Origin、客户端与控制器。真实DOM仍NOT_RUN。

F12/F13在trip-app内增加备注临时副本、迁移/回滚及只读smoke，基础应用接口保持；npm run exercise与npm run smoke须在该示例目录运行。根测试自动包含evolution.test.mjs，浏览器仍不运行。

H4回退夹具已加入kb:verify，因此现有同SHA质量门禁也必须通过；不执行本项目或线上回退。UI与kb:e2e仍按原授权延期。发布恢复流程见RELEASE_RECOVERY.md，集中候选见UI_ACCEPTANCE.md。

S01/S02复用sql-trips新增7组关系/事务测试，原F10八组保留，合计15组；测试脚本覆盖该包维护的全部*.test.mjs，仍通过既有kb:examples与根npm test执行。未新增依赖或浏览器测试。

S03新增3组索引/结果等价/边界与增改删检查，sql-trips合计18组；EQP计划断言是固定版本教学观测，不是业务应用解析契约。
