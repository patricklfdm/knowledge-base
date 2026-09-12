# 本地验证与部署门禁

使用 `.nvmrc` / `.node-version` 指定的 Node 24.21.0，npm >=10.9.2。本次实际测试 npm 11.19.0。先 `npm ci`，再 `npm run quartz -- plugin install --from-config`。没有新增依赖；脚本复用已有 yaml、unified/remark、GFM、github-slugger 与 Quartz utils。

| 命令                    | 实际工作                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| npm run kb:check        | content 元数据、唯一 ID/URL/别名、先修 DAG、Markdown 内部链接/标题锚点、发布状态         |
| npm run kb:test         | 临时正常/失败 fixtures；CLI 返回码；产物检测器；CI 依赖保护                              |
| npm run kb:examples     | 明确运行 examples/foundations 的 5 组示例测试                                            |
| npm run kb:build        | `npm run quartz -- build`，现有 Quartz CLI，默认 content/public                          |
| npm run kb:output       | 对 public 的实际 HTML DOM 检查本站 base path、链接、资源与锚点                           |
| npm run kb:publish-test | 临时正文与产物，真实构建正面对照和 3 种禁发 marker，扫描全部产物，再注入泄漏证明检测有效 |
| npm run kb:verify       | 顺序执行 check/test/examples/tsc/build/output/publish-test；任何非零即停止               |

`npm test` 保留为上游及自有回归测试，在 CI 必需运行。`npm run check` 包含全仓 Prettier，H0 存在 8 个既有格式差异；本站门禁单独保留 tsc，不把既有格式噪声伪装成通过，也不整体格式化上游。自有改动在提交前做针对性格式检查。

H0 的 npx 包装启动曾在 Quartz banner 前 OOM，故 kb:build 直接调用 package 中已有 quartz 脚本；没有切换构建器。`npm run docs` 是上游 docs 站点，不用于本站。Google Fonts/OG 图片当前需要网络；无字体时构建可能失败，应恢复网络后重试，不能把失败写成成功。

## H1 支持范围

普通 Markdown inline/reference 链接、GFM 表格中的链接、相对路径与省略 .md、中文/百分号编码、重复标题锚点、代码块/行内代码中的伪链接。目标使用已安装 Quartz `relative` resolver（H2 为普通相对 Markdown 链接校准配置）；检测源文件大小写和 URL 冲突，发布页不能链接到未发布页。别名作为同目录重定向路径检查冲突，不作为任意标题搜索的替代。

H1 尚不支持 Obsidian wiki/block、脚注、原始 HTML、内部 query、绝对站内路径、content 附件和 srcset；遇到这些语法会明确失败，需扩展解析和构建互证后使用。正文请使用普通 Markdown。H4 将增加附件允许清单/大小/引用检查；当前所有非 Markdown content 文件（排除配置忽略目录）均拒绝，避免宽松放行。

`private/templates/.obsidian/.trash` 与当前 Quartz ignorePatterns 一致；它们仍不是保密边界。符号链接拒绝。没有对外链可达性做网络爬取；来源由每篇核验记录证明。标题中的特殊插件格式如高亮/数学会以构建后 ID 为最终互证，不应只靠源码检查宣称链接有效。

## CI 与发布

`knowledge-base-checks.yml` 对 PR v5、其他分支 push 和手动检查运行，并提供 workflow_call。v5 push 的现有 publish 工作流调用同提交 quality；build needs quality，deploy needs build。build 限定本仓库 v5，再检查实际上传产物。内容、测试、类型、真实过滤测试或原有回归失败都会阻止 deploy。锁文件漂移检查也必须通过。

本地测试证明配置依赖与失败返回码；真实远端执行在当前批次未授权时为 NOT_RUN。只有明确授权发布本批次后，才普通 push origin/v5 并跟踪同 SHA 部署。五份继承 workflow 的上游限制保持不变。
