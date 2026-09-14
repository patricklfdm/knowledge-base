# H7-M003：现有依赖 PR 分诊

日期2026-09-14；基线23190172945fc7af462e1bdef66cbddb2e1a7e47；目标patricklfdm/knowledge-base既有origin/v5，开始时工作区干净。[执行计划](../docs/knowledge-base/codex/plans/H7-M003-dependencies.md)。本轮落实只读分诊与两个隔离失败复现，未采用任何依赖更新，未merge/评论/关闭PR。以下“优先验证”是后续候选，不是兼容性PASS。

## 实际 PR 与差异

| PR | 本次快照 | 实际范围与结论 |
| --- | --- | --- |
| [#2](https://github.com/patricklfdm/knowledge-base/pull/2) | open；head `4e7c5d08fb23fdcca2ba7aa915bb8262c6cbf0cc`，base `b5cec10abc61a259305695b241e46e5fe84687bb` | 仅根package.json/package-lock.json，13直接更新；不整体采用，TypeScript有已复现阻断。 |
| [#3](https://github.com/patricklfdm/knowledge-base/pull/3) | closed且未合并；head `38205cd74f897094aff084d00fe07b478b33bbf3` | 6种Action/6个工作流；2026-09-14 20:26 UTC关闭并删head ref。机器人说明可由其他方式更新；不是本轮关闭。保留历史参考，不再把它当开放待合并项。 |
| [#4](https://github.com/patricklfdm/knowledge-base/pull/4) | open；head `f52def5f895f9e83e48f43796b879bcfed5ecf63`，base `bb3d054fbbaef0d0f7a4b7886ab7d744b8ee86a7` | 当前替代分组7种Action/6个工作流，比#3增加setup-python v7并覆盖新补丁job；纳入同一分诊任务，不自动merge。 |

API只读核对PR详情、文件列表、检查与#3事件/评论。按固定#2 head获取完整锁文件，与当前锁逐条比较：非根package条目119处差异（22新增、28删除、69其余变化），包含TypeScript原生平台包、tsx内嵌esbuild合并与undici-types；不把“13个包”误作只改13条锁记录。此比较只计条目变化，不是安全/兼容认证。固定PR锁SHA256为83ef53cfca77a61218ecc931518ab48831a1a9b8129416ad7e073cb5c00333c7；临时TS7安装锁SHA256为badc6ffa9a4757e439c1f3d4ec4722a8b6eae67d9359efa72a0d8b2a308be4ef。

#2 head的[检查34806450703](https://github.com/patricklfdm/knowledge-base/actions/runs/34806450703)verify失败于kb:verify步骤；公开annotation明确指出tsconfig.json第7行的node10选项已移除。#4 head的[检查34892905498](https://github.com/patricklfdm/knowledge-base/actions/runs/34892905498)补丁job成功，verify失败于kb:verify步骤；annotation只有退出1，不能据此声称已读到远端完整堆栈。两组上游用途job的skipped均不算PASS，PR检查也不等于Pages发布。

## npm 逐项决定

版本左侧来自当前根锁文件，不是package.json范围下限。所有候选的整组安装、全库新版本测试和新版本部署均NOT_RUN；只对下述TS7最小探针实际安装执行。

| 依赖：锁版本 → PR目标 | 原始资料、当前影响与采用决定 |
| --- | --- |
| @clack/prompts：0.11.0 → 1.8.0 | [官方变更记录](https://github.com/bombshell-dev/clack/blob/main/packages/prompts/CHANGELOG.md)说明1.0改为仅ESM，1.8增加异步校验等。本站CLI已经ESM，但intro/select/text/isCancel交互仍须独立终端取消/输入验证。暂缓，与构建工具迁移分批，不重跑真实项目初始化。 |
| @myriaddreamin/rehype-typst：0.6.0 → 0.7.0 | [v0.7.0](https://github.com/Myriad-Dreamin/typst.ts/releases/tag/v0.7.0)升级Typst引擎且移除部分renderer API；0.x次版本不能按稳定补丁处理。latex插件导入它且peer为^0.5.0，当前0.6已不在该peer范围。当前latex启用但renderEngine固定katex，未走Typst渲染；暂缓，若验证Typst须另用隔离配置及合成公式/字体用例，不宣称已复现破坏。 |
| @napi-rs/simple-git：0.1.22 → 1.1.0 | [1.0迁移指南](https://github.com/Brooooooklyn/simple-git/blob/v1.1.0/0.x-1.0-MIGRATION.md)明确广泛API变化，但本站日期插件调用getFileLatestModifiedDateAsync仍保留毫秒数返回；不沿用PR早期正文把它说成Date。[1.1](https://github.com/Brooooooklyn/simple-git/releases/tag/v1.1.0)新增创建信息。暂缓：插件peer ^0.1.19、原生平台包与无历史文件异常仍需固定Git夹具/macOS和Linux验证。 |
| globby：16.2.2 → 16.2.4 | [16.2.3](https://github.com/sindresorhus/globby/releases/tag/v16.2.3)/[16.2.4](https://github.com/sindresorhus/globby/releases/tag/v16.2.4)修复gitignore转义及ignore组合。优先纳入小补丁批：本仓库glob/ignore直接影响文件收集，须用禁发文件、反斜线规则、ignore组合和发布过滤负例验证。 |
| isomorphic-git：1.40.0 → 1.42.0 | [1.42.0](https://github.com/isomorphic-git/isomorphic-git/releases/tag/v1.42.0)包括AbortSignal及原型污染修复；[实际修复](https://github.com/isomorphic-git/isomorphic-git/commit/b3db111885230bac9a648e0a2312c65ca66f76eb)针对getRemoteInfo返回树的恶意ref/symref。本站gitLoader实际使用resolveRef/fetch/checkout，未搜到直接getRemoteInfo调用。优先单独验证H7-M004：合成输入回归及插件锁定安装/拉取路径；不据发行说明断言本站已被攻击或全部fetch路径受影响。 |
| minimatch：10.2.5 → 10.2.6 | [官方完整比较](https://github.com/isaacs/minimatch/compare/v10.2.5...v10.2.6)主要为测试/工具及brace-expansion范围调整，未见src修改。优先与globby小批验证：路径匹配和发布过滤，而非把UNC测试增强写成本站已修复漏洞。 |
| preact：10.29.7 → 10.29.8 | [10.29.8](https://github.com/preactjs/preact/releases/tag/10.29.8)优化flushSync和保留子树。可进入后续小批，须SSR输出/导航/搜索与窄屏阅读实测后采用；不从上游性能描述生成本站性能数字。 |
| pretty-bytes：7.1.1 → 7.1.3 | [7.1.2](https://github.com/sindresorhus/pretty-bytes/releases/tag/v7.1.2)/[7.1.3](https://github.com/sindresorhus/pretty-bytes/releases/tag/v7.1.3)修复单位边界舍入、非本地化小数显示。可进入后续小批，影响CLI字节日志，验证0/单位边界/小数；不等同站点正文改动。 |
| ws：8.21.1 → 8.21.3 | [8.21.2](https://github.com/websockets/ws/releases/tag/8.21.2)/[8.21.3](https://github.com/websockets/ws/releases/tag/8.21.3)含CITGM测试修正和压缩协商拒绝逻辑。可进入小批；本站用于serve热更新，须隔离loopback连接/关闭和相关失败路径。静态Pages不运行这个WebSocket服务。 |
| @types/node：25.9.5 → 26.5.1 | [精确npm元数据](https://registry.npmjs.org/@types%2fnode/26.5.1)显示TypeScript最低声明5.6、undici-types ~8.9.0；[原始定义包](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node)属26系列。暂缓盲升，本站运行时固定Node24，类型主版本应另审匹配；现有25也不能冒称已完全匹配24。类型安装不会升级Node。 |
| esbuild：0.27.2 → 0.28.2 | [0.28.0](https://github.com/evanw/esbuild/releases/tag/v0.28.0)将兜底二进制下载完整性校验作为破坏性发布，[0.28.2](https://github.com/evanw/esbuild/releases/tag/v0.28.2)修复CSS/TS压缩等。暂缓至工具链批，验证bootstrap、worker、Sass、资源压缩和新平台包；tsx内部esbuild去重也要审。 |
| tsx：4.23.1 → 4.23.13 | [4.23.13](https://github.com/privatenumber/tsx/releases/tag/v4.23.13)限制共享转换缓存内存。后续与esbuild工具链批验证全部tsx测试、插件加载、ESM解析；中间12补丁的逐条兼容性未实测，不单凭末版说明采用。 |
| typescript：5.9.3 → 7.0.2 | [官方7.0说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)明确移除node/node10解析选项并改变部分默认值；[7.0.2发布页](https://github.com/microsoft/typescript-go/releases/tag/typescript%2Fv7.0.2)。本机实际TS5108与远端annotation一致。暂缓，单独评估配置/导入解析迁移和Node类型，不能用跳过tsc或只改ignoreDeprecations放行。 |

当前.npmrc既有legacy-peer-deps=true；安装成功不证明插件peer兼容，本轮不扩大这一既定例外、不执行npm audit fix。同样没有把上游发行说明列出的修复全部套作本仓库漏洞；这不是全依赖安全审计。

## Action 逐项决定

以下当前→候选指工作流tag。PR #3/#4相同6项合并分析，setup-python是#4新增。

| Action | 原始资料、当前影响与采用决定 |
| --- | --- |
| checkout v6 → v7 | [v7说明](https://github.com/actions/checkout/releases/tag/v7.0.0)包含ESM和对特定特权事件检出fork PR的限制。本站quality使用pull_request/workflow_call，发布push v5；不新增绕过输入。后续独立CI批验证同SHA、完整Git历史和最小权限。 |
| setup-node v6 → v7 | [v7说明](https://github.com/actions/setup-node/releases/tag/v7.0.0)含ESM、缓存输出、移除dummy NODE_AUTH_TOKEN。本站普通npm ci/.nvmrc与缓存需新runner实测；不新增凭证、发布包或改Node24基线。与checkout列入CI批。 |
| cache v5 → v6 | [v6说明](https://github.com/actions/cache/releases/tag/v6.0.0)主要ESM及包更新。只在继承的上游工作流直接使用，本站quality/build通过setup-node缓存。暂缓，不能把fork上skipped当兼容验收，也不为了测它启用Cloudflare/Docker发布。 |
| github-slug-action 5.6.0 → 5.7.1 | [5.7.1说明](https://github.com/rlespinasse/github-slug-action/releases/tag/v5.7.1)修的是该Action自己的CI对Dependabot作者判断。本站仅继承Docker工作流引用，当前不运行。暂缓，无本站当前可验证收益；未完整验5.7.0中间变化。 |
| upload-pages-artifact v4 → v5 | [v5说明](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0)含upload-artifact v7与隐藏文件输入；其compare链接仍指旧范围，因此直接读取[tag action.yml](https://github.com/actions/upload-pages-artifact/blob/v5.0.0/action.yml)，确认include-hidden-files默认false、产物名仍github-pages。后续与deploy-pages配套验证打包内容、禁发标识、索引/404；不默认启用隐藏文件。 |
| deploy-pages v4 → v5 | [v5说明](https://github.com/actions/deploy-pages/releases/tag/v5.0.0)升级Action内部Node24；[tag action.yml](https://github.com/actions/deploy-pages/blob/v5.0.0/action.yml)确认node24、默认github-pages和page_url。后续仅改现有Pages两项，保留quality→build→deploy与pages/id-token最小权限，同SHA真实部署后才PASS。 |
| setup-python v6 → v7 | [v7说明](https://github.com/actions/setup-python/releases/tag/v7.0.0)含ESM、manifest重试与移除pip-install。本仓库没用该输入，但工作流合约测试精确查找@v6，已局部复现2失败；PR远端补丁job成功仅覆盖该job。暂缓，H7-M005修版本匹配合约时保留缺失runtime、浮动Python覆盖、跳过job、遗漏checksum等失败守卫。 |

## 实验、命令与证据边界

最小基础kb:check已实际通过98笔记/0错误。探针脚本/tmp/kb-m003-probe.py，临时根指针/tmp/kb-m003-probe-root.txt；Node24.21.0，macOS arm64。固定PR文件只读下载；npm元数据读取，无全局安装。

1. 将#4固定head的knowledge-base-checks.yml暂放既有自建隔离副本，执行node --test tests/knowledge-base/workflow.test.mjs，退出1，2个测试失败：pythonIndex未找到、补丁job的python-version-file读取为undefined。日志/tmp/m003-pr4-local.log。finally逐字恢复原工作流，再运行同测试退出0（/tmp/m003-pr4-restored.log）。没有改工作区工作流/测试，也没有通过删断言伪造候选PASS。这是本地明确原因；远端完整日志未获得，不虚构远端逐行对应。
2. 在独立ts7目录用只含typescript:7.0.2的package.json执行npm install --cache <owned>/npm-cache --no-audit --no-fund，成功并产生该临时项目锁；用其node_modules/.bin/tsc --noEmit --project <baseline-isolation>/tsconfig.json运行，实际退出1/TS5108。日志/tmp/m003-ts7-install.log、/tmp/m003-ts7-check.log。只证明当前配置拒绝，未尝试迁移解析方式，也未安装整个#2依赖组。
3. GitHub连接器不支持check-run annotations端点；本机gh不存在。改用公开HTTP API成功取得annotation（/tmp/m003-pr2-annotations.json、/tmp/m003-pr4-annotations.json），不读取凭证或修改权限。带斜线的两个release API未取得正文，改用官方网页/原始CHANGELOG，不把失败请求记成功。

完整本轮门禁已执行：原依赖隔离副本运行npm run kb:verify与npm test均退出0（/tmp/m003-verify.log、/tmp/m003-tests.log）。49检查器测试、398 Node测试/45 suites通过；98笔记/0错误，review 0候选/251外链/5观测，正式构建133HTML/318产物，公开控制存在、3个禁发marker均排除且故意泄漏可检出。逐字比较受控源码、全部锁及82篇verified_on无漂移。当前没有依赖变化，可复用已干净安装且锁未改的隔离环境。浏览器NOT_APPLICABLE：本轮只改工程记录；新依赖UI/新Action部署仍NOT_RUN，不借旧站UI证据验收候选。

## 后续与交接

H7-M004先单独验证isomorphic-git修复及globby/minimatch等小补丁，按1–3依赖/批，不夹带TypeScript或原生API迁移；H7-M005处理新版Action合约与本站CI/Pages分批升级；H7-M006另审TypeScript/Node类型、esbuild/tsx与原生插件迁移。其余低优先级候选留在本表对应验收边界；不自动重开/merge #3或merge #2/#4。

本轮仅报告、计划、BACKLOG/STATE与维护入口；正文、82篇verified_on、示例和所有锁应无变化。H7-M003分诊本地验收完成，发布pending，仍需本轮自身SHA检查/部署与HTTP；自动普通push授权持续。临时TS7和下载快照保留复验，无常驻服务，原工作流已恢复；未来恢复先核对PR最新head，不假定本次快照永久有效。
