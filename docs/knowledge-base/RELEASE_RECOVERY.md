# 发布范围与恢复操作手册

适用patricklfdm/knowledge-base既有v5。当前用户持续授权每批验证后普通push；其他会话依实际用户授权处理。本文不授权PR/tag/强推、生产数据库、其他仓库或浏览器恢复。

## 提交前

确认Git根目录、分支、HEAD、origin和工作区，目标必须是本仓库；保存并保护已有修改。只暂存明确属于本批的路径，审阅差异和公开范围；凭证、个人记录、用户数据库必须留在整个仓库之外。

content是公开Markdown源，docs/knowledge-base是可公开工程文档，examples只使用合成数据。当前附件允许清单为空：content非Markdown、符号链接及未支持链接语法会失败；PNG/PDF等没有因为“是图片/文档”自动获得发布资格。需要新附件格式时先实现路径/类型/大小/内容及实际构建互证，本手册没有开放附件或放松门禁。draft、publish和忽略目录不是保密机制。

## 隔离验证

使用.nvmrc/.node-version指定的Node24.21.0；复制受控源码到新隔离目录，或按QUALITY_GATES复用本会话已干净安装且锁一致的副本。不要清空用户工作区来获得“干净”。依赖变化必须重新安装。完整门禁还需要[Java示例规定的JDK21.0.11](../../examples/java-basics/README.md)，以KB_JAVA_HOME或已有JAVA_HOME指定；不要依赖系统默认版本，也不要把未安装JDK当作可跳过检查。

在隔离根目录运行真实命令：

```sh
npm ci
npm ci --prefix examples/typed-trips
npm run quartz -- plugin install --from-config
npm run kb:verify
npm test
```

无依赖变化复用时保留此前安装证据和锁摘要；需要字体网络时走正常环境审批。kb:verify包含内容、负面fixtures、所有登记示例、隔离Git回退夹具、tsc、正式构建、产物与禁发测试。npm run docs构建上游文档，不是本站；kb:e2e尚未实现，不得用空脚本冒充。G7/应用UI按当前用户要求NOT_RUN，不能把其状态改成PASS。

## 普通发布与同SHA证据

本批门禁通过并审阅提交范围后提交；再核对origin/v5没有并发更新，普通push既有v5。非快进时先检查差异，不强推，不盲目覆盖用户提交。

同提交的Publish Knowledge Base必须满足quality→build→deploy，记录完整head_sha、运行URL和结果。上游限定的Docker/预览工作流skipped不算质量门禁PASS。推送成功不等于部署成功。

部署后用HTTP文本检查主页/本批文章/前后导航，解析页面实际CSS/JS地址，核对contentIndex.json包含新页面，不存在路径为404。此项不代替浏览器、搜索交互或动态API部署。完整记录写reports并在STATE留下一步。

## 出现回归时

先确认问题属于哪个SHA和路径：源码/构建/部署/缓存/数据库分别处理。失败门禁停止发布，定位第一条实质错误；能作小修复就验证小修复，不能靠删除断言继续。

若需要撤销本批错误提交，先审阅该提交范围和依赖，确认不会撤掉用户后续工作。普通 `git revert` 生成反向新提交，[Git官方说明](https://git-scm.com/docs/git-revert) 描述了这一机制。冲突需逐项解决并保留用户内容，不使用reset --hard或强推。

回退后的源码同样走隔离门禁、普通push和同SHA Pages/HTTP验证，不能只看到revert命令成功就宣称恢复。Git回退也不会自动恢复SQLite列或旧数据；数据库迁移/备份恢复需另行证据和适用授权，本手册没有执行该操作。

## 已实跑与未实跑

H4准备在无remote的临时Git夹具中验证：合法30天测试通过→错误放宽300导致31断言失败→普通revert生成新提交→测试恢复通过、工作区干净。夹具已删除，本项目v5与线上内容未被回退。可在根目录执行 `npm run kb:recovery-test` 复现，脚本scripts/knowledge-base/rehearse-revert.mjs只操作自己创建的临时Git库，无remote；不修改项目Git或用户全局配置。证据见reports/H4-release-readiness.md。

当前未实跑真实线上回退、生产数据库恢复、附件新类型发布或浏览器集中验收；它们不能由上述夹具PASS推导。集中UI候选见UI_ACCEPTANCE.md。
