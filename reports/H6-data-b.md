# H6-002B 事件时间、检查点与补数验收

2026-09-13，既有v5；基线68a103bf7511f38fcff935d70a4218ddf5b6bf10。Q03–Q05三篇与路线、stream/reconcile入口完成，补Q02下一篇链接。A已同SHA质量/Build/Pages和HTTP通过，回执见H6-data-a.md。持续自动普通push，浏览器后移。

## 交付与实证

单源有界不可变JSONL到达历史，W=max(W,maxminute-10)、窗口end<=旧W判迟到；无额外迟到宽限，EOF不强制封口。数据质量合法的晚到e3不进入在线汇总，700分与全批1000分差额定位到窗口0的1件/300分。计数对账能发现0分事件遗漏，多余输出组产生负差额。完整快照替换补数，重复运行内容相同、不修改在线检查点。

SQLite checkpoint/seen/totals每行共用事务。真实子进程第2行提交前exit41后position=1、提交后exit42后position=2，重开后均处理至position=5，不重复累加本地效果；错误注入回滚金额/水位线/偏移。源字节或策略改变拒绝旧检查点；不支持追加日志沿用旧检查点。资源超限保留已提交前缀、不清空去重状态。

仅本地同库效果，水位线为模型；不提供无限流、生产集群、多分区时间协议、跨库exactly-once或断电耐久。浏览器/真实broker/Beam/Flink/Spark/生产数据与性能均NOT_RUN。

## 适用门禁与复核

CPython3.13.0/SQLite3.47.1、Node24.21.0/npm11.19.0、macOS arm64。Python固定但CI发行物SQLite补丁可能不同，不声称跨环境同库版本。独立含空格目录、无pip venv、npm ci --offline、Node桥和直接Python test、batch/stream/reconcile全部通过；Python33项，Node桥仅1项，既有Python基础29项另列。

独立破坏维度键守卫、迟到比较、rollback→commit分别使原套件失败，恢复原字节后通过。另一个新隔离副本从读者入口重跑六篇、全部三demo及33项，删除身份冲突/源绑定守卫被检出，恢复PASS，未知入口退出2；源/副本字节一致、锁安装前后一致。七个官方来源HTTP200，元数据/先修/术语/命令输出/练习/强保证条件第二遍阅读检查，不冒称独立专家评审。

全套隔离根kb:verify/npm test通过：90 notes（14导航/76教学），35检查器测试，377 Node测试/45 suites，123HTML/297产物；全部维护例子/回退演练/tsc/资源与base path/发布正负marker和注入泄漏检测PASS。根依赖/主题/部署目标保持，既有锁无漂移。

日志/tmp/data-b-independent.log、-mutant-0/1/2.log、-restored.log、-verify.log、-tests.log；综合/tmp/data-final-audit.json、-audit.log、-mutant-0/1.log、-restored.log。新隔离例子/tmp/kb-data-b-example.txt、/tmp/kb-data-final-example.txt，隔离根/tmp/kb-h3b-path.txt。失效按README重建。

## 发布检查点

本地全套与综合复核完成，待普通push本批并记录同完整SHA质量/Build/Pages、8个HTTP入口/资源/索引/404。父任务与GATE仍进行中，不能将待发布写成已部署。完成回执后关闭H6-002，下一项H7-001。
