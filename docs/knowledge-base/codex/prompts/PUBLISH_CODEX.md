我授权发布当前已经完成且经过检查的 KnowledgeBase 批次，仅限 `patricklfdm/knowledge-base` 现有 `v5` 分支和现有 GitHub Pages 站点，不包括后续尚未开发的内容。

先读取 AGENTS.md、OPERATING_MODEL.md、QUALITY_GATES.md 与当前执行报告。核对 origin、分支、远程变化和待发布提交范围，展示本批次摘要。若有未识别的用户改动、未通过的必需检查、私密资料、目标不符或非快进冲突，先停止发布并说明原因，不强推、不绕过保护。

重新完成本批次必需的本地验收，包括正式构建、链接/元数据/发布范围检查、相关示例与 UI 测试。核查 content 之外的待推送源码、附件及 Git 提交也没有秘密。只有都通过才普通推送至既有 v5，不修改仓库设置、不创建云资源、不打 tag。

跟踪与本次提交 SHA 匹配的 Publish Knowledge Base 工作流和必要测试检查，核对实际部署地址并进行线上冒烟验证。工具或权限不能验证的项目写 UNKNOWN 或 NOT_RUN，不能宣称线上验收通过。不要无上限轮询。

在报告里记录推送 SHA、workflow run、各验收状态、回滚提交方案和遗留风险；敏感输出不入库。此授权完成本批次后即结束，随后恢复 review-before-push。
