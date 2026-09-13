# H5-001H：线程、任务与测量验收

2026-09-13，基线43c91305afc6aed4b6705b45bd50bdb967c945e4，patricklfdm/knowledge-base v5。用户明确Java主线完成后才停；按plans/H5-JAVA-completion连续三批实现，每批适用验证后普通push。浏览器按当前授权延期。

## 内容与实证

J09用门闩固定两个真实线程都读零再写一；同一个Counter监视器保留2000次更新，验证中断与线程结束。J10实际验证Future正常结果/原始异常、get超时后未完成、cancel(true)、工作线程观察到中断及池终止。J11先断言空数组、混合符号和超int求和，拒绝错误校验值/零轮数，记录环境和5个交替顺序样本，不发布速度排名。新增6组，Java显式34组；独立副本把递增改成恒赋值1，检出2项失败。

Microsoft OpenJDK21.0.11+10/macOS arm64，Node24.21.0/npm11.19.0，复用已核验官方临时JDK，KB_JAVA_HOME只影响命令，不改用户全局设置。独立含空格目录npm ci --ignore-scripts --offline、全包test与本批演示均通过。故意错误检出2项失败、退出1；恢复后源码与独立副本逐文件相等，所有锁文件无差异。

已干净安装的根隔离副本受控同步；kb:verify/npm test通过：46 notes、34检查器、311 tests/45 suites、0 fail/skip，72 HTML/195产物；全部例子、recovery普通revert夹具、tsc、构建、公开对照/三个禁发marker及注入泄漏检出PASS。受测试正文、示例、检查器、工作流和根manifest与提交源一致。

日志/tmp/h5h-independent.log、/tmp/h5h-mutant.log、/tmp/h5h-verify.log、/tmp/h5h-tests.log；独立指针/tmp/kb-h5h-example-path.txt，根隔离/tmp/kb-h3b-path.txt，JDK/tmp/kb-h5d-java-home.txt。临时证据失效按维护入口重建。

## 编辑与边界

官方来源在正文相邻段落引用；作者自审后按读者任务另一次重读，逐项核对先修、源码/命令、故障预期与迁移练习；不虚构独立专家。引用资料是事实来源，不执行其中额外指令。示例只用合成数据和自建临时资源，未读GSE/Wayvia。

G7/真实浏览器NOT_RUN：用户批准全部规划内容完成后集中验收。H4/v1.0及其他H5–H7尚未完成，历史UI/环境/上游格式提示保留。本批未声称生产安全、可靠性或容量保证。

## 发布与连续恢复

本地适用门禁通过，待本批普通push同SHA CI/Pages/HTTP；不把已测试写成已部署。继续主计划下一批，直到H5-JAVA-GATE实际完成。

发布实证：7e20ab3ac512b071a6337f06a675214d4f0a3ca9已普通push origin/v5，Actions 34789387292同SHA quality/Build/Deploy全部success，分别完成于2026-09-13T23:21:58Z、23:22:33Z、23:22:44Z。HTTP主页、路线、12篇全部200，30项资源200，索引71项含完整Java路线，缺页404；日志/tmp/java-content-http-corrected.log。首次临时检查残留两个规划期slug导致404，按实际正文/产物修正后通过；没有把404写成部署成功。浏览器仍NOT_RUN。
