# 当前检查点

2026-09-13，patricklfdm/knowledge-base既有v5。H0–H7既定任务已完成，BACKLOG是唯一任务台账；后续进入[内容复核与维护](../MAINTENANCE.md)，由kb:review候选、真实反馈或明确新需求建立任务，不自行无限扩张课程。

本轮先完成[H7-002维护](../../../reports/H7-maintenance.md)，再完成[集中UI与H4总验收](../../../reports/H4-ui-acceptance.md)。真实浏览器覆盖路线阅读/复制、搜索键盘、F11基础应用；修复实体/中文摘要、取消后旧提示与焦点。98笔记（16导航/82教学）、46检查器/395 Node测试（45 suites）、Python29+33+31、133HTML/318产物；全套隔离门禁和两类摘要故意错误/恢复通过，锁无漂移。82篇verified_on未改，只有两篇F11补充实际UI证据与运行环境。

UI修复6969287a246fe398f1008f4037171533a125fbd0普通push；Actions34815043925同SHA质量/Build/Pages全部success，HTTP6入口/31资源200、索引132/404通过，线上390搜索复验成功。维护提交934c8d4的独立发布回执见H7报告。工程收尾提交仍需按实际HEAD自身SHA核对；恢复时读取Git/Actions，不能用上述正文SHA替代最新HEAD。

v1.0验收限于既定范围：其他浏览器、真实屏幕阅读器、F07独立页面/F12备注变体/React实验等未纳入集中三目标，保留各自NOT_RUN；没有远端浏览器CI或不存在的kb:e2e。附件允许清单仍为空，生产/付费/真实LLM未授权且未运行。

持续授权：适用验证后自动普通push既有origin/v5。三个自建标签、临时站点/教学服务与数据库已清理，浏览器视口重置/显示恢复后台。固定Node24.21.0/npm11.19.0、Java21.0.11+10/Python3.13.0保持；隔离根/tmp/kb-h3b-path.txt，日志/tmp/maintenance-*.log和/tmp/ui-*.log。恢复先核对仓库/工作区/HEAD/origin，保护修改、不强推、不改全局配置、不碰其他项目；临时失效按VALIDATION重建，不承诺离线持续执行。
