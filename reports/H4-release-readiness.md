# H4-001A：发布范围与恢复准备验收

2026-09-12，基线7e76fca18cfde49422ec2a406aeafbc459cd4f5a，patricklfdm/knowledge-base v5。本轮连续完成F11与F12/F13发布后接续本项；不逐项等待新prompt。

## 交付与实际验证

核对content全部27个Markdown文件，无附件。现有检查器拒绝非Markdown与符号链接；构建产物检查覆盖文件/页面/资源，禁发检查实际构建公开对照及3个禁止marker并注入泄漏，不能把draft或忽略项当保密机制。本批保留附件未准入规则，没有新增格式支持。

新增[发布与恢复手册](../docs/knowledge-base/RELEASE_RECOVERY.md)、[集中UI清单](../docs/knowledge-base/UI_ACCEPTANCE.md)。三项目标覆盖路线阅读、搜索键盘、教学应用；包含候选页面、预期与有限重试。H2既有搜索实体/摘要问题保留，未以文档代替修复。

新增scripts/knowledge-base/rehearse-revert.mjs及真实命令`npm run kb:recovery-test`，已加入kb:verify。仅创建自身临时Git库，无remote，使用局部合成提交身份、不修改用户全局配置：合法30天断言通过→提交错误上限300→31天断言失败且退出1→普通git revert生成反向新提交→测试恢复通过、工作区干净。finally清理夹具。本项目与线上版本未被回退，数据库未操作。实际输出：

```text
Recovery fixture: baseline PASS
Recovery fixture: introduced defect detected (expected exit 1)
Recovery fixture: ordinary revert PASS; clean; no remote
```

Node24.21.0/npm11.19.0/macOS arm64。无依赖变化，受控同步到本会话已干净安装隔离副本，`npm run kb:verify`及`npm test`通过：27 notes、34检查器、259 tests/45 suites，0 fail/skip；回退夹具、全部登记示例、tsc、构建、52 HTML/155产物、公开对照与禁发负面PASS。日志/tmp/h4a-verify.log、/tmp/h4a-tests.log；原锁文件无差异。临时日志失效可从仓库命令重跑。

审阅关注点：命令确已实现、Git夹具不使用本库、失败必须非零、普通恢复后仍需测试；另按故障处理顺序重读手册，明确源码回退不恢复数据。没有虚构独立专家或生产演练。

## 边界与状态

H4-001A完成，BACKLOG关联本报告；H4-001/H4-GATE和v1.0未完成。G7、真实DOM/键盘、浏览器测试接入及历史搜索交互缺陷仍NOT_RUN/待处理。用户此前暂停浏览器，已提交具体三项目标询问恢复；未收到明确允许前继续暂停。生产恢复、真实线上revert、断电/磁盘、备份恢复、新附件类型均NOT_RUN。

本批范围为恢复脚本/命令和工程文档；教材页面自7e76fca未改。该SHA同提交CI/Pages和HTTP已成功，见[H3-003报告](H3-tests-delivery.md)。本批按持续授权普通push origin/v5并跟踪新SHA；报告以基线加本批差异定位，最终提交及运行结果由Git/Actions确认，不把本文所在提交SHA反复写入自身。

下一项H4-UI-SITE/H4-UI-APP依具体清单与用户明确许可恢复；H5依H4-001，保留依赖，不将未测UI改done以解锁。计划与STATE提供恢复入口；本回合结束后不宣称离线执行。

## 发布补记

25e73408143c12079c8f809af454c405ce762928已普通推送。[同SHA运行34681756899](https://github.com/patricklfdm/knowledge-base/actions/runs/34681756899)成功：quality 103521541563、build 103521620500、deploy 103521670925，部署完成2026-09-12T07:51:47Z。HTTP文本冒烟重新实跑PASS：主页/路线/相关四篇正文6页、实际30个CSS/JS、四篇搜索索引、缺失路径404；无浏览器操作。本补记只更新工程证据，教材、运行脚本与依赖不变。
