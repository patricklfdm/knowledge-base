# H7-002 内容复核与维护

## 目标、事实与范围

让读者能报告教材问题，让维护者从到期、固定运行时差异、来源观测和反馈进入可追踪复核。2026-09-13基线为v5 / 66eb047ed5dcfdd9521a8fe5990a7c946cf90631，origin为patricklfdm/knowledge-base，工作区干净；97 notes、kb:check零错误。H7-002依赖H4-001A已满足。

实现只读离线kb:review、观测记录、反馈入口和维护说明，接入既有门禁。复用check.mjs的解析与校验，不改文章核验日期、不升级依赖、不发真实Issue。BACKLOG仍是唯一任务台账；观测记录没有任务状态。浏览器在规划内容完成后集中验收，当前不提前声称通过。

## 步骤与验证

1. 扩展检查器可选返回笔记清单，实现复核命令：ISO日期/180日提醒、仓库固定Node/Python/Java版本比较、HTTP(S)链接清单、观测证据校验。
2. 正反夹具覆盖日期边界、版本差异、代码/引用式链接、非法观测、路径与符号链接、只读性、CI入口遗漏。副本故意移除守卫，原测试必须失败，恢复后通过。
3. 提供维护流程、回执模板、GitHub反馈表单与公开导航；用真实历史403记录示范处理，不捏造用户反馈。
4. 隔离同步维护源码，以固定Node24.21.0/Java21.0.11/Python3.13.0执行kb:verify、npm test，检查源码与锁漂移。依赖未变，复用已有干净安装隔离根。
5. 更新报告/STATE/BACKLOG；普通push既有origin/v5，检查同SHA quality/build/deploy与线上入口/资源/索引/404。完成H7-002后解除H4 UI的内容依赖并保存集中三目标恢复入口。

## Progress

- 完成：Git、基线kb:check、规范与H7-002验收要求核对。
- 完成：实现只读复核、反馈表单和维护入口。
- 完成：隔离全量验证、两类故意错误和恢复、验收报告、UI内容依赖交接。
- 完成：934c8d4dfebaa34a52c5616692b0cc3d821d3dd1普通push，Actions34812504440三项同SHA成功，HTTP6入口/30资源/索引132/404通过。

## Decisions and discoveries

默认不联网，链接清单不是链接健康结论。HTTP状态与正文准确性分开记录；历史JSON Schema 403已经由web读取正文核验，不冒充本轮重新联网测试。到期只是提醒，不能自动撤下或刷新verified_on。仅比较仓库固定的三个运行时家族，其他tested_with条目列为未比较；Java构建号不作同版本证明。

## Recovery

先核对Git和本计划；不覆盖已有修改。隔离根见/tmp/kb-h3b-path.txt，Java见/tmp/kb-h5d-java-home.txt；临时资源失效按VALIDATION重建。下一步按Progress继续，所有NOT_RUN保留；不强推、不改全局运行时，不声称离线持续工作。

## Outcome

H7-002本地验收完成，见[报告](../../../../reports/H7-maintenance.md)：98笔记、46检查器/389 Node测试、133HTML/317产物，源码/锁一致；只读与年龄故意错误检出。正文82篇核验日期保持。上述同SHA部署与HTTP通过；随后继续集中UI，见H4-UI-concentrated计划与UI验收报告。
