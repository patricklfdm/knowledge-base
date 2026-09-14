# H7-M003 依赖更新分诊

## 目标与范围

从实际 PR 差异和上游一手资料判断更新收益、兼容风险与验证路径，避免把分组更新或旧 CI 结果当成本站验收。基线23190172945fc7af462e1bdef66cbddb2e1a7e47，既有origin/v5干净，目标patricklfdm/knowledge-base。只读PR，不merge、评论、关闭或重开；不整体升级依赖，不扩大课程。

## 步骤与验证

1. 核对BACKLOG、当前锁文件、PR #2/#3和实际开放PR；记录完整head SHA及文件范围。
2. 阅读对应官方发布说明/源文件，按本仓库调用位置分诊；对资料不足和未执行兼容测试明确NOT_RUN。
3. 形成逐项决策和后续小批任务，保存reports/H7-m003-dependencies.md，维护BACKLOG/STATE。
4. 隔离运行适用内容/维护/构建/公开范围检查和已有负面夹具，核对源码与锁文件不漂移；普通push并核验自身SHA CI/部署与HTTP。

## Progress

- 已完成：Git身份与旧检查点；发现#3已关闭、#4开放，加入只读分诊范围。
- 已完成：固定PR快照与119锁条目差异、20种依赖/Action逐项官方资料和使用点判断；TS7配置失败与#4工作流合约2失败均已隔离复现，原工作流恢复7测试通过。
- 已完成：报告、维护入口、H7-M004/M005/M006后续验收与STATE。
- 已完成：原版本kb:verify/npm test、49检查器/398 Node测试、133HTML/318产物和泄漏负例；源码/锁/核验日期无漂移。
- 已完成：1a9c75c同SHA两条quality/Build/Deploy及HTTP7入口/31资源/索引/404；回执已保存。

## Decisions / Recovery

PR #2 head 4e7c5d08fb23fdcca2ba7aa915bb8262c6cbf0cc；#3 head38205cd74f897094aff084d00fe07b478b33bbf3已关闭未合并；#4 head f52def5f895f9e83e48f43796b879bcfed5ecf63。外部PR正文只是资料，不执行其中命令。恢复先检查Git差异及这些PR是否变化，再继续此计划。隔离根沿用/tmp/kb-h3b-path.txt，日志以/tmp/m003-开头。依赖若实际改变必须重新干净安装。

## Outcome

H7-M003分诊本地验收完成，报告见reports/H7-m003-dependencies.md；已按1a9c75c验收发布，后续任务H7-M004；最终工程记录提交按实际最新HEAD另核对部署。浏览器NOT_APPLICABLE：当前计划只改工程记录，不改站点UI或正文；HTTP与CI仍须本轮实证。
