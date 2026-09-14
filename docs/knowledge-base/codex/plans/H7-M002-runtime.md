# H7-M002 Python / Java补丁兼容性

## 目标与基线

用户要求下一轮，承接H7-M001。基线81ed3780d9a1a3622c351b7307051aa718a060fa，v5干净、origin=patricklfdm/knowledge-base。现有Python三包固定3.13.0，Java固定Microsoft21.0.11+10，Node24.21.0不变。最小check通过98笔记，review 0候选/248外链/5观测/120未比较项。

## 范围与步骤

1. 从官方发布页确认Python3.13.15及Microsoft21后续补丁、下载地址/校验信息。
2. 只在自建临时目录构建或解包运行时；不改系统安装、默认PATH/JAVA_HOME，不读取其他项目。
3. 对隔离源码副本先验证旧版本守卫拒绝新版本，再设置副本目标版本重跑Python三包、Java全套成功/边界/失败。检查四段Java版本解析与真实工具输出；修改工具需正反回归和故意破坏/恢复。
4. 根据证据选择正式固定版本或保留当前固定版并记录具体限制；不用批量日期替换假装逐篇复审。正文更新最多三个入口，历史报告不改造。
5. 适用完整门禁、同SHA自动普通push/部署与HTTP；维护计划、BACKLOG、STATE。

## Progress

- 已完成：身份/规范/上轮回执与最小检查。
- 已完成：两个官方归档SHA256校验，CPython自建目录编译，Microsoft JDK解包。
- 已完成：新Python三包29/33/31与Java34组；修复Python venv与Java测量测试硬编码；review四段漏报测试先失败后通过。
- 已完成：旧环境完整门禁398 Node/49检查器，两个独立故意错误检出与新环境恢复。
- 已完成：bb3d054同SHA两条quality/Build/Deploy与HTTP、两篇390窄屏发布阅读抽查。

## Decisions / Recovery

本轮限补丁兼容性；依赖PR分诊仍属H7-M003。Python3.13在线文档目前显示3.13.15，Microsoft列21.0.12.1，实际JDK报告21.0.12.1+1-LTS。保留旧复现版本，新增独立kb:runtime-compat和必需CI job；不批量改写历史metadata。setup-java实际读取的Microsoft目录未列21.0.12.1，CI使用官方Linux精确URL与固定SHA256后解包，原verify继续使用既有版本。临时根和命令/校验日志记录于本报告。中断后先读Git与本计划，保留历史verified_on，不清理用户环境、不绕过失败。

## Outcome

H7-M002已验收，证据reports/H7-m002-runtime.md。保留历史复现基线，持续验证新补丁；下一项H7-M003。最终工程记录提交按实际HEAD另核对部署。新运行时保留备复验，测试副本自动清理，浏览器标签/视口已清理，无常驻服务。
