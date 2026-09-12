# H3-003：测试、字段扩展与运行验收

2026-09-12，基线4ea13cde8291b7cf935b8cf201c4b12599bf7d70。延续同回合连续推进；F11已普通推送且同SHA CI/Pages与HTTP文本冒烟通过，补记并入本批。目标仍patricklfdm/knowledge-base v5。

## 交付与门禁

新增F12A test-boundaries、F12B add-note-migration、F13 run-and-smoke三篇；F11下一篇、首页/路线/课程更新，共7导航+20教材。trip-app新增可读备注覆盖模块/精确补丁构造器、迁移与演进测试、exercise和smoke命令；基础F11接口和demo不改。仅新临时运行副本，不在用户库迁移或部署公网API，无npm依赖变化。

Node24.21.0/npm11.19.0/macOS arm64，SQLite3.53.4。含空格路径独立npm ci/test/exercise、CLI成功冒烟和文件路径对照通过；全部锁不漂移。已干净安装隔离副本受控同步，最终源码逐字节匹配，kb:verify与npm test通过：27 notes、34检查器、13+4+5+8+10+8+13示例组、259 tests/45 suites，0 fail/skip；tsc、正式构建、52 HTML/155产物、0错误；公开对照与3禁发marker/注入泄漏检出PASS。路线AST表头+20教材。G0–G6适用项PASS。

新增3组维护测试覆盖：迁移旧行默认note、事务中断回滚版本/列/原行、重复迁移与不支持版本、数据库NOT NULL；生成页面/模块语法/静态资源、控制器→真实HTTP→SQL备注写入与修改，120/121及null/number拒绝无副作用，新服务器进程保留备注；smoke只读、错误服务即使200也拒绝、CLI退出1。没有真实DOM执行。

另外实跑迁移练习：临时同步页面/字段/API的上限为60，60通过，61前端与直接HTTP均拒绝，原备注仍60；恢复全部覆盖文件。原120版本实际跨进程读取通过，60小练习未另作新进程复验。运维练习：正常CLI smoke rows=1；另一个新数据库rows=0，原文件重开rows=1。故意把备注API上限放宽到1200，evolution测试失败、npm test退出1，恢复后源码匹配。

日志/tmp/h3h-verify.log、/tmp/h3h-tests.log、/tmp/kb-note-mutant.log；指针/tmp/kb-evolution-path.txt与/tmp/kb-h3b-path.txt。失效按README/维护测试/锁复现，不以临时文件为唯一证据。全部实验目录清理，未残留本轮监听服务。

## 编辑与来源

作者自审后，另一次按“选择断言边界→运行备注演示→检查旧行/版本→预测保存失败→执行只读冒烟→解释新文件为空”重读；同一作者，不冒称独立专家。保留状态码不等于业务结果、控制器不等于DOM、DEFAULT不是自动迁移、user_version只是应用标记、代码回退不回退数据库等边界。60练习与新文件对照在实跑后更新正文；无未执行结果冒充PASS。

文本核对Node test/assert、SQLite ALTER TABLE/PRAGMA/事务、GitHub Pages官方说明，正文就近链接。使用本版本实跑的API；不照搬当前文档的新版本功能。原课程规划名trip-ledger对齐实际trip-app，SQLite选择符合独立小例子范围，PostgreSQL服务式数据库内容仍留后续。

G7/真实DOM/键盘/浏览器端到端NOT_RUN：用户批准集中验收，引用H4-UI-SITE/H4-UI-APP。生成后的页面输入、填回、显示源码已连通；真实交互不冒充通过。生产迁移、备份恢复、零停机、断电/磁盘/公网服务NOT_RUN；同步SQLite和基础API限制不变。历史搜索、字体、Excalidraw与上游格式问题保留，不称全仓npm check通过。

## 状态与锁

H3-003内容与非浏览器验收完成。继续H3-GATE实际路线映射审计、H4发布/恢复/集中UI准备，不逐项停回合。v1.0仍未验收。

- package-lock.json：6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0
- examples/foundations/package-lock.json：e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2
- examples/http-trips/package-lock.json：2e02ada5035600acce5c2b35d885f35c7156de1d860c7e511cedde9e2ccef876
- examples/sql-trips/package-lock.json：65b13782415b314d29980c59bb463f04904452abbf2cf388293992f2aca7b00d
- examples/trip-api/package-lock.json：2bdb0f3a72aeedb81e9a69b863d64e41442e1e67244fbd91cbb860f4c911e3fe
- examples/trip-app/package-lock.json：5e1f5dffaa399e5d1d7f1501dced22ef164dce6af7559f838d2f6c4bad5f9042
- examples/typed-trips/package-lock.json：9de2403f74c3dcea248fdf050f39614efcf646254b4cf22a6ec2b39960eb7bab
- examples/web-forms/package-lock.json：31f89e525205d5f4bab1a7a43d45ed15b6123cd09a48ec580bc34c6e07ddebf4

## 发布实证

已普通推送7e76fca18cfde49422ec2a406aeafbc459cd4f5a（feat(content): teach regression migration and runtime checks）。[Publish Knowledge Base运行34681267525](https://github.com/patricklfdm/knowledge-base/actions/runs/34681267525)同SHA成功：quality 103520217813、build 103520300571、deploy 103520347677，部署完成2026-09-12T07:40:05Z。

部署后HTTP文本冒烟PASS：首页20篇入口、路线F12B、F11B下一篇、F12A/F12B/F13正文共6页与标记、页面实际30个CSS/JS、搜索索引四个相关页面、不存在路径404。脚本/tmp/kb-h3h-online-smoke.py；不是浏览器或应用UI验证。当前内容已发布，继续H4非浏览器准备。
