# 当前检查点

2026-09-11 America/Los_Angeles。origin=patricklfdm/knowledge-base，工作分支v5。已发布源码仍为 `db0210259713b87b48368c1b47b2d18279e81726`。本地在其上保留上一批事后报告f5568ba、本批示例/CI工程3a0996e及本次正文/检查点提交；当前HEAD和实际差异以Git为准。

当前焦点 / 下一项：**H3-001C**，F07的HTML/CSS/DOM与表单桥接。状态唯一台账BACKLOG.json；H3-001B已经本地验收，H3-001整条路线仍进行中。

最新计划：[异步与类型](plans/H3-001B-async-types.md)。最新报告：[H3-001B](../../../reports/H3-async-types.md)；线上历史证据：[上一批发布](../../../reports/RELEASE-2026-09-11.md)。

## 恢复动作

1. 核对Git根、status、HEAD和origin/v5，保护新的用户修改；不要重做初始化或切分支。
2. 读取H3-001C和CURRICULUM，先拆清HTML结构、CSS、DOM和事件的最小桥接，再做合成行程表单；每批1–3篇，不把整套前端知识塞入一篇。保持接口/数据库尚未完成的诚实状态。
3. Node24.21.0使用命令级PATH，默认shell仍是Node20。干净副本先根 `npm ci`，再 `npm ci --prefix examples/typed-trips`，插件安装后 `npm run kb:verify` 和 `npm test`。根安装不会安装独立TypeScript包依赖。

最近验收：215 tests/45 suites、14 notes、34检查器测试、foundations13组与typed-trips4组、类型检查、27 HTML/105产物/禁发负面全部PASS。TypeScript5.9.3独立含空格路径安装/检查/运行通过；根和旧示例锁不漂移，新教学包锁固定可复现。两篇390/1440浏览器阅读、先修/下一篇、复制、中英文搜索完成。

## 发布与限制

本批发布 **not_requested**，G8远端检查/部署 **NOT_RUN**；新教材目前在本地，线上仍为F00–F04。保持 **review-before-push**，后续本地开发可继续；本批未push/PR/tag。上一批db02102同SHA检查/部署与线上冒烟success不等于本批已发布。

TypeScript包只处理类似JSON的普通数据对象，不防御任意getter/Proxy，未做目的地长度上限/唯一编号/鉴权/持久化。F05没有真实网络操作或超时性能实验。搜索摘要实体与片段定位质量保留H4-001。字体网络、未使用的Excalidraw缺包警告、上游格式差异仍见H0；npx入口曾OOM，使用现有npm run quartz -- build。

临时预览已停止（进程退出143），浏览器视口已恢复，测试标签关闭。隔离日志指针 /tmp/kb-h3b-path.txt、/tmp/kb-types-path.txt；失效时从受控Git文件重建，不复制私密目录。报告和维护的测试是持久证据，不承诺离线持续执行。
