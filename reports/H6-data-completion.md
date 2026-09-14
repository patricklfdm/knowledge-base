# H6-002 批流与数据质量综合验收

2026-09-13，patricklfdm/knowledge-base既有v5。按[连续两批计划](../docs/knowledge-base/codex/plans/H6-DATA-completion.md)完成Q00–Q05，用户本轮要求“下一项”；持续自动普通push，浏览器等H5–H7规划内容完成后集中验收。

## 读者成果

六篇依次覆盖事件契约/隔离、粒度与维度、清单与批次发布、事件时间/水位线、事务检查点/重放、完整补数与对账。入口[数据工程路线](../content/roadmaps/data-engineering-foundations.md)，维护例子[README](../examples/data-pipeline/README.md)。每篇包含真实先修、来源、可运行入口、失败与迁移练习；教学完成不是用户掌握记录。

两批各三篇：[A报告](H6-data-a.md)、[B报告](H6-data-b.md)。独立副本示例命令从README执行，不从正文抓取任意命令。第二遍按读者任务审阅，在代码与文本中澄清单源不可变输入、旧水位线判定、EOF未封口、源/策略绑定和替换补数；七官方来源均200。不冒充外部专家审阅。

## 验证

Node24.21.0/npm11.19.0、CPython3.13.0/macOS arm64；新Python内置SQLite实测3.47.1，不把CI发行物库版本当本机相同。新包33项Python unittest经一个Node桥进入根测试，既有Python基础29项另列。

真实exit41/42验证提交前后position=1/2，重开到5且在线总额700；重复、身份冲突、源/策略漂移、金额/计数对账、资源超限和空输入均有断言。reconcile得到窗口0差1件/300分，完整补数1000且重复内容一致。独立删除维度唯一、迟到守卫、回滚、身份冲突、源绑定五类故意错误均使原测试失败，逐一恢复通过；未知入口退出2。

全套隔离kb:verify/npm test通过：90 notes（14导航/76教学）、35检查器测试、377 Node测试/45 suites、123HTML/297产物。例子、回退演练、tsc、元数据/链接/资源/base path、公开正控制/三禁发marker/故意泄漏检出均PASS。新包在两个以上新建隔离目录及无pip venv实际验证安装/测试，锁与维护字节一致；根依赖未变化，复用已干净安装隔离根，不整体升级或重初始化。

浏览器与手机、真实broker/Beam/Flink/Spark、生产数据/吞吐、并发报表/多写者、断电和跨库exactly-once均NOT_RUN。单机模型与同库事务不外推为生产保证，数据上限与状态保留在正文和README明确，H4 UI/v1.0仍未完成。

## 发布与下一项

A提交68a103bf7511f38fcff935d70a4218ddf5b6bf10，Actions34808373187同SHA质量/Build/Pages成功，HTTP5入口/30资源/索引119/404通过。

发布回执：90bec42f2bca33266d16dc89d9c39233974cbfc8普通push；Actions34808837508同SHA quality / verify、Build website、Deploy website全success，完成时间2026-09-14T05:16:06Z/2026-09-14T05:16:40Z/2026-09-14T05:16:58Z；HTTP8入口/30资源200、索引122包含六篇、缺页404通过，日志/tmp/data-b-http.log。

本综合收尾只修改工程文档、执行计划/BACKLOG/STATE；随后普通push并核对最终实际HEAD自身同SHA部署与HTTP，不冒用正文SHA作为最后HEAD。H6-002A/B/GATE与父任务依据已获得证据关闭，H6两条有限主线完成，下一项H7-001搜索与AI应用工程；H7-002维护机制也尚待实施。没有声称离线持续执行。

## 恢复

先git status/HEAD/origin确认既有v5和目标，保护用户修改。临时日志/tmp/data-a-*.log、/tmp/data-b-*.log、/tmp/data-final-audit.json及-audit.log/-mutant-*.log/-restored.log；根指针/tmp/kb-h3b-path.txt，新例子/tmp/kb-data-final-example.txt。临时失效按README新建隔离目录与固定解释器重建，不碰真实数据或其他项目。完成文档push后从最终HEAD查询Actions并HTTP核验，再报告清洁Git状态和H7下一项。
