# H5-001C：双连接与读快照验收

2026-09-13，基线7b22d9471ed3a1de0bf987f90e292df591fad9fd，patricklfdm/knowledge-base v5，接手工作区干净。用户持续要求内容优先、浏览器完成内容后集中验收、适用验证后自动普通push。

## 交付与实证

新增S04 sqlite-writer-contention、S05 sqlite-read-snapshots两篇，SQL路线及S03下一篇链接更新。复用sql-trips新增connections模块/CLI/7组测试，原18组保留，包内25组；无新依赖/监听服务/浏览器。

两个连接打开同一个自建临时文件，显式DELETE或WAL、busy_timeout=0。固定同步交错，不使用sleep或时间竞争。实测A未提交150、B读100，第二写者BEGIN失败errcode5；A提交后B重读150再加25得到175，A回滚时B重读100得到125。DELETE下读事务阻止A提交，失败后A仍有待提交150，读事务结束后重试COMMIT成功。WAL下A提交后B仍见旧100，旧读事务写入失败517；结束旧事务、新写事务重读150后成功175。首次SELECT而非单纯BEGIN的时机，以及另一写者回滚不产生新已提交快照，也有实际对照。

Node24.21.0/npm11.19.0/macOS arm64，SQLite3.53.4。独立含空格副本npm ci/test/connections通过，锁不漂移。将重新读取故意替换固定100，三个测试失败、退出1；恢复后逐文件相同。预期错误助手只接受准确errcode，意外成功和不相关异常必须失败；夹具故意抛错后连接关闭/自建目录清理有断言。

会话已干净安装隔离副本受控同步，kb:verify/npm test通过：33 notes=8导航+25教材，34检查器，276 tests/45 suites，0 fail/skip；全示例、recovery夹具、tsc、构建、58 HTML/167产物、公开对照/3禁止marker及注入泄漏检出PASS。原锁文件无差异，已测试源码与提交源一致。日志/tmp/h5c-verify.log、/tmp/h5c-tests.log、/tmp/kb-h5c-mutant.log，独立指针/tmp/kb-h5c-example-path.txt，失效可按维护入口复现。

## 编辑与边界

核对SQLite事务、隔离、WAL、busy_timeout、结果码官方资料。Node文档访问有一次内部错误，本批没有依赖未读的新API说明：errcode5/517来自实际Node24.21.0错误对象并与SQLite码表核对。正文声明实测环境，不跨驱动承诺属性。作者自审后再按读者任务重读：先预测重读值、改变提交/回滚条件、区别COMMIT失败与旧快照，再对照日志模式。没有虚构独立专家。

特别保留BEGIN IMMEDIATE与DELETE提交受读者阻碍的真实反例；用事务文档的COMMIT忙错误规则及实测支持，不把概括性保证扩成所有模式均不会提交受阻。5与517可有相同message，不能靠英文locked一词选择重试范围；不实现通用无限重试。

所有数据库和日志只在自身临时目录；关闭两连接后统一清理，无用户数据访问。属于同进程两个真实连接的锁/快照实验，不是同时线程/跨进程吞吐测试。G7/真实DOM仍NOT_RUN：用户批准内容建设完成后集中验收；生产并发容量、断电/磁盘/备份/网络文件系统未验证。历史UI/环境/上游格式问题保留，H4和v1.0未完成。

## 发布与下一项

本批适用验收完成，按持续授权普通push并跟踪同SHA CI/Pages/HTTP。H5-001C完成，H5父项仍在建。下一项H5-001D：Java编译与运行的有限入门单元；只读运行时盘点确认本机Microsoft OpenJDK21.0.12+8可用，不安装或修改全局Java配置。后续仍需真实例子和门禁，不以“已安装JDK”冒称内容完成。
