# 知识库项目规则 v0.1

## 定位

本项目是一套可持续维护的个人全栈工程教材，采用 Markdown、Obsidian、Git 与 Quartz。第一版网站负责阅读，不自研在线编辑器、账号系统或 AI 问答。

## 目录边界

`content/` 仅容纳准备公开的内容与经过检查的附件。`docs/knowledge-base/` 容纳可以公开的项目规则与模板，不作为 Quartz 正文发布，但将来若仓库公开，这些文件仍可被读取。

个人掌握进度、私密草稿、原始项目资料与凭证保存在整个 Git 仓库之外，例如 `~/Notes/knowledge-base-private/`。不把文件名为 private 的子目录当作安全边界。

只有首篇正文实际建立时才创建相应 `topics/` 子目录。未完成专题在知识地图列为计划，不创建大量空白笔记。

## 文件与链接

文件名使用稳定的小写英文与连字符；正文与显示标题使用中文。文件移动或重命名后必须检查链接。

起步包使用普通 Markdown 相对链接，避免不必要的插件依赖。后续允许有完整路径的 Obsidian 双向链接，但应通过构建验证。

## 元数据

内置字段使用 `title`、`description`、`tags`、`draft` 等。`id`、`note_type`、`level`、`status`、`prerequisites`、`tested_with`、`verified_on` 是本项目的内容约定，不代表 Quartz 自动生成课程导航或学习进度。

`note_type` 可取 navigation、concept、tutorial、how-to、reference、case-study、lab。

`status` 可取 seed、draft、reviewed、needs-update。seed 只表示起步导航，不是完成了课程内容。

编辑状态与发布控制分开。默认 RemoveDrafts 生效时，`draft: true` 排除 Markdown 页面。`publish: true/false` 只有在启用相应 ExplicitPublish 过滤插件时才作为发布开关，本轮不假设其已启用。上线前需要核验实际过滤配置。

## 质量要求

文章解决一个明确问题，写出先修知识、场景、机制、示例、失败边界与练习。内容较长时拆成有顺序的系列，不靠空泛背景凑篇幅。

项目案例标注版本和验证范围。旧版 Wayvia、Wayvia 2.0 与教学应用严格区分。GSE 的性能与持久化保证以对应实现和验证证据为准。

## 编辑流程

确定问题和先修知识 → 提纲 → 正文与例子 → 核对来源 → 运行示例 → 阅读审查 → 发布。

## 分阶段建设

阶段 1：本地站点、Obsidian 写作入口、导航骨架与模板。

阶段 2：自己的远程仓库、发布检查、GitHub Pages 与线上验收。

阶段 3：10 篇左右的样板学习单元，至少包含概念、教程、故障分析和速查。

阶段 4：链接、必要元数据、代码示例和构建的自动检查。

阶段 5：逐步扩展系统、生产、分布式和数据工程路线。

## 官方参考（核对日期：2026-09-10）

- Quartz 安装：`https://quartz.jzhao.xyz/getting-started/installation`
- Quartz 内容编写：`https://quartz.jzhao.xyz/getting-started/authoring-content`
- Quartz 配置：`https://quartz.jzhao.xyz/configuration`
- Quartz 页面过滤与附件警告：`https://quartz.jzhao.xyz/features/private-pages`
- Obsidian 打开现有文件夹：`https://obsidian.md/help/manage-vaults`
