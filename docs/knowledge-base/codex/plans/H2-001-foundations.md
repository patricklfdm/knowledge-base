# H2 F00–F02 样板与阅读

## 目标与当前事实

H0/H1 已在本地通过（见 reports/H0-baseline.md、H1-quality-foundation.md）。读者能运行一个 JS 程序、解释值与类型、用条件和函数校验行程天数。现有正文只有 7 篇导航；本批增加 3 篇真实教材。

## 范围与步骤

1. examples/foundations 独立无依赖 Node 项目，提供成功/失败文件与确定性测试。
2. content/topics 下 F00–F02：先修、机制、命令、实际结果、失败与迁移练习；核对 Node/MDN 官方来源。
3. 原有路线保留 10 项目标，增加 F00–F02 真实入口；元数据用正文顶部中文小段呈现，不改上游组件。
4. 作者自审后另做一次不编辑的读者任务复核；桌面/窄屏实际浏览三篇，核对标题/代码/导航/搜索/键盘。
5. kb:examples 接入 kb:verify；隔离构建、报告、状态与小提交。

## 验证与 Progress

- 已完成：读取内容标准/课程/模板，在线打开 Node 与 MDN 来源。
- 已完成：3 篇样板、独立无依赖例子、来源复核、两次阅读阶段、390/1440 浏览器矩阵、最终完整门禁、报告。
  正式 reviewed/publish 需示例与来源核验、阅读复核；不能以文章数冒充整条路线完成。

## Decisions and discoveries

不引入框架、数据库或新依赖。仅本地进程与合成数据。源码链接指向既有仓库并注明 examples 精确路径；本批未推送，远端尚无新文件。

- 发现 shortest 对跨层相对链接输出错误，配置改 relative，源码/产物负面互证后通过。
- 隐藏重复属性表，增加 20 行 custom.scss 语言标签/手机摘要限制；不改上游组件。
- 中文摘要实体显示问题登记 H4-001，不虚报全面搜索验收。

## Recovery

使用 .nvmrc Node；从 examples/foundations 和三篇正文继续；浏览器不可用则 G7 NOT_RUN，H2 gate 保留未完成，不能虚报。

## Outcome

H2 本地验收通过；见 reports/H2-foundations.md。下一项 H3-001，先 F03/F04 小批计划；远端 G8 NOT_RUN，部署 not_requested。
