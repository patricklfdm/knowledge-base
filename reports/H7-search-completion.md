# H7-001 搜索与AI应用工程综合验收

2026-09-13，patricklfdm/knowledge-base既有v5，基线9b15419ee50c1315e3f83f622d3f3e112b1466aa。按[连续计划](../docs/knowledge-base/codex/plans/H7-SEARCH-completion.md)完成两批各三篇R00–R05；自动普通push持续，浏览器等规划内容完成后集中验收。

## 交付与读者成果

[搜索与AI应用路线](../content/roadmaps/search-ai-foundations.md)覆盖规范化/倒排、BM25式排序、离线评估、检索上下文/引用、结构化输出/证据校验、受限工作流。完整例子[examples/search-lab](../examples/search-lab/README.md)无第三方依赖，只有合成语料与受控adapter，没有真实LLM或付费调用。Quartz站内搜索未替换，没有建设在线问答产品。

[A验收](H7-search-a.md)与[B验收](H7-search-b.md)记录每批先修、迁移练习、来源、正常/失败/边界、作者自审和另一次读者任务复核。六篇的reviewed不表示用户掌握或UI通过；未冒称独立专家。

## 真实验证

CPython3.13.0、Node24.21.0/npm11.19.0/macOS arm64。31项新Python unittest由1个Node桥进入根测试；既有Python29+33项另列。独立含空格目录与无pip venv，npm ci --offline/test、四个demo与直接run.py test通过；副本/维护源码字节相等，包锁前后一致。根依赖不变，受控复用已干净安装隔离根。

故意破坏Precision分母、quote相等、预算预扣、public过滤与规范化重复查询五类守卫，原断言全部检出，逐一恢复后通过。未知入口退出2，零测试保护保持；CI新包安装/manifest/lock/三个Python运行时一致性有负面夹具。

真实eval为3条有答案、1条无答案：两方法宏P@2=1/3、Recall@2=2/3、MRR@2=2/3，无答案1/1不返回；保留同义改写失败，不声称模型或生产搜索效果提升。上下文HTTP超时选15字符原句；伪造/旧上下文/工具字段被拒绝；transient→ok消耗2单位成功，额度不足或非法输出立即按协议停止。

全套隔离kb:verify/npm test通过：97 notes（15导航/82教学）、35检查器测试、378 Node/45 suites、132HTML/315产物；全部例子/回退演练/tsc/元数据/链接/资源/base path/公开正控制/禁发marker/注入泄漏检测PASS。既有锁无漂移，主题/平台/部署目标保持。

九个官方来源正文实际经web工具核对；独立逐URL直连8个200，JSON Schema object为403，失败保留，正文内容已有web读取证据。初次汇总因403中止后改为逐URL保留结果，不把403写成通过，不需要登录或权限绕过。

## 保证边界

基本汉字双字词元不是完整语言分词器；BM25式分数不是概率。抽取式引用仅证明来自所选片段，不证明原文真实/相关或自由生成答案正确。上下文字符不是完整请求token，预算单位不是费用/时间，同步adapter次数上限不是网络取消。没有工具执行器与真实模型，所以不称模型抗注入测试。浏览器、真实LLM/收费、线上流量、生产授权、向量检索、请求取消与性能均NOT_RUN，H4 UI/v1.0仍未完成。

## 发布与交接

A提交f28e94b94fa26eed7de52fbbad393e7fba189f48，Actions34810326492同SHA质量/Build/Pages成功，HTTP5入口/30资源/索引128/404通过。

发布回执：ff6d0c099a93ff1c99108c043466cb0badcda170普通push；Actions34810734369同SHA quality / verify、Build website、Deploy website全success，完成时间2026-09-14T05:47:19Z/2026-09-14T05:47:58Z/2026-09-14T05:48:11Z；HTTP8入口/30资源200、索引131含六篇、缺页404通过，日志/tmp/search-b-http.log。

综合收尾仅工程文档/计划/BACKLOG/STATE，再普通push后核对最终实际HEAD自身同SHA发布和HTTP；不把正文SHA冒充收尾HEAD。H7-001A/B/GATE与父项据现有验收关闭，下一项H7-002内容复核与维护机制，先修H4-001A完成；规划内容仍未全部结束，浏览器延期保持。

## 恢复

先核对Git/HEAD/origin与干净状态，保护用户修改，不重初始化或强推。固定解释器与Java命令级环境保持；日志/tmp/search-a-*.log、/tmp/search-b-*.log、/tmp/search-final-audit.json及-audit.log/-mutant-*.log/-restored.log。隔离根/tmp/kb-h3b-path.txt、新例子/tmp/kb-search-final-example.txt。临时失效按README重建；最后文档push后检查自身SHA三项Actions及HTTP，再交付。没有声称离线继续执行。
