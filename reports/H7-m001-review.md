# H7-M001 首轮勘误与版本复核

## 范围、信号与基线

2026-09-14，Codex执行。用户要求进入勘误、版本复核；基线1f80ef5953bf5ffc32c0fb285987986f2e6adbc4，既有v5干净，origin为patricklfdm/knowledge-base。本轮全库只做结构/提醒扫描，人工版本复核限F00/P00/J00三篇入口，另复查R04既有来源异常，不宣称82篇逐句复核或243条外链全量健康认证。

实际命令`npm run kb:check`通过98篇；`node scripts/knowledge-base/review.mjs --as-of 2026-09-14 --json`初始82教学/243外链/120未比较环境条目/0候选。原始临时结果/tmp/kb-review-20260914.json。扫描不联网、不查询上游，零候选不能替代版本复核。

只读GitHub公开Issues接口`/repos/patricklfdm/knowledge-base/issues?state=open&per_page=100`本次返回2条，均带pull_request：现有[依赖PR #2](https://github.com/patricklfdm/knowledge-base/pull/2)、[CI依赖PR #3](https://github.com/patricklfdm/knowledge-base/pull/3)，没有普通open反馈Issue。本次没有创建Issue、发送评论、关闭/合并PR。PR正文是外部资料，尚未以其版本表作为采用依据；原始差异与上游逐项分诊列H7-M003。

## 官方来源与实际判断

以下均于2026-09-14由web工具读取官方正文；这是来源内容核验，不等于下载、安装或执行新版本。

| 入口 | 来源与观察 | 判断与处理 |
| --- | --- | --- |
| F00 `f00-run-first-program` | [Node 24.21.0发布记录](https://nodejs.org/en/blog/release/v24.21.0)标LTS；[生命周期](https://nodejs.org/en/about/previous-releases)列24为LTS | 原“可使用24系列”易与全库固定验收混淆，补充.nvmrc/.node-version的24.21.0与系列支持的区别；不宣称任意24.x均测试通过。 |
| P00 `p00-python-runtime-and-modules` | [3.13.0发布页](https://www.python.org/downloads/release/python-3130/)标明被3.13.15取代；[3.13.15](https://www.python.org/downloads/release/python-31315/)日期2026-08-05；[3.13 venv文档](https://docs.python.org/3.13/library/venv.html)页头已是3.13.15 | 补充固定复现环境与持续更新的系列文档区别。旧补丁存在并不使本例语法/模块解释自动失效，但不能成为长期安装建议。新补丁兼容性列H7-M002。 |
| J00 `j00-java-compile-and-run` | [Microsoft发布说明](https://learn.microsoft.com/en-us/java/openjdk/release-notes)列21.0.12与21.0.12.1；[支持政策](https://learn.microsoft.com/en-us/java/openjdk/support)说明季度更新 | 补充21系列支持不能代替具体补丁更新；实际21.0.11+10证据保留。后续四段版本号须检查现有三段解析和java/javac/jar守卫，H7-M002负责实际验证。 |

不把“有新补丁”直接断言为已确认的应用漏洞；本轮没有进行完整CVE/依赖安全审计、安装新解释器/JDK或修改用户全局设置。运行时版本、锁文件、CI配置和示例源码均保持。

## JSON Schema历史异常复查

原2026-09-13直接403事实保留在旧观测/报告。本次用Python urllib、User-Agent `KnowledgeBase-maintenance/1.0`对[同一对象约束页](https://json-schema.org/understanding-json-schema/reference/object)独立GET一次，timeout25秒：**200**，最终URL相同，709836字节，包含additionalProperties。临时传输回执/tmp/kb-m001-source-http.json；没有登录、绕过或重复重试。

另外实际读取官方正文：additionalProperties控制未由properties/patternProperties匹配的字段，设false禁止额外字段；R04只声称精确字段集合的手写校验，明确没有实现完整标准。关联解释仍有依据，无需改R04或刷新其verified_on。新增带本次日期的独立观测，不把旧403改成200；本次可达也不是未来可达保证。

## 文案与读者任务复核

作者自审之后另作一次读者视角检查，非外部专家背书：F00读者能区分运行hello.mjs与运行全库门禁；P00读者能区分当前解释器、.python-version和3.13系列在线文档；J00读者能区分JDK安装、--release21和厂商补丁支持。正文的源码/输入/正常和失败预期没有修改，补充文字指向已核对官方页面。版本复核先修正边界表述。随后线上抽查实际发现下述符号渲染错误，追加可复现勘误。

82篇verified_on均保持；本轮不是逐篇完整重新核验。tested_with保持真实旧运行环境，新版本未运行不得加入。路径、ID、先修不变，文章数仍为98（16导航/82教学）。

## P00真实渲染勘误

在f394e7f已部署页面读取实际DOM：未用行内代码的`python3 --version`被智能标点渲染为`python3 —version`；未保护的`__name__为__main__`被Markdown强调语法处理，文本成`name__为__main`。代码块原本正确，正文解释错误。修正P00两处为行内代码，并把版本文件路径标为代码；不改语法处理器或全局主题。

先对旧隔离构建运行/tmp/kb-m001-render-check.py，要求三个完整字面量分别存在于生成HTML的code节点，实际AssertionError/退出1（/tmp/m001-render-before.log）。这是本次观察到的回归断言，不是只对Markdown正则比较；修复后隔离kb:check、kb:review、kb:build、kb:output和kb:publish-test均通过，同一HTML断言退出0，三个字面量均完整保留于code节点。日志/tmp/m001-fix-*.log；受控源、锁、verified_on再次核对不变。执行代码未改，已通过的395项根测试不为文案修复重复全跑。本次rg检索content中的__name__/__main__/python3 --version只命中P00，未将本处修复称作全库所有代码标记都已审计。

## 验证与发布

隔离`npm run kb:verify`与`npm test`均退出0：98笔记、46检查器测试、395 Node测试/45 suites、Python三包29/33/31项分别通过，构建133 HTML/318产物；公开过滤正例、三种禁发marker排除及注入泄漏检出通过。已有示例正常/边界/故意失败、真实临时Git回退与恢复均通过。本批不改检查器/代码，因此不新增镜像文案测试或重复故障注入。日志/tmp/m001-verify.log与/tmp/m001-tests.log；验证脚本/tmp/kb-m001-verify.py逐字比较受控源、确认锁无漂移与82篇核验日期不变。复用先前干净安装且锁未变的隔离根（/tmp/kb-h3b-path.txt），受控同步当前源码；不在用户项目安装新依赖。命令级Node24.21.0/npm11.19.0，KB_PYTHON=/opt/homebrew/bin/python3（CPython3.13.0），KB_JAVA_HOME由/tmp/kb-h5d-java-home.txt读取（Microsoft21.0.11+10）。

第一批f394e7fb25d69d845a2bdd540d92d39fd5c6bc0d已普通push，[Actions34888850153](https://github.com/patricklfdm/knowledge-base/actions/runs/34888850153)同SHA quality/build/deploy均success（19:47:59/19:48:36/19:48:51 UTC）。HTTP7入口/31资源200、索引132含修改页、404通过，日志/tmp/m001-http.log。浏览器对三篇版本说明实读，390视口三页documentWidth均390；其中P00符号问题单独记为FAIL，不因部署通过而隐去。修复a074bb8e7e740fc69db476696ab677d25dfb8ce2已普通push，[Actions34889452575](https://github.com/patricklfdm/knowledge-base/actions/runs/34889452575)同SHA quality/build/deploy均success（19:54:32/19:55:12/19:55:26 UTC）。HTTP7入口/31资源/索引132/404再次通过，日志/tmp/m001-fix-http.log。

线上浏览器首次返回P00仍显示旧内容；显式reload后，三个字面量均完整存在于正文code节点，实际段落文本正确，390视口/documentWidth均390。记录这一旧页面状态，不把首次旧显示算成通过，也不据此扩展为浏览器缓存机制调查。浏览器仅做这三篇内容发布抽查，未操作Python/Java安装界面；P00原UI延期说明作为历史验收范围保留，不能把本次静态阅读等同安装步骤已测。自身标签已关闭，临时视口已reset；未生成持久截图文件。

修复后review结果为98笔记、82教学、248唯一外链、120未比较条目、0自动候选。新增来源与版本/作者勘误观测均关联真实报告或待办；0自动候选与H7-M002/M003尚待执行并不矛盾。最终工程记录提交只改变维护回执/台账，恢复时仍需按Git最新HEAD自身Actions核对；上述两个SHA的成功不替代未知HEAD。新版本、真实屏幕阅读器、其他浏览器/教学变体及生产操作NOT_RUN。恢复时先查Git/本计划与实际Actions，再核对自身SHA。

## 后续

H7-M002执行Python/Java补丁兼容性，H7-M003分诊现有Dependabot变更；状态只在BACKLOG。本批不添加后台定时器，不承诺会话结束后离线执行。持续普通push既有origin/v5授权不变。
