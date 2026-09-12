# H2 样板单元与阅读验收

## 范围与基线

2026-09-11 America/Los_Angeles。H2-001、H2-002、H2-GATE。
前置 H0/H1 已本地验收，工程提交 `55608c6`；阅读与跨目录链接修复提交 `367b6b9`。本报告用这两个父提交与本批内容 diff 标识工作，不反复 amend 自身 SHA。

新增三篇正文：

- `content/topics/02-foundations-tools/run-first-program.md`（F00）：运行、输出、文件错误与运行错误。
- `content/topics/01-languages/values-variables-types.md`（F01）：赋值、类型、拼接、严格相等与浮点边界。
- `content/topics/01-languages/conditions-and-functions.md`（F02）：条件、函数、整数与范围校验、真值反例。

完整受测文件在 `examples/foundations/`，独立 package/lock/README，零外部依赖；root `kb:examples` 明确登记这组测试。首页与 fullstack-foundations 增加真实入口，保留后续 10 项应用目标，不把导航或尚未实现的后端计为成果。

## 验证命令与结果

Node 24.21.0/npm 11.19.0，macOS arm64；H0 无缓存依赖安装副本叠加本批受控文件。原工作区 node_modules、Obsidian 配置与私密资料未复制到验收环境。

| Gate / 命令                  | 结果    | 实际证据                                                                                                                                                                                               |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1/G2 `npm run kb:check`     | PASS    | 10 notes，0 errors；其中 7 导航 + 3 正文                                                                                                                                                               |
| G4 `npm run kb:test`         | PASS    | 34 tests，含 H2 跨两层目录回归与 examples 边界；故意错误非零                                                                                                                                           |
| G5 `npm run kb:examples`     | PASS    | 5 组测试；输出、错误类型/行号/非零退出、1/30 两端及类型错误、真值错误放行                                                                                                                              |
| G5 独立例子干净安装          | PASS    | 将 examples 复制到含空格的新临时目录，`npm ci --offline && npm test`，5 组通过；fileURLToPath 支持目录空格                                                                                             |
| G5 迁移练习复核              | PASS    | F00 得到 `6` 与文字 `2 * 3`；F01 得到 string `41` / boolean；F02 2–14 规则的 6 种输入全部断言通过                                                                                                      |
| G6 `tsc --noEmit`            | PASS    | kb:verify 内真实运行；root tsconfig include 仍限定 Quartz 和根配置，示例不混入类型工程                                                                                                                 |
| G6 `npm run kb:build`        | PASS    | 10 Markdown，95 产物                                                                                                                                                                                   |
| G2 `npm run kb:output`       | PASS    | 22 HTML / 95 文件，base path、页面、资源、锚点 0 errors                                                                                                                                                |
| G3 `npm run kb:publish-test` | PASS    | 三种禁发 marker 全产物不泄漏；公开对照存在；故意注入泄漏可检测                                                                                                                                         |
| 汇总 `npm run kb:verify`     | PASS    | 最终内容/脚本/样式副本完整执行，exit 0                                                                                                                                                                 |
| `npm test`                   | PASS    | 最终 202 tests / 45 suites，0 fail；含原有 163、自有 34 与示例 5；tsx IPC 按环境审批运行                                                                                                               |
| 锁文件 / 定向格式检查        | PASS    | root 锁 SHA256 仍为 6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0；示例锁 e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2；仅格式化本批文件，git diff --check 通过 |
| G8 远端同 SHA 执行           | NOT_RUN | 本批未授权 push，CI/Pages 不冒充已执行                                                                                                                                                                 |

完整命令输出为本轮临时副本 h2-final-verify.log、h2-final-regression.log；临时位置记录于 /tmp/kb-h0-path.txt。本报告及受维护测试是持久可读证据，不依赖临时目录永久保留。

## 阅读与来源复核

作者自审后，另做一轮按读者任务的浏览器阅读，分开于初稿写作：从 F00 能否运行和排错，经 F01 是否能解释字符串相加，再到 F02 是否能修改上下界。发现 F00 未解释进入目录，已补 pwd/ls/cd 与路径操作；F02 给出可独立复制的完整代码，避免为了执行例子先学跨文件 import/export。复核由同一执行者在独立阅读步骤完成，不宣称外部专家或真实初学者评审。

2026-09-11 通过 web 工具实际打开 Node 官方运行/下载页、MDN Grammar and types、Functions、Number.isInteger、Strict equality、Number、Control flow and error handling；原文链接放在相关段落。自己的合成例子与迁移答案实测，不搬运教材。Windows 安装 UI、所有 Node 版本、真实后端/数据库为 NOT_RUN 或本批范围之外；正文明确边界。

## G7 实际浏览器验收

审批后启动隔离产物的 loopback 随机端口预览，映射 `/knowledge-base/`，不占用用户既有服务。Chrome 浏览器通过 CUA/DOM 读取、真实截图和交互验收；没有伪造截图或只读静态 HTML 就称视觉通过。

| 页面 | 390×844               | 1440×1000              | 实际结果                                       |
| ---- | --------------------- | ---------------------- | ---------------------------------------------- |
| F00  | PASS，scrollWidth=390 | PASS，scrollWidth=1440 | 标题、无先修、核验信息、6 个带语言标签的代码块 |
| F01  | PASS，scrollWidth=390 | PASS，scrollWidth=1440 | 先修链接、类型解释、6 个代码块，段落可读       |
| F02  | PASS，scrollWidth=390 | PASS，scrollWidth=1440 | 先修、规则与边界、5 个代码块，整页无横向溢出   |

- 顺着正文 F00 → F01 → F02，并从 F02/F00 返回路线，URL 保持 `/knowledge-base/`。
- F01 点击 Copy source，读取本轮复制结果为两行原始 JS，没有行号或语言标签；按钮显示成功勾选。第一次立即读取剪贴板为空，随后以成功反馈和实际文本确认，未把第一次尝试当成功。
- 窄屏中文“变量/浮点”能检索 F01，英文 `Number.isInteger` 能检索 F02；在搜索结果上按 Enter 打开文章，焦点回到搜索按钮并可见。未声称完成所有键盘快捷键审计。
- F02 长 shell 行只在代码内部产生滚动（code clientWidth=356，scrollWidth=369），整页仍为 390；语言标签 js/sh/text 可见。
- F00 窄屏深色与浅色均查看，测试后恢复浅色；表格和全文段落可继续纵向阅读。视口 override 已 reset，本轮标签已关闭，loopback 预览进程已停止。

截图由工具回传逐张检查，未将整页巨大图片入库；以上尺寸/宽度和交互结果记录为可复现人工验收。重做：在隔离目录构建，用本地静态服务把 public 挂载到 /knowledge-base/，浏览上述路径，在两尺寸下执行同样读者任务。

## 修复、限制与后续风险

旧 `shortest` 模式对三篇新增普通相对链接生成 5 个错误目标，真实构建输出检查也同样失败。改为 `relative` 后源码与产物检查均通过；新失败用例保留旧模式错误作为回归证据。只改配置，不改 Quartz 链接处理源码。

`note-properties.hidePropertiesView=true` 隐藏重复英文属性表；正文顶部用中文显示难度、先修、目标与核验。代码语言和中文搜索摘要三行限制使用 Quartz 专设 custom.scss 扩展点，配置没有语言标签选项，所以增加 20 行局部样式；未改上游组件。

搜索摘要仍有 `&quot;` / `&gt;` 实体显示，且中文命中附近的截取不够精确；标题检索、结果打开可用，手机长摘要占屏已修复。该呈现问题保留到 H4-001 的搜索/阅读校准，不声称搜索质量全面完成。真实移动设备/其他浏览器未测，本轮是 Chrome 的实际窄屏视口。

H0 的 Excalidraw 缺包警告、字体网络依赖、全仓历史格式差异仍然保留；详见 H0 报告。H1 对 wiki/block/HTML/附件等不支持语法明确拒绝，H4 扩展前不放宽。源代码链接提供既有仓库和明确路径；本批提交未推送，所以新增文件尚未出现在远端。

## Git、结论与恢复

H2-001、H2-002、H2-GATE 可标 done。平台修复与正文/示例分开本地提交；用户最初未跟踪 AGENTS.md 与交接资料不混入实现提交。BACKLOG/STATE 依授权更新，但仍保持这些用户交接文件原有未跟踪边界。

部署 not_requested，未 push、PR、tag 或更改远端权限。下一项 `H3-001`，从 F03 对象/数组与 F04 模块/错误传递开始，先写小批执行计划，每批最多 1–3 篇；继续已有 examples 和门禁，不重复初始化或重写 F00–F02。所有工作在本会话本地完成，不承诺离线继续执行。
