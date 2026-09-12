# 工程实现规格

## 修改范围

首选内容、配置、小范围样式和局部插件/组件扩展。修改上游 quartz/ 源码需要解释为什么配置无法实现，并限定差异。不要为显示难度和先修标签搭建数据库服务。

工作路径：content/ 正文；docs/knowledge-base/ 规则；docs/knowledge-base/codex/plans/ 执行计划；reports/ 脱敏验证摘要；scripts/knowledge-base/ 自有检查工具；tests/knowledge-base/ 测试；examples/ 独立教学项目。只有实际需要时创建。

## 体验优先级

P0：首页能引导开始；路线/领域/项目实验三入口；移动正文可读；站内搜索中英文；所有导航真实有效；代码可复制并显示语言；无横向整页溢出。

P1：文章顶部可读地显示难度、先修、学习成果与核验信息；下一篇属于当前路线，不能把多条路线混成唯一全站顺序；相关知识/反向链接有效；搜索支持别名与术语；深浅色、键盘焦点、合理标题层次。

P2：按实际反馈改进搜索排序、专题总览、阅读进度。图谱是可选探索，不占用教学主路径。无依据不引入评论、分析追踪、动画库和远程字体服务。

基础样式偏简洁、充分留白、中英混排友好。保持现有配色可用，不把审计阶段变成视觉重做。浏览器测试覆盖至少约 390px 和 1440px 视口，另以实际手机/窄屏交互检查。不要只截首页就宣称所有阅读页面通过。

## CLI 契约与实现进度

当前 package.json 已实现以下核心命令，浏览器自动化仍待 H4：

- `npm run kb:check`：内容元数据、先修、内部链接、发布范围预检。
- `npm run kb:test`：验证器单元/负面 fixtures 测试。
- `npm run kb:build`：调用已核对的 Quartz 构建入口。
- `npm run kb:examples`：运行明确登记的示例测试。
- `npm run kb:e2e`：浏览器冒烟与必要交互验证。
- `npm run kb:verify`：汇总当前里程碑所有必需门禁，非零失败。

除 `kb:e2e` 尚未实现（目前浏览器工具人工核验）外，上述命令均已落地；另有 `kb:output` 和 `kb:publish-test`，详见 [VALIDATION](../VALIDATION.md)。不要以空脚本、echo 成功、`|| true`、continue-on-error 给门禁占位。尚无示例/UI测试时，清楚说明某检查不适用；后续引入后必须真正执行。

尽量复用已有 yaml、Markdown AST 工具等依赖。若新增解析器或浏览器测试工具，锁版本并说明必要性。Markdown 链接/锚点判断与 Quartz 输出对齐；用单测+真实构建互证，不能自创不兼容规则。

## CI 与发布

审计 .github/workflows 的所有触发器和权限。保留已有 publish-knowledge-base 的部署目标。给知识库增加独立 PR/branch 验证；仅增加一个并行 CI 不足以阻止 Pages 发布，部署任务必须依赖同一提交的必需验证。可以将 checks 纳入同工作流的前置 job，或调用可复用 workflow，但不能靠两个独立 push 工作流的偶然执行顺序。

最小权限：验证 job contents:read；部署 job 仅所需 pages/id-token。不要解除继承 workflow 的所有上游仓库限定，避免误发镜像、预览或 tag。不得以 pull_request_target 加载不可信 PR 代码/执行脚本并配写权限。

干净安装使用受锁文件约束的流程，验证插件安装的实际行为。插件 cache miss 必须成功，缓存不得成为构建必需条件。记录实际版本和依赖漂移，不假设 `--from-config` 等于 frozen lock。升级单独成批，不用 `--latest` 或强制审计修复。

需要安装 native/browser 依赖时说明平台要求；不能把“网络拉取失败”标为内容错误。报告 baseline failure 与新回归并保留真正的失败退出码。

## 发布隐私与附件

构建只指向 content；排除临时文件、工作区配置、环境文件和私密目录。负面测试用合成标记，验证 draft/unpublished Markdown 不出现在 HTML、搜索索引、RSS、sitemap 或其他衍生内容。

附件建立允许类型/路径、引用关系和大小检查，避免未引用敏感 PDF/图片被自动带入。不将任意 SVG/HTML 当作可信资源，不自动渲染用户输入为可执行 HTML。合成隐私测试在临时构建目录执行，不把故意不合规的正文放入实际公开 content。

有关正文过滤和附件的边界，参见 [Quartz 官方说明](https://quartz.jzhao.xyz/features/private-pages)。

Git 仓库公开，正文过滤无法保护源码；同时审查待推送提交，使用可靠 secret 扫描/人工审查，不以文件名黑名单声称绝对安全。

## 示例与隔离

examples 独立 package.json/lock/README，明确支持的 Node/Java/Python/DB 版本。首个项目可用 isolated PostgreSQL 容器，数据和端口与用户现有服务隔离。不操作 Wayvia/GSE 数据库。root tsconfig/test glob 不应意外包含示例或 node_modules；增加路径时添加边界测试。

提供 startup、test、reset（仅教学数据库）、stop/cleanup。数据重置命令必须校验命名范围；CI 服务用合成数据。不能把整个 examples 下所有 shell 逐个执行。

## 可维护性

错误应有文件/行或定位信息、具体原因、修复建议。文档与代码同批更新。日志/截图入库前脱敏，体积大的产物用 CI artifacts，报告仅留证据位置和摘要。保留原 LICENSE，不自行更换内容许可。成本预算先默认不新增付费服务。

## 当前内容优先约束

遵循 OPERATING_MODEL 的用户覆盖：H3 期间冻结知识库主题、布局、字体、响应式样式、搜索/渲染插件和框架依赖，不建立新浏览器平台。必要正文导航可更新。examples 中解释业务所需的简单 HTML/CSS/JS 属于教学内容，可实现；其真实浏览器交互如未运行明确延期，不用静态检查替代。现有业务、API、数据库测试继续。

H4 恢复浏览器时先列最多 3 个验收目标；首轮后最多 2 次有假设的功能重试；环境失败最多一次针对性修复后重试；最多保留 4 张有证据用途的截图。当前阶段不执行这些操作。

2026-09-12用户已明确恢复浏览器测试，上述“当前阶段不执行”已被覆盖；三目标和有限重试继续适用。首次恢复时电脑控制工具环境失败，一次重建仍失败，详见reports/H4-ui-environment.md；不是站点功能失败证据。
