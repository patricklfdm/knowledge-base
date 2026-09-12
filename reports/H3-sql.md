# H3-002B：SQL与持久化基础验收

2026-09-11 America/Los_Angeles。基线e4b667066e06c29f309c02e2b38e230978bbed96，v5与origin/v5同SHA，工作区干净；范围仅patricklfdm/knowledge-base。

## 交付

新增F10A content/topics/06-data/sql-tables-and-persistence.md、F10B sql-parameters-and-constraints.md。讲解表/行/列、写入/筛选/排序、文件与新进程、绑定值与SQL结构、数据库约束、STRICT转换和旧表不自动迁移。首页、路线、F09下一篇及课程表更新，共7篇导航+15篇教材。

独立examples/sql-trips无npm依赖，Node内置SQLite；schema/store/read/demo/failure及8组测试。只写自建系统临时目录或内存库，自动关闭并清理；read入口以只读方式打开。根kb:examples和工作流契约登记第六包，CI扩展manifest/lock漂移检查，原必需门禁不变。无主题、框架、部署地址或旧锁修改。

## 证据

Node24.21.0/npm11.19.0/macOS arm64；实际SELECT sqlite_version()为3.53.4。复用本会话已干净安装的隔离副本，受控同步，最终源码/正文/CI逐字节匹配。新增包单独复制到含空格路径npm ci/test/demo，无根依赖，锁不漂移。

| 检查 | 实际结果 |
| --- | --- |
| G0身份/范围 | PASS：Git根/v5/HEAD/origin/初始工作区与提交差异复核 |
| G1/G2 | PASS：22 notes、0 errors；路线AST为表头+15篇教材 |
| G3公开范围 | PASS：公开对照存在，3种禁发marker缺失，故意注入泄漏被检出 |
| G4检查器 | PASS：34 tests，含坏字段/链接/发布/工作流依赖反例 |
| G5示例 | PASS：foundations13、typed-trips4、web-forms5、http-trips8、trip-api10、sql-trips8组 |
| G6类型/构建 | PASS：tsc、正式Quartz构建、44 HTML/139产物、0错误 |
| 总回归 | PASS：246 tests/45 suites，0 fail/skip |
| 独立复现 | PASS：含空格路径npm ci/test/demo，实际新进程读取；所有临时修改恢复 |
| 练习 | PASS：阈值4查询返回空数组、列表仍2；新表14通过/15拒绝、旧表执行新CREATE后15仍通过 |
| 故意失败检出 | PASS：副本CHECK上限改300，npm test退出1、4组失败；已恢复 |
| G7/应用浏览器 | NOT_RUN：用户批准移至集中验收阶段；无浏览器工具调用 |
| G8发布 | PASS：f7d0079同SHA CI/Pages和HTTP文本冒烟，见发布实证 |

整批npm run kb:verify、npm test均退出0；第二遍阅读修正UI延期与F11未实现的区分，并恢复package描述原Unicode形式（无语义变化），随后重跑kb:check/build/output/publish-test，全部通过。日志/tmp/h3f-verify.log、/tmp/h3f-tests.log、/tmp/h3f-final-content.log；故意失败/tmp/kb-sql-mutant.log。副本指针/tmp/kb-h3b-path.txt和/tmp/kb-sql-path.txt，失效时按README和锁重建，不把临时日志作为唯一长期证据。

8组维护测试覆盖：建表、1/30天、ID/列表/阈值查询和显式排序；空/NULL/越界/不可转换类型/小数拒绝且不增行；STRICT把字符串3转整数、空格和长目的地仍接受；O'Brien与SQL样式值原样保存，编号注入样式不扩大查询；直接SQL重复主键/CHECK失败及拼写错误；关闭重开、新Node进程只读、后续写入编号、独立内存库对照；新旧schema练习；demo退出0、failure预期退出1、缺失文件只读失败。测试时长不作为性能指标。

## 编辑与来源

作者自审后，另一次从F09进入按“运行demo→读schema→解释参数顺序→读取新进程结果→解释三种非法值→修改阈值/约束”的读者任务重读，均为同一作者，不宣称外部专家审阅。核对示意摘录不是独立入口、数字编号不同于F09、get缺失与all空数组、提交不同于close、STRICT不等于JS类型检查、IF NOT EXISTS不等于迁移。第二次修正了将页面/API未实现混入UI延期的文字。

已文本读取SQLite官方CREATE TABLE、STRICT Tables、SQL Expressions/parameters、SELECT、In-Memory Databases和Transaction，正文结论旁保留链接。Node latest-v24.x/sqlite页面在web工具读取失败，改读官方通用sqlite API文档，只使用已在24.21.0实跑的DatabaseSync/prepare/run/get/all/close/readOnly；未将当前文档其他新API视为Node24已支持。代码无外部来源整段复制。

## 范围与恢复

持久化证据仅覆盖正常提交、关闭、另一个进程打开同一文件。断电、磁盘故障、并发、备份恢复、生产迁移NOT_RUN。同步SQLite调用不代表高并发服务方案。教学数据库没有F09全部trim/长度/类型规则，公开API整合必须继续执行业务校验；原始SQL错误也尚未映射为HTTP契约。

H3-002B内容与非浏览器验收完成；H3-002父阶段仍in_progress，下一H3-002C/F11整合页面/API/数据库，补创建/查询/修改及重启证据。UI真实交互仍留H4-UI-APP；H3-GATE、v1.0未完成。当前没有访问用户/其他项目数据库，没有部署动态API。历史搜索/字体网络/未用Excalidraw/上游格式问题保留，隔离副本无.git的内容时间提示另计，未称全仓npm check通过。

锁SHA256：

- root：6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0
- foundations：e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2
- typed-trips：9de2403f74c3dcea248fdf050f39614efcf646254b4cf22a6ec2b39960eb7bab
- web-forms：31f89e525205d5f4bab1a7a43d45ed15b6123cd09a48ec580bc34c6e07ddebf4
- http-trips：2e02ada5035600acce5c2b35d885f35c7156de1d860c7e511cedde9e2ccef876
- trip-api：2bdb0f3a72aeedb81e9a69b863d64e41442e1e67244fbd91cbb860f4c911e3fe
- sql-trips新增：65b13782415b314d29980c59bb463f04904452abbf2cf388293992f2aca7b00d

## 发布实证

按用户持续授权普通快进推送origin/v5：e4b6670 → f7d00798403925eb38fd71cbb456f1f3a21fec4e。23个变更文件暂存范围已审阅，有限常见凭证模式无匹配；未提交实验数据库，不声称扫描覆盖所有秘密形式。没有PR/tag/强推。

[Publish Knowledge Base运行34677904313](https://github.com/patricklfdm/knowledge-base/actions/runs/34677904313) 的head_sha与内容提交一致，结果success。quality / verify任务103510970788、Build website任务103511052748、Deploy website任务103511106611均success，部署完成2026-09-12 06:22:41 UTC（本地2026-09-11 23:22:41 PDT）。继承的预览/Build and Test/Docker按原限定条件skipped，未算作质量检查通过。

发布后/tmp/kb-h3f-online-smoke.py退出0：主页含十五篇、路线含F10B、F09B指向F10、两篇SQL正文均200且含预期内容；从五页解析出的30个本站CSS/JS URL均200；contentIndex.json含F09B/F10A/F10B；不存在路径404。只验证文本、可达性与资源，不冒称搜索或浏览器交互已测。

本节与计划/STATE/BACKLOG为部署后补记，也按持续授权自动推送并跟踪最新SHA；不反复把文档自身SHA写回自身。恢复以实际Git HEAD、origin/v5和同SHA Actions为准。
