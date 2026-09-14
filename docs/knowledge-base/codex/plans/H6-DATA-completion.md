# H6-002 批流与数据质量连续完成计划

2026-09-13：既有v5，origin=patricklfdm/knowledge-base，HEAD 3ee8e205212bcf75aacd27e5316d05c63062380c，工作区干净；实际kb:check 83 notes/0 errors。H5-002/H6-001先修完成。自动普通push有效，浏览器仍等H5–H7内容完工。

## 目标、范围和当前事实

以合成行程事件贯穿质量隔离、分析汇总、批次发布、迟到、重放与补数，读者能解释结果差异和恢复边界。P08已有CSV内存汇总，本任务新增持久发布和消费检查点，不重复Python语言基础。不部署真实broker/云/付费服务，不改变Quartz和根依赖。

examples/data-pipeline使用CPython3.13.0标准库、实测内置SQLite3.47.1；Node24.21.0/npm11.19.0只作固定入口与CI桥。Python3.13在线文档目前显示更新补丁版，不能据此声称本机运行该版本。所有数据由仓库维护fixture或测试生成，只操作自有临时目录。

## 步骤与验证

- A：Q00事件契约与隔离、Q01汇总粒度与维度键、Q02完整批次发布。先实现正常/空输入/错误输入/冲突/失败发布测试，再写三篇和导航、CI登记。
- B：Q03事件时间与窗口、Q04同库检查点与进程重放、Q05补数对账与资源上限。真实子进程中断区别于断电；单源水位线为模型，不冒充Beam运行器。
- GATE：六篇第二遍读者任务复核、官方来源可访问、全部入口/独立故意错误、全套门禁、两批同SHA发布回执；关闭父项并指向H7-001。

新包在独立含空格路径npm ci --offline，Python venv --without-pip隔离运行；删除关键守卫应失败，再恢复原字节。根复用已干净安装/tmp/kb-h3b-path.txt受控同步，固定Java/Python环境，执行kb:verify与npm test，比较源文件/锁无漂移。CI安装、锁与版本一致性具有负面测试。

每批更新报告/BACKLOG/STATE再普通push origin/v5。跟踪完整40位SHA的quality / verify、Build website、Deploy website及HTTP入口/资源/索引/404。绝不把后续文档HEAD的发布状态归到前一SHA。

## Progress

- [ ] A实现、三篇、隔离门禁与发布。
- [ ] B实现、三篇、隔离门禁与发布。
- [ ] 综合复核、完成台账与最终发布。

## Decisions / Recovery / Outcome

单机有界数据，JSONL事实粒度是事件，金额整数分，分钟整数用于可控模型；不声称无限流或生产吞吐。来源SHA仅标识输入字节，不提供真实性认证。中断后先核对Git/工作区/HEAD/origin和本计划最后证据，保护修改；临时失效按新例子README重建。不得读取其他项目或私密资料，不重初始化、不强推，不承诺离线运行。当前A进行中，其余NOT_RUN。

A本地门禁完成：三篇、15 Python测试、87 notes、377 Node测试、120HTML/291产物；独立故意错误恢复通过，见reports/H6-data-a.md。准备普通push并核对同SHA，B设计暂存/tmp/kb-data-create-b.py。
