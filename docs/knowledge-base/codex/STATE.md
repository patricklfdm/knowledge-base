# 当前检查点

2026-09-13，patricklfdm/knowledge-base v5，基线7b22d9471ed3a1de0bf987f90e292df591fad9fd已发布。当前H5-001C双连接/读快照两篇及维护例子通过适用门禁，待本批提交普通push和同SHA跟踪；BACKLOG为唯一台账。

## 授权与下一项

内容优先，浏览器在规划内容完成后集中验收；当前不连接/安装/截图/重试浏览器。每批1–3篇、真实先修/来源/例子/CI/禁发规则保持；适用验证后自动普通push origin/v5，无需逐批询问，不授权PR/tag/强推/其他项目/生产数据。

当前报告[双连接与快照](../../../reports/H5-sql-connections.md)，计划[H5-001C](plans/H5-001C-sql-connections.md)。完成发布记录后继续H5-001D Java编译运行入门，不受UI延期阻塞。只读盘点确认本机Microsoft OpenJDK21.0.12+8可用（另有22默认），使用命令级明确路径，不改全局配置；内容和CI需随后实际实现，不能把运行时存在当完成。

## 验证与恢复

Node24.21.0/npm11.19.0，SQLite3.53.4/macOS arm64；受控同步会话干净安装隔离副本，kb:verify/npm test通过：33 notes=8导航+25教材、34检查器、276 tests/45 suites、58 HTML/167产物、禁发负面PASS。sql-trips25组，独立含空格npm ci/test/connections通过；固定旧100检出3项失败后恢复，原锁不变。

无sleep/线程压测/服务监听；两真实连接同步交错观察5与517，数据库/日志只在自建目录并清理。G7/真实DOM、生产吞吐、断电/磁盘/备份未测；H4/v1.0与H5父项未完成，历史UI/环境/上游格式问题保留。

日志/tmp/h5c-verify.log、/tmp/h5c-tests.log、/tmp/kb-h5c-mutant.log；指针/tmp/kb-h5c-example-path.txt与/tmp/kb-h3b-path.txt。失效按锁与源码重建。恢复先核对Git/Actions，避免重复推送；不承诺回合结束后离线运行。
