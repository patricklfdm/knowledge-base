# H5-001B：索引与查询计划验收

2026-09-13，基线39be2ef648cd5a765ad9e4f1d5393ee92e67f8f0，patricklfdm/knowledge-base v5。上一批两篇已推送，同SHA运行34779959819 CI/Pages及HTTP文本成功，已补记H5-sql-relations-transactions报告；本回合继续下一内容单元，没有恢复浏览器。

## 交付与验证

新增S03 indexes-and-query-plans一篇，SQL路线/S02下一篇/示例README/验证说明更新。31 notes=8导航+23教材。复用无依赖sql-trips新增index-plans/index-demo/三组测试，原测试保留，包内18组；既有kb:examples与root npm test自动覆盖，无工作流豁免或新增依赖。

Node24.21.0/npm11.19.0/macOS arm64，SQLite3.53.4。确定性100行程×20费用，在同一个自建内存库观察无索引、(journey_id,amount_cents)、反向列序、删实验索引四状态。参数42/1000时四状态完整有序结果均为id830–840、金额1000–2000，共11条。无索引/移除索引为SCAN和排序；正向复合索引为带两项条件的COVERING SEARCH、无独立TEMP B-TREE；反向为金额范围SEARCH及LAST TERM排序。仅为本版本数据/SQL观察，不是格式稳定承诺。

2000/2001/缺失行程参数分别1/0/0条，有无索引一致；建索引后插2500、更新原1000为50、删新增行，查询结果随实际数据正确变化。独立含空格副本npm ci/test/indexes通过，锁不变。故意把>=改>，三组索引测试全部失败、退出1，恢复后独立源码与工作区逐文件一致。没有从EQP推导耗时、扫描精确数量、吞吐或生产容量。

受控同步会话已干净安装隔离副本，kb:verify与npm test通过：31 notes、34检查器、269 tests/45 suites，0 fail/skip；所有示例、回退夹具、tsc、构建、56 HTML/163产物、公开对照与3禁发marker/注入泄漏检出PASS。源码核对一致，原锁文件无差异。日志/tmp/h5b-verify.log、/tmp/h5b-tests.log、/tmp/kb-h5b-mutant.log；独立副本指针/tmp/kb-h5b-example-path.txt，失效可从维护脚本重现。

## 编辑与范围

核对SQLite EQP、Query Planning、CREATE INDEX、rowid表官方文本，正文就近链接。作者自审与另一次读者任务重读：先预测11条及边界，再逐项对照四计划、反向索引与排序、覆盖字段条件。特地解释EQP中>?不代表原SQL丢失等号，读者不能反抄计划替换业务查询。保留每次查询显式ORDER BY，不能用索引顺序代替契约。未冒称独立专家或性能基准。

当前用户要求规划内容完成后集中浏览器：G7/真实DOM NOT_RUN，原H4/环境/搜索遗留未关闭；H5父项在建，Java/系统等不因SQL小单元完成而标done。实验仅内存、自建数据、受维护DDL；无监听或用户数据库。生产/并发/磁盘/吞吐均NOT_RUN。本篇只讨论单查询语义和访问计划。

## 发布与恢复

适用门禁已完成，按持续授权普通push origin/v5，跟踪同SHA CI/Pages/HTTP；本报告用基线加差异定位。下一项H5-001C有限双连接/写竞争内容，保留H5后续语言与系统范围，不重新开始浏览器调试。Git恢复先查本批Actions，避免重复提交；本轮结束不承诺离线运行。
