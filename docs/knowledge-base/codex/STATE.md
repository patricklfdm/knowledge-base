# 当前检查点

2026-09-13，patricklfdm/knowledge-base v5。H5-001C SQL双连接两篇、H5-001D Java编译运行一篇均已发布。最近内容/运行时修复提交540ededb17733b9e8a372fceb0ea5bb5dab384f7，同SHA Actions34785541297必需quality/verify、Build、Deploy全部success；2026-09-13T22:03:43Z部署完成，HTTP正文/实际CSS与JS/索引/404通过。BACKLOG为唯一台账，本检查点补记不修改内容或可执行源。

## 授权与下一项

继续H5-001E：Java值、类型与输入校验，复用独立java-basics，每批1–3篇；下一步先写有界执行计划，再实现转换/业务边界与真实故障测试。当前[Java验收报告](../../../reports/H5-java-compile.md)、[已完成计划](plans/H5-001D-java-compile.md)。H5父项仍在建设，H4/v1.0尚未通过。

浏览器仍延至规划H5–H7内容完成后集中验收，当前不连接/安装/截图/重试。每批适用验证后自动普通push origin/v5并跟踪同SHA部署，不需再问；不授权PR/tag/强推/其他项目/生产数据。历史UI/环境/上游格式问题保留。

## 当前环境与恢复

Node24.21.0/npm11.19.0；Java示例固定Microsoft OpenJDK21.0.11+10，本机macOS arm64与远端Linux x64均实跑。初次21.0.12虽本机成功，但8c737ac的Actions34785309277无法从Microsoft发现目录取得，部署被正确阻止；失败与修复见报告，不能再次把版本改回21.0.12就假定CI可用。

本机原有21.0.12和默认22未改。使用命令级KB_JAVA_HOME指向官方SHA256校验后自建临时21.0.11目录，指针/tmp/kb-h5d-java-home.txt；失效按Java README与官方归档重新准备，不能跳过Java。CI用setup-java@v6读取examples/java-basics/.java-version。

适用门禁：35 notes=9导航+26教材，34检查器、283 tests/45 suites、61 HTML/173产物、禁发负面对照PASS；Java七组，独立npm ci/test/demo与days4故障检出4失败后恢复。原锁不变，新Java包无npm/Java库依赖；编译与数据库运行产物只在自建目录并清理。浏览器NOT_RUN。

日志/tmp/h5d-fix-verify.log、/tmp/h5d-fix-tests.log、/tmp/kb-h5d-fix-mutant.log、/tmp/h5d-http.log；独立副本指针/tmp/kb-h5d-example-path.txt，根隔离指针/tmp/kb-h3b-path.txt。恢复先核对Git与Actions，保护新修改；临时证据失效按维护入口重建。不承诺结束回合后离线运行。
