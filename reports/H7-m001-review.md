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

不把“有新补丁”直接断言为已确认的应用漏洞；本轮没有进行完整CVE/依赖安全审计、安装新解释器/JDK或修改用户全局设置。运行时版本、锁文件、CI配置和源码均保持。

## JSON Schema历史异常复查

原2026-09-13直接403事实保留在旧观测/报告。本次用Python urllib、User-Agent `KnowledgeBase-maintenance/1.0`对[同一对象约束页](https://json-schema.org/understanding-json-schema/reference/object)独立GET一次，timeout25秒：**200**，最终URL相同，709836字节，包含additionalProperties。临时传输回执/tmp/kb-m001-source-http.json；没有登录、绕过或重复重试。

另外实际读取官方正文：additionalProperties控制未由properties/patternProperties匹配的字段，设false禁止额外字段；R04只声称精确字段集合的手写校验，明确没有实现完整标准。关联解释仍有依据，无需改R04或刷新其verified_on。新增带本次日期的独立观测，不把旧403改成200；本次可达也不是未来可达保证。

## 文案与读者任务复核

作者自审之后另作一次读者视角检查，非外部专家背书：F00读者能区分运行hello.mjs与运行全库门禁；P00读者能区分当前解释器、.python-version和3.13系列在线文档；J00读者能区分JDK安装、--release21和厂商补丁支持。正文的源码/输入/正常和失败预期没有修改，补充文字指向已核对官方页面。仅修正版本边界表述，不假造业务缺陷。

82篇verified_on均保持；本轮不是逐篇完整重新核验。tested_with保持真实旧运行环境，新版本未运行不得加入。路径、ID、先修不变，文章数仍为98（16导航/82教学）。

## 验证与发布

隔离`npm run kb:verify`与`npm test`均退出0：98笔记、46检查器测试、395 Node测试/45 suites、Python三包29/33/31项分别通过，构建133 HTML/318产物；公开过滤正例、三种禁发marker排除及注入泄漏检出通过。已有示例正常/边界/故意失败、真实临时Git回退与恢复均通过。本批不改检查器/代码，因此不新增镜像文案测试或重复故障注入。日志/tmp/m001-verify.log与/tmp/m001-tests.log；验证脚本/tmp/kb-m001-verify.py逐字比较受控源、确认锁无漂移与82篇核验日期不变。复用先前干净安装且锁未变的隔离根（/tmp/kb-h3b-path.txt），受控同步当前源码；不在用户项目安装新依赖。命令级Node24.21.0/npm11.19.0，KB_PYTHON=/opt/homebrew/bin/python3（CPython3.13.0），KB_JAVA_HOME由/tmp/kb-h5d-java-home.txt读取（Microsoft21.0.11+10）。

发布pending，尚未用旧SHA的部署替代本批验收。新版本、真实屏幕阅读器、其他浏览器/教学变体及生产操作NOT_RUN。恢复时先查Git/本计划与实际Actions，再核对自身SHA。

## 后续

H7-M002执行Python/Java补丁兼容性，H7-M003分诊现有Dependabot变更；状态只在BACKLOG。本批不添加后台定时器，不承诺会话结束后离线执行。持续普通push既有origin/v5授权不变。
