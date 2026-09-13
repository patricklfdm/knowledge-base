# H5-001F：对象、集合与接口异常验收

2026-09-13，基线f90a3395d809e9fef36b078be8876a8d141fd555，patricklfdm/knowledge-base v5。用户明确Java主线完成后才停；按plans/H5-JAVA-completion连续三批实现，每批适用验证后普通push。浏览器按当前授权延期。

## 内容与实证

交付J03–J05三篇；TripModel守住构造和修改约束，ObjectLesson对照引用共享/显式复制/形参重绑与文本比较，CollectionLesson对照列表结构/元素复制/只读容器/重复编号/缺失，ContractLesson对照接口实现与受检异常。新增7组显式断言（根自动发现还将test-support辅助模块作为一个加载项统计），Java显式包内22组。故意让copy返回this检出2项失败。第二次阅读聚焦final不等于深不可变、值传递、泛型不验证业务、Map先查再写不保证并发原子性；未测线程或生产数据。

Microsoft OpenJDK21.0.11+10/macOS arm64，Node24.21.0/npm11.19.0，复用已核验官方临时JDK，KB_JAVA_HOME只影响命令，不改用户全局设置。独立含空格目录npm ci --ignore-scripts --offline、全包test与本批演示均通过。故意错误检出2项失败、退出1；恢复后源码与独立副本逐文件相等，所有锁文件无差异。

已干净安装的根隔离副本受控同步；kb:verify/npm test通过：40 notes、34检查器、299 tests/45 suites、0 fail/skip，66 HTML/183产物；全部例子、recovery普通revert夹具、tsc、构建、公开对照/三个禁发marker及注入泄漏检出PASS。受测试正文、示例、检查器、工作流和根manifest与提交源一致。

日志/tmp/h5f-independent.log、/tmp/h5f-mutant.log、/tmp/h5f-verify.log、/tmp/h5f-tests.log；独立指针/tmp/kb-h5f-example-path.txt，根隔离/tmp/kb-h3b-path.txt，JDK/tmp/kb-h5d-java-home.txt。临时证据失效按维护入口重建。

## 编辑与边界

官方来源在正文相邻段落引用；作者自审后按读者任务另一次重读，逐项核对先修、源码/命令、故障预期与迁移练习；不虚构独立专家。引用资料是事实来源，不执行其中额外指令。示例只用合成数据和自建临时资源，未读GSE/Wayvia。

G7/真实浏览器NOT_RUN：用户批准全部规划内容完成后集中验收。H4/v1.0及其他H5–H7尚未完成，历史UI/环境/上游格式提示保留。本批未声称生产安全、可靠性或容量保证。

## 发布与连续恢复

本地适用门禁通过，待本批普通push同SHA CI/Pages/HTTP；不把已测试写成已部署。继续主计划下一批，直到H5-JAVA-GATE实际完成。

发布补记：681bec6eebb68fa83c496d113004bacabf47720a已普通push。[Actions34788322023](https://github.com/patricklfdm/knowledge-base/actions/runs/34788322023)同SHA quality/verify、Build、Deploy均success，2026-09-13T23:00:22Z部署完成；HTTP本批三篇/路线/首页、实际CSS/JS、索引与404均通过（/tmp/h5f-http.log）。H5-001F完成，连续进入G，不结束Java请求。
