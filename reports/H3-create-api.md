# H3-002A：创建接口与输入边界验收

日期：2026-09-11 America/Los_Angeles。基线83d2aacf292d27b461b17f5dfed94eee6c8416c5，接手时v5、origin/v5同SHA、工作区干净；只操作patricklfdm/knowledge-base。

## 交付范围

新增content/topics/05-backend/create-trip-api.md（F09A）与request-validation-boundaries.md（F09B），承接F08。读者运行POST创建、按201/Location读取，再逐层区分媒体类型、正文大小、UTF-8/JSON语法和业务错误，并通过列表证明拒绝后未写入。首页、路线、F08下一篇和课程表同步；共7篇导航、13篇教材。

独立examples/trip-api无npm依赖，只使用Node内置HTTP与内存数组；包含server/input/demo/failure和10组测试，随机本机端口，所有入口自动清理。根kb:examples及其契约测试登记第五个包，CI扩展manifest/lock漂移范围，原门禁保留。没有框架、主题、站点表现层、部署地址或旧锁变更；教学API没有部署到Pages，也没有页面整合或数据库。

用户持续授权每轮完成适用门禁后自动普通push origin/v5；不创建PR/tag或强推。G7/H4-UI-SITE与应用真实交互/H4-UI-APP均NOT_RUN：用户批准移至集中验收阶段，本批未调用浏览器。

## 实测结果

Node24.21.0/npm11.19.0/macOS arm64；既有TypeScript5.9.3不变。复用本会话已经干净安装依赖及插件的隔离副本，受控同步全部源码后运行；本批无依赖变化。新增包另复制到含空格路径，独立npm ci/test/demo通过。以下结果由实际命令取得，不用时长充当性能结论。

| 检查 | 结果 |
| --- | --- |
| G0身份/范围 | PASS：根、分支、HEAD、origin及原工作区核对；变更范围复核 |
| G1/G2元数据/链接/先修 | PASS：20 notes、0 errors；路线AST表头+13篇教材 |
| G3发布范围 | PASS：公开对照存在，3种禁发marker在全部产物缺失，故意注入泄漏被检测 |
| G4检查器 | PASS：34 tests，包含元数据/链接/发布/工作流故意失败反例 |
| G5示例 | PASS：foundations13、typed-trips4、web-forms5、http-trips8、trip-api10组 |
| G6类型与产物 | PASS：tsc、Quartz构建、40 HTML/131产物、0错误 |
| 总回归 | PASS：238 tests/45 suites，0 fail/skip |
| 独立包 | PASS：含空格路径npm ci、npm test、npm run demo；无根依赖，锁不漂移 |
| 教材练习 | PASS：重复相同POST生成t1/t2、列表2；上限改14后，14→201，15和字符串14→422、列表1 |
| 检出校验退化 | PASS：副本把天数上限放宽到300，npm test退出1、2组失败；故意修改已恢复并与正式源逐字节匹配 |
| G7/应用UI | NOT_RUN：用户批准集中验收；无浏览器连接或交互测试 |
| G8发布 | 待本批提交后跟踪同SHA CI/Pages及HTTP文本冒烟 |

整批命令为 `npm run kb:verify` 和 `npm test`，均退出0。日志为/tmp/h3e-verify.log、/tmp/h3e-tests.log，故意失败实验/tmp/kb-api-mutant.log；副本指针/tmp/kb-h3b-path.txt与/tmp/kb-api-path.txt。临时路径失效时按仓库README和锁重建；报告及维护的测试是可读验收依据。最终教材、代码、命令、CI与验证副本逐字节匹配。

实际HTTP断言包括201/Location/Content-Type、按ID和列表读取、丢弃客户端id与未知字段；目的地trim及1–80 UTF-16代码单元、days数字整数1–30；非法对象/字段/范围422，空正文/坏JSON/坏UTF-8为400；缺失或不支持的媒体/编码415；实际1024字节通过、1025拒绝413，无Content-Length的分块传输亦不能绕过；中文多字节超限、中文编码与数字分多次write后正确还原；404、405及Allow；失败无新增记录/不消耗编号；重复POST产生两条、新实例为空。独立failure故意HTTP422退出1，demo退出0，服务均关闭。

## 教材与来源复核

作者自审后，另一次按读者任务“从F08进入→复制独立包→运行demo→解释201和Location→追踪校验在写入之前→预测字节和业务边界→修改14天契约”重读。两次均为同一作者，不冒称第二人或专家背书。对照代码核实send/inputError为本地函数、fields展开内容、编号作用域、JSON与业务校验的差别；运行数据支撑reviewed和verified_on，未把阅读验证写成用户已掌握。

正文结论旁保留MDN的POST、201、413、415、422、Fetch请求正文、TextDecoder和String.length，以及Node官方HTTP、流异步迭代和Buffer字节长度链接，本轮/本会话文本核对。Node英文HTTP教学指南地址返回404时没有引用该页，采用已可读取的官方HTTP API文档。正则仅实现明确媒体头格式，UTF-16长度不是人眼字符数，多次write不保证网络块边界一一对应，均有说明。

业务练习在隔离副本实际修改上限与错误文案，用HTTP断言验证14/15/字符串14及列表1；之后恢复。另将上限故意改300时，非法31错误状态和failure非零退出两组断言失败，证明测试能检出越界放行。没有把故意失败计作产品测试通过。

## 限制与后续

本例在超限后丢弃正文内容，等待正文结束再响应413；只限制保留的正文块，不声称总内存、无限上传或慢速上传防护。没有接收速率/应用超时加固、认证/CORS、幂等键、数据库/生产环境验收。500未知异常兜底已有实现，故障注入验收NOT_RUN；没有完整日志和监控。已有字体网络、未用Excalidraw和上游全仓格式问题保留；隔离副本无.git会提示内容Git时间不可用，正式CI完整检出另行验证，不伪称全仓npm check通过。

H3-002A内容和非浏览器门禁完成；H3-002父阶段仍in_progress，API/SQL/持久化闭环和H3-GATE未完成。下一项H3-002B/F10：合成数据的SQL表、参数化查询、约束与重开文件后的持久化证据，再继续后续整合；不连接用户或其他项目数据库。

锁SHA256：

- root：6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0
- foundations：e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2
- typed-trips：9de2403f74c3dcea248fdf050f39614efcf646254b4cf22a6ec2b39960eb7bab
- web-forms：31f89e525205d5f4bab1a7a43d45ed15b6123cd09a48ec580bc34c6e07ddebf4
- http-trips：2e02ada5035600acce5c2b35d885f35c7156de1d860c7e511cedde9e2ccef876
- trip-api（新增）：2bdb0f3a72aeedb81e9a69b863d64e41442e1e67244fbd91cbb860f4c911e3fe

## 发布实证

待提交与普通推送后记录；不能把本地门禁PASS称为已部署。
