# 接手基线：证据与边界

核对日期：2026-09-11，America/Los_Angeles。

## 已通过 GitHub 读取核对

- 仓库 `patricklfdm/knowledge-base`：public，默认分支 `v5`。
- 核对提交：`6a4b2eaadb1750e4da9ae872b851b0f5bffe7710`。
- `package.json`：Quartz `5.0.0`，ES module，Node engine `>=22`、npm `>=10.9.2`。这是包文件的字段，不是对全平台兼容性的独立证明。
- `.nvmrc`：`24.21.0`。不要升级为其他版本来开始接手；先检查本机/CI 是否一致。
- `quartz.config.yaml`：locale `zh-CN`，baseUrl `patricklfdm.github.io/knowledge-base`，analytics null，`@quartz-themes/core` disabled；remove-draft 和 explicit-publish enabled。
- `ignorePatterns` 包括 private、templates、.obsidian、.trash。
- 现有 `content/` 树包含首页、start-here、knowledge-map、fullstack-foundations 路线以及项目/实验/速查入口。它们属于起步导航，不是已完成教程。
- 发布工作流 `.github/workflows/publish-knowledge-base.yml`：v5 push / workflow_dispatch；npm ci → 插件安装 → Quartz build → public artifact → Pages deploy。
- 发布运行 `34661542168`，同一提交 SHA，`completed/success`。UTC 完成时间 `2026-09-12T00:25:29Z`，对应洛杉矶 2026-09-11 17:25:29。UTC 次日不表示用户本地日期已变。
- 继承的 `.github/workflows/ci.yaml` 的 build-and-test/publish-tag job 带 `github.repository == 'jackyzha0/quartz'` 限制。它不是本项目现成可运行的质量门禁。不要直接移除所有限制，误触发上游 tag/发布逻辑。
- package 脚本 `docs` 使用 `-d docs`，构建上游说明文档。本站应使用默认 content 入口。

## 用户报告

本地 localhost、Obsidian 编辑、版本记录及上一轮在线验收已完成。之前遇到主题模块缺失，关闭主题插件后本地恢复。

## 本次没有独立完成的验证

没有重新安装本项目依赖或完整构建，没有对当前线上界面做桌面/手机浏览器实测，没有验证搜索质量、所有附件、所有过滤器、所有上游测试。用户本机未提交修改、Git 凭据、分支保护、插件锁行为和所有插件版本仍需 H0 检查。

## 接手优先核查

1. HEAD 是否仍相同；不同不代表错误，记录新增变更，不回退。
2. `.nvmrc`、`.node-version`、CI Node 是否一致；仅 .nvmrc 的具体值在本包核对过。
3. 插件安装是否修改 manifest/锁文件、干净环境是否可复现。quartz.lock.json 存在/是否跟踪由实际文件决定。
4. 本项目专属 CI 缺口；现有发布能否阻止内容/代码失败。
5. 旧规则的过期语句、默认 footer 指向上游、继承的 workflow/README/模板是否适合知识库。先审计，不无差别删除上游文件。
6. 已启用 encrypted-pages/unlisted-pages 也不能用来保护公开 Git 源文件；不要因此导入私密内容。

## 来源

完整路径与固定 SHA 链接见 [SOURCES](SOURCES.md)。本报告不包含凭据、个人邮件或机器私密路径。
