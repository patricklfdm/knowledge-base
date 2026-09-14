# 当前检查点

2026-09-14，patricklfdm/knowledge-base既有v5，基线81ed3780d9a1a3622c351b7307051aa718a060fa。当前[H7-M002计划](plans/H7-M002-runtime.md)与[补丁回执](../../../reports/H7-m002-runtime.md)本地完成，准备自动普通push与自身SHA发布验收；BACKLOG是唯一状态台账。

已实测隔离CPython3.13.15（本机源码构建，SQLite3.47.1）和Microsoft OpenJDK21.0.12.1+1。新环境Python三包29/33/31、Java34组通过；修复Python venv/Java测量测试的硬编码版本、review四段Java漏报。两类独立错误检出及恢复通过。旧复现版本不改，新增kb:runtime-compat及必需CI子job；Microsoft安装清单未列新补丁，CI从官方指定Linux归档校验固定SHA后解包。

旧环境完整kb:verify/npm test通过：398 Node/45 suites、49检查器、98笔记（16导航/82教学）、133HTML/318产物。仅P00/J00增加补充说明，82篇verified_on和旧tested_with保持，锁无漂移。没有整体升级依赖或修改系统默认运行时。CI与部署结果尚待本批SHA实证，不能用前轮成功替代。

下一项H7-M003分诊现有Dependabot PR #2/#3，不自动合并PR。补丁运行时目录保留以便复验：/tmp/kb-m002-runtime-root.txt，具体可执行路径/tmp/kb-m002-python.txt及/tmp/kb-m002-java.txt；原环境隔离根/tmp/kb-h3b-path.txt、原Java指针/tmp/kb-h5d-java-home.txt。新测试副本由命令finally清理，无常驻服务；日志/tmp/m002-*.log。恢复先检查Git/HEAD/origin/差异，保护用户修改，不改其他项目/全局设置/强推。不承诺会话结束后离线执行，自动普通push既有origin/v5授权持续。
