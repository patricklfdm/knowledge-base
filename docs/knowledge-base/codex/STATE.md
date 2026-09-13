# 当前检查点

2026-09-13，patricklfdm/knowledge-base v5，基线ae13eb6a477af98ed350d1b1c519b73acb4eeb99为已部署SQL双连接批次。当前H5-001D Java编译运行正文、路线、独立例子与CI环境已完成本地适用门禁，待提交普通push和同SHA发布跟踪。BACKLOG是唯一台账。

## 授权与下一项

内容优先；规划H5–H7内容完成后集中浏览器验收，当前不连接/安装/截图/重试浏览器。每批适用验证后自动普通push origin/v5，无需逐批询问，不授权PR/tag/强推/其他项目/生产数据。

当前[Java报告](../../../reports/H5-java-compile.md)、[H5-001D计划](plans/H5-001D-java-compile.md)；补齐发布证据后继续H5-001E Java值、类型与输入校验，不受H4 UI延期阻塞。H5父项仍需语言与系统内容，不能把一个Java入门视为全路线完成。

## 验证与恢复

Node24.21.0/npm11.19.0、Microsoft OpenJDK21.0.12+8/macOS arm64；本机同时有默认22，必须命令级KB_JAVA_HOME指向实际21.0.12安装，不改全局设置。CI由setup-java@v6读取examples/java-basics/.java-version并安装microsoft发行版。

隔离kb:verify/npm test通过：35 notes=9导航+26教材、34检查器、282 tests/45 suites、61 HTML/173产物、禁发负面PASS。Java独立npm ci/test/demo及手工命令通过；days4故障4项失败后恢复，原锁未变。所有编译和数据库产物只在自建临时目录清理；未启动浏览器。

日志/tmp/h5d-verify.log、/tmp/h5d-tests.log、/tmp/kb-h5d-mutant.log；指针/tmp/kb-h5d-example-path.txt和/tmp/kb-h3b-path.txt，失效按锁/源码重建。恢复先核对Git/Actions避免重复推送。H4/v1.0未通过，历史UI/环境/上游格式问题保留；不承诺结束回合后离线运行。
