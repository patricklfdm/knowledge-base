# SQL／通用系统主线综合验收

2026-09-13（本地日期），patricklfdm/knowledge-base既有v5，起点a7c7189d64a2e51ff8c062210e29f425b89f2bb2。用户要求本轮完成整个剩余SQL／通用系统；按连续计划分三批新增S06–S08、Y01–Y06共9篇教学正文，并新增系统路线。SQL现为F10两篇基础加S01–S08，系统为Y01–Y06，复用已验收Java线程/内存/测量。

## 逐篇验收与阅读复核

以下14篇均reviewed/publish，真实先修存在且无环，有版本、来源、维护入口与迁移练习。作者自审后另一次按读者任务复核，不虚构独立专家；自动结构检查与人工语义阅读分别执行。

| 单元 | 维护例子真实证据 | 改变条件的读者任务 |
| --- | --- | --- |
| [S01](../content/topics/06-data/joins-and-null.md) | 外键/JOIN/NULL/COUNT、零费用行程与ON/WHERE | 把筛选门槛改200、错误COUNT星号 |
| [S02](../content/topics/06-data/transactions-and-rollback.md) | 无显式事务半写入、完整回滚、既有记录与重开 | 移动非法费用位置 |
| [S03](../content/topics/06-data/indexes-and-query-plans.md) | 四个真实查询计划、2000条数据、有序结果等价 | 改金额边界并区分计划与正确结果 |
| [S04](../content/topics/06-data/sqlite-writer-contention.md) | DELETE/WAL第二写者BUSY、提交/回滚后重读 | 禁止用旧100覆盖已提交150 |
| [S05](../content/topics/06-data/sqlite-read-snapshots.md) | 读锁阻止COMMIT、WAL旧快照517与事务重启 | 把第一次SELECT移至提交之后 |
| [S06](../content/topics/06-data/sql-query-pages.md) | CTE/窗口保留零费用、同值游标与OFFSET重复 | 改变页大小与排序字段，解释非快照边界 |
| [S07](../content/topics/06-data/sql-savepoints.md) | 整组局部撤销、RELEASE后仍可外层ROLLBACK | 改变失败位置和外层事务结果 |
| [S08](../content/topics/06-data/sqlite-backup-restore.md) | 活跃WAL主文件副本缺提交、backup与新进程恢复 | 结构ok还需外键/业务内容核对 |
| [Y01](../content/topics/02-foundations-tools/search-cost-model.md) | 有限数有序副本、lower bound边界和真实probe | 重复值最左位置、预处理与查询次数 |
| [Y02](../content/topics/02-foundations-tools/process-interfaces.md) | cwd/env/参数/标准流、退出/协议/超时分层 | 空cwd和合法JSON缺业务字段 |
| [Y03](../content/topics/02-foundations-tools/stream-boundaries.md) | 所有UTF-8两块切分、坏尾/超限/下游失败、drain | 改变字节切分和去掉最终flush |
| [Y04](../content/topics/02-foundations-tools/file-publication-boundaries.md) | 旧句柄/新路径、rename前后异常与子进程退出 | 推演两文件中途失败组合 |
| [Y05](../content/topics/02-foundations-tools/log-snapshot-replay.md) | 快照/完整日志/后缀重放、缺口/尾部/溢出拒绝 | 更改增量、裁剪顺序、末尾换行 |
| [Y06](../content/topics/02-foundations-tools/cache-invalidation-races.md) | 固定旧读交错、代次保护、LRU/错误/缺失/空值 | 改变A返回位置与更新失败顺序 |

总审阅补上S05至S06的下一篇链接，更新F10 README历史范围，明确重复日志在重放时才被拒绝，增加完整JSON缺末尾换行的反例。首页、知识地图、两条路线反映实际主线；不是用导航页凑文章数。

33个去重官方来源全部HTTP200，固定Node文档使用v24.21.0官方源码；浏览工具的版本HTML读取错误已用对应官方原文核对，不借用较新API。SQLite事务/隔离/查询规划/外键又作集中只读复核。来源事实及限制分别在正文就近引用；HTTP可达本身不替代语义复核。原始清单/tmp/h5-sql-systems-sources.json、路线审计/tmp/h5-sql-systems-audit.json。

## 独立重现与错误检测

固定Node24.21.0/npm11.19.0、SQLite实测3.53.4、macOS arm64；既有Java门禁命令级使用Microsoft21.0.11+10，不改默认运行时。两个无依赖例子在新建含空格目录分别npm ci --ignore-scripts --offline及npm test，SQL30组、系统16组全部PASS。8个演示入口全部实际执行：SQL demo/fail/ledger/indexes/connections/advanced，系统basics/storage；fail按预期CHECK约束错误退出1，其余退出0。12条安装/测试/演示命令日志/tmp/h5-sql-systems-entries.log；独立指针/tmp/kb-sql-systems-gate-path.txt。副本源码与所有锁逐文件相等。

分批独立故意错误：I删除局部ROLLBACK检出1失败；J错误缩小二分右界检出1失败；K取消快照衔接检出2失败，取消缓存代次比较另检出1失败。每次恢复原字节，K额外完整16组重跑PASS。缓存变体实际cached=old，正确实现cached=new，而oldCaller仍为old。所有故障只在自建副本，没有篡改用户数据。

详见[SQL补全](H5-i-acceptance.md)、[系统基础](H5-j-acceptance.md)、[文件日志缓存](H5-k-acceptance.md)。已有S01–S05报告为[关系与事务](H5-sql-relations-transactions.md)、[索引](H5-sql-indexes.md)、[连接](H5-sql-connections.md)，本轮完整重跑其维护入口。

## 全站门禁与发布

最终内容源码在已干净安装的根隔离环境通过kb:verify及npm test：56 notes（10导航/46教学），34检查器，332 tests/45 suites、0 fail/skip，83 HTML/217产物。包括元数据、先修/链接、正常与故障夹具、所有维护例子（Java34组保持）、recovery、tsc、正式构建、公开对照、3禁发marker与注入泄漏检测。/tmp/h5k-verify.log、/tmp/h5k-tests.log和批次报告可复核。根依赖不变，新增systems-basics无依赖包有初始lock；锁摘要/tmp/h5-sql-systems-locks.txt，整体SHA256=b73b9b15c69672173a08c1127d2cd3c155ae9599ac93bfe7723467b006c33b30。

I的ae0d123、J的0efd5e8均已普通推送并通过同SHA质量/构建/部署及HTTP，见分批报告。最终正文提交e74971521dde26f759d15eb0768fd96f2cfb0560，同SHA [Actions 34794777448](https://github.com/patricklfdm/knowledge-base/actions/runs/34794777448)全部success：

- quality / verify：2026-09-14T01:08:08Z
- Build website：2026-09-14T01:08:44Z
- Deploy website：2026-09-14T01:08:56Z

19个线上入口（首页、SQL/系统路线、14篇主线、2篇F10）均200，30项本地资源200，索引82项包含全部选定正文，缺页404。/tmp/h5-sql-systems-content-http.log与/tmp/h5k-actions.json。没有将旧SHA或单一部署状态替代当前质量检查。

## 完成边界与恢复

H5-001I/J/K及H5-SQL-SYSTEMS-GATE完成，结合既有[Java J00–J11验收](H5-java-completion.md)，H5-001父项完成；BACKLOG是唯一状态台账。当前范围为计划限定的基础到存储实验，未把PostgreSQL服务、多写者/分布式共识或生产灾备平台计作已实现。没有读取GSE/Wayvia、生产资源或个人学习记录。

G7浏览器NOT_RUN：用户要求H5–H7规划内容全部完成后统一验收；H4/UI、v1.0和Python/前后端/H6/H7未冒认完成。进程退出不是断电证据；日志没有校验和，不能检测所有合法格式损坏或末尾整条丢失；缓存不保证原调用读取最新值，容量只限制条目数。未发表性能排序或生产可靠性保证。

本报告、CURRICULUM、STATE、计划和台账收尾提交只记录验收，不改受测content、例子、依赖或工作流。其自身普通push后仍按实际HEAD核对Actions及相同19入口HTTP，最终会话回执给出实际提交；不为把本提交SHA写入自身而递归提交。下一项H5-002 Python数据基础与工程化，先按实际状态拆有限单元；不重复初始化，不声称回合结束后离线执行。
