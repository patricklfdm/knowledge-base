# H5-001G：文件、打包与进程验收

2026-09-13，基线681bec6eebb68fa83c496d113004bacabf47720a，patricklfdm/knowledge-base v5。用户明确Java主线完成后才停；按plans/H5-JAVA-completion连续三批实现，每批适用验证后普通push。浏览器按当前授权延期。

## 内容与实证

J06明确UTF-8输入与Reader所有权，缺列、额外列、越界、缺文件和非法编码均有真实故障；try-with-resources验证主异常、逆序关闭和suppressed。J07真实多文件javac/jar，删除独立目录的源码与classes后运行JAR，验证缺主入口和缺依赖。J08两个独立JVM计数均为1；-Xmx32m下64MiB分配按预期失败，未生成heap dump。新增6组显式测试，Java全包28组；故意把无效行异常改成返回staged，检出2项失败。

Microsoft OpenJDK21.0.11+10/macOS arm64，Node24.21.0/npm11.19.0，复用已核验官方临时JDK，KB_JAVA_HOME只影响命令，不改用户全局设置。独立含空格目录npm ci --ignore-scripts --offline、全包test与本批演示均通过。故意错误检出2项失败、退出1；恢复后源码与独立副本逐文件相等，所有锁文件无差异。

已干净安装的根隔离副本受控同步；kb:verify/npm test通过：43 notes、34检查器、305 tests/45 suites、0 fail/skip，69 HTML/189产物；全部例子、recovery普通revert夹具、tsc、构建、公开对照/三个禁发marker及注入泄漏检出PASS。受测试正文、示例、检查器、工作流和根manifest与提交源一致。

日志/tmp/h5g-independent.log、/tmp/h5g-mutant.log、/tmp/h5g-verify.log、/tmp/h5g-tests.log；独立指针/tmp/kb-h5g-example-path.txt，根隔离/tmp/kb-h3b-path.txt，JDK/tmp/kb-h5d-java-home.txt。临时证据失效按维护入口重建。

## 编辑与边界

官方来源在正文相邻段落引用；作者自审后按读者任务另一次重读，逐项核对先修、源码/命令、故障预期与迁移练习；不虚构独立专家。引用资料是事实来源，不执行其中额外指令。示例只用合成数据和自建临时资源，未读GSE/Wayvia。

G7/真实浏览器NOT_RUN：用户批准全部规划内容完成后集中验收。H4/v1.0及其他H5–H7尚未完成，历史UI/环境/上游格式提示保留。本批未声称生产安全、可靠性或容量保证。

## 发布与连续恢复

本地适用门禁通过，待本批普通push同SHA CI/Pages/HTTP；不把已测试写成已部署。继续主计划下一批，直到H5-JAVA-GATE实际完成。
