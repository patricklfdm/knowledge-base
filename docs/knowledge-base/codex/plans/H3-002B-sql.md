# H3-002B：SQL表与持久化基础

## 目标与基线

基线e4b667066e06c29f309c02e2b38e230978bbed96，v5与origin同SHA，工作区干净。由F09内存创建走到独立SQLite表、参数化查询、数据库约束与新进程重开文件读取。Node24.21.0内置node:sqlite实际可用，sqlite_version()为3.53.4，无npm新依赖。

## 步骤与边界

1. examples/sql-trips独立无依赖包：固定schema.sql，INTEGER PRIMARY KEY、TEXT/INTEGER NOT NULL、days CHECK 1–30、STRICT；目的地数据库仅保护非空，不冒称复制了F09全部Unicode/trim规则。
2. 用prepare和参数绑定创建/按ID读取/筛选；演示SQLite无损类型转换与JS输入校验的区别。只操作自行创建的临时目录；不接现有API或用户数据库。
3. 实测约束拒绝无写入、单引号/SQL样式输入按值保存、语法错误、关闭重开与不同进程读取、:memory:对照、确定排序；错误入口非零，自动清理。独立含空格路径安装/测试、迁移练习与故意破坏CHECK的负面实验。
4. 两篇F10A表/写入/查询/文件生命周期、F10B参数/约束/边界；官方来源与两次读者复核，导航和CI登记，整批隔离门禁。
5. 报告、BACKLOG、STATE更新，普通push既有v5，跟踪同SHA CI/Pages与HTTP文本冒烟。

## Progress

- [x] 仓库、先修、环境和来源初核。
- [x] 示例、练习、失败检出实验。
- [x] 两篇内容、来源复核、非浏览器门禁。
- [ ] 报告/台账/状态、推送与部署实证。

## Decisions

采用Node内置同步SQLite教学接口，避免外部数据库或原生npm安装。同步调用会占用当前线程，不据此建议高并发服务器。只证明正常提交/关闭/新进程重开，断电、磁盘故障、备份恢复与并发写入NOT_RUN。IF NOT EXISTS不等于迁移，不修改旧库来验证新约束。课程业务校验保留在F09，此包直接SQL揭示数据库边界。

## Recovery / Outcome

本地内容/例子完成：22 notes、246 tests、44 HTML/139产物，独立安装/练习/故意失败验证通过，见reports/H3-sql.md。待普通推送和同SHA部署证据。使用Node24命令级PATH；复用/tmp/kb-h3b-path.txt所指已干净安装环境，受控同步并核对锁；缺失时重建隔离副本。只清理本轮创建的目录。G7和应用UI按用户授权延期，不调用浏览器。下一项F11页面/API/数据库整合，H3-002父阶段保持in_progress。
