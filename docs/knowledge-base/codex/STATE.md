# 当前检查点

2026-09-11 America/Los_Angeles。origin=patricklfdm/knowledge-base，分支 v5。已发布源码 SHA `db0210259713b87b48368c1b47b2d18279e81726`；本地最后一笔为事后验收文档提交，比 origin/v5 多1笔且无站点代码变更。以实际 Git 为准，不为报告自引用重复部署。

当前焦点 / 下一项：**H3-001B**（F05/F06：异步、TypeScript 与运行时校验）。全局台账唯一来源 BACKLOG.json；父 H3-001 未完成，不把5篇教材算成完整应用。

最新计划：[H3 对象与模块](plans/H3-001-objects-modules.md)。验收：[H3](../../../reports/H3-objects-modules.md)、[本批发布](../../../reports/RELEASE-2026-09-11.md)。

## 恢复动作

1. 核对根目录、git status、HEAD、origin/v5，保护新增用户修改；不要初始化、切分支或改发布目标。交接资料已单独审阅入库。
2. 读 H3-001B/CURRICULUM，建立 F05/F06 小批计划，先实现可复现异步成功/拒绝，再扩展类型与外部数据校验；不访问 Wayvia/GSE，不开启付费或生产资源。
3. 使用已安装 Node 24.21.0 的命令级 PATH（默认 shell Node20），按实际 package.json 运行 npm run kb:verify / npm test；例子独立在 examples/foundations。

本地最终：12 notes、34校验测试、10示例组、类型/24 HTML/99产物/禁发测试PASS，完整npm test 208 PASS，根与示例锁未漂移。浏览器390/1440阅读、复制、中英文搜索通过。缓存修复的回归测试实际验证了撤掉修复会失败。

## 发布与限制

部署 **success**；同 SHA [run 34670174007](https://github.com/patricklfdm/knowledge-base/actions/runs/34670174007) quality/build/deploy全部success，UTC2026-09-12T03:23:59Z完成；线上搜索、导航与实际资源/404冒烟通过。最初bccf231已成功部署，但暴露旧索引缓存，db02102已修复。最终验收文档本地保存，随下一批正常推送。

本批授权已完成，恢复默认 **review-before-push**。后续本地开发继续自主进行；新内容发布需该批授权。

远程字体仍需要网络；缺失但未使用的Excalidraw插件警告、全仓上游格式差异仍见H0。npx build曾OOM，使用npm run quartz -- build。搜索摘要实体/片段质量留在H4-001；已打开SPA需刷新以读取新部署。wiki/HTML/附件语法未支持范围见VALIDATION，不能当作全面兼容。

临时预览已停止，测试标签关闭，浏览器视口恢复。隔离日志指针 /tmp/kb-h3-path.txt；失效时从受控Git文件重建，不复制私密目录。报告与测试是持久证据，不承诺离线持续执行。
