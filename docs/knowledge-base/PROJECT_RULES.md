# 知识库项目规则 v0.2

## 定位

本项目是一套可持续维护的个人全栈工程教材，采用 Markdown、Obsidian、Git 与 Quartz。第一版网站负责阅读，不自研在线编辑器、账号系统或 AI 问答。

## 目录边界

`content/` 仅容纳准备公开的内容与经过检查的附件。`docs/knowledge-base/` 容纳可以公开的项目规则与模板，不作为 Quartz 正文发布，；本仓库已公开，这些文件也可被读取。

个人掌握进度、私密草稿、原始项目资料与凭证保存在整个 Git 仓库之外，例如 `~/Notes/knowledge-base-private/`。不把文件名为 private 的子目录当作安全边界。

只有首篇正文实际建立时才创建相应 `topics/` 子目录。未完成专题在知识地图列为计划，不创建大量空白笔记。

## 文件与链接

文件名使用稳定的小写英文与连字符；正文与显示标题使用中文。文件移动或重命名后必须检查链接。

起步包使用普通 Markdown 相对链接，避免不必要的插件依赖。后续允许有完整路径的 Obsidian 双向链接，但应通过构建验证。

## 元数据

内置字段使用 `title`、`description`、`tags`、`draft` 等。`id`、`note_type`、`level`、`status`、`prerequisites`、`tested_with`、`verified_on` 是本项目的内容约定，不代表 Quartz 自动生成课程导航或学习进度。

`note_type` 可取 navigation、concept、tutorial、how-to、reference、case-study、lab。

`status` 可取 seed、draft、reviewed、needs-update。seed 只表示起步导航，不是完成了课程内容。

编辑状态与发布控制分开。当前配置已启用 RemoveDrafts 和 ExplicitPublish；只有 `publish: true` 且 `draft: false` 才进入站点。本项目检查器还要求 reviewed 或 navigation+seed。详见 [元数据契约](codex/METADATA_CONTRACT.md) 与 [实际检查范围](VALIDATION.md)。网页过滤不保护公开 Git 源码。

## 质量要求

文章解决一个明确问题，写出先修知识、场景、机制、示例、失败边界与练习。内容较长时拆成有顺序的系列，不靠空泛背景凑篇幅。

项目案例标注版本和验证范围。旧版 Wayvia、Wayvia 2.0 与教学应用严格区分。GSE 的性能与持久化保证以对应实现和验证证据为准。

## 编辑流程

确定问题和先修知识 → 提纲 → 正文与例子 → 核对来源 → 运行示例 → 阅读审查 → 发布。

## 建设与接手

旧阶段 1/2 已形成上线基线；后续 H0–H7 以 [路线图](codex/ROADMAP.md)、[BACKLOG](codex/BACKLOG.json) 为准。[STATE](codex/STATE.md) 是恢复点，不另建状态表。普通本地开发已授权，远端发布默认 review-before-push。

新文章使用 [当前模板](codex/templates/ARTICLE_TEMPLATE.md)，遵循 [内容标准](codex/CONTENT_STANDARD.md)。检查命令与失败分类见 [VALIDATION](VALIDATION.md)。

## 官方参考（核对日期：2026-09-10）

- Quartz 安装：`https://quartz.jzhao.xyz/getting-started/installation`
- Quartz 内容编写：`https://quartz.jzhao.xyz/getting-started/authoring-content`
- Quartz 配置：`https://quartz.jzhao.xyz/configuration`
- Quartz 页面过滤与附件警告：`https://quartz.jzhao.xyz/features/private-pages`
- Obsidian 打开现有文件夹：`https://obsidian.md/help/manage-vaults`
