# H7-M001 首轮勘误与版本复核

## 目标与事实

2026-09-14用户要求进入勘误、版本复核。基线1f80ef5953bf5ffc32c0fb285987986f2e6adbc4，v5干净、origin为patricklfdm/knowledge-base。H0–H7课程已完成；先跑kb:check通过98笔记，kb:review固定日期2026-09-14扫描82教学、243外链、120未比较环境、0候选。零候选不覆盖上游更新。

## 范围与步骤

1. 读取维护规范，核对公开Issues、既有JSON Schema观测和Node/Python/Java官方发布信息。
2. 对F00/P00/J00环境入口进行读者任务复核；仅按证据修正，保留路径、ID与原verified_on。
3. 在既有干净安装的隔离根同步受控源，重跑适用示例、kb:verify/npm test；锁无漂移。现有正常/边界/失败测试继续适用；文案变更不新增镜像测试。
4. 写可读回执、观测索引、BACKLOG和STATE。普通push既有v5；核对同SHA quality/build/deploy与HTTP。浏览器范围按实际页面变更判断。

## Progress

- 已完成：身份与最小检查、维护规范读取。
- 已完成：官方来源与读者视角复核、三篇版本边界补充、JSON Schema独立200复查。
- 已完成：隔离kb:verify/npm test，395 Node测试与构建/过滤门禁通过，锁和verified_on不变。
- 进行中：普通push、同SHA部署和页面抽查。

## Decisions and discoveries

不整体升级依赖或系统运行时；本批版本复核先判断已测版本的适用表述。公开Issues接口返回2个Dependabot PR、0个普通反馈Issue，PR不是读者勘误。现存版本升级建议单独分诊，不自动合并。

## Recovery

先检查实际Git差异再恢复本计划。临时扫描/tmp/kb-review-20260914.json；隔离根指针/tmp/kb-h3b-path.txt。只管理自身临时目录，保留历史失败和NOT_RUN。不承诺离线自动持续运行。

## Outcome

待验收；任务状态只查BACKLOG，发布尚未执行。
