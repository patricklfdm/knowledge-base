# H5-003 工程纵深主线综合验收

2026-09-13本地日期。patricklfdm/knowledge-base既有v5，起点11927769407dd5c2b3c9bbd8e19e9956c4d62f0f；用户确认继续下一部分，连续三个内容批次实施，不逐篇暂停。自动普通push有效，浏览器仍等待H5–H7全部规划内容完成后统一验收。

## 实际交付

E00–E08共九篇教学正文和一个路线，正文每篇约2400–2700字符（含元数据/链接）。每篇有真实先修、主要问题、可运行维护入口、失败解释和改变条件练习。content/roadmaps/reliable-engineering.md由首页/知识地图进入，已有全栈、SQL与系统路线作先修。

| 批次 | 主线 | 证据 |
| --- | --- | --- |
| A | E00组件/状态与派生值；E01代次/取消；E02语义表单/成本 | [A验收](H5-engineering-a.md)，前端9项测试、frontend与build |
| B | E03合成会话/资源授权；E04条件更新/迁移；E05日志/等待预算 | [B验收](H5-engineering-b.md)，新增8项，总17项，backend入口 |
| C | E06就绪/排空；E07备份/新进程恢复；E08服务目标/错误预算 | [C验收](H5-engineering-c.md)，新增7项，总24项，operations入口 |

examples/reliable-app为独立包，React/ReactDOM19.3.0与esbuild0.27.2精确锁定，Node24.21.0/npm11.19.0、SQLite3.53.4。原Java/Python/SQL/系统例子未修改，根依赖与主题未升级。CI增加新包npm ci与manifest/lock保护，缺安装、顺序错误、缺锁及缺登记都可检出。

## 九篇复核及故障证据

作者自审后第二次从读者任务核对先修、术语、入口、代码片段、失败语义与练习；这是自有编辑复核，不冒充独立专家。综合脚本检查E00–E08顺序、reviewed/publish/日期、维护版本、练习、NOT_RUN和引用。25个官方来源URL（含同页不同锚点）：22个直接HTTP200；3个OWASP网页直接urllib收到403，但web工具可读，并额外通过OWASP官方GitHub原始文档HTTP200核对。Node发行文档HTML抓取不可用时使用对应v24.21.0官方源码文档，未假装所有原始网页直连成功。

第二个全新含空格目录npm ci --offline，test、frontend、backend、operations、build全部成功，锁及源码与维护目录逐字节相同。另移除资源owner读取条件、把所有路由都计入业务分母，原测试非零失败；恢复后24项再次成功。各批还独立注入原地修改state、删掉旧请求守卫、放宽revision、删除draining守卫；库内负面对照包含失效会话、越权写、弱标签/缺标签、坏输入、迁移ALTER后失败、强制退出及结构ok却缺bob行的备份。

关键结果：两次请求逆序完成只发布最新结果；旧revision返回412而数据不变；错误/超时分别500/504且日志无哨兵；关闭中新任务503、既有请求200、正常退出0，强制退出2绝不当成功；恢复两行owner/title/revision、访问隔离和新写入成功，live/snapshot不变；0流量unknown，1000/1预算恰为0，健康检查不稀释分母。

## 全站门禁

C最终内容与代码在干净安装根隔离目录受控同步，kb:verify、npm test PASS：76 notes（12导航+64教学正文）、357 Node测试/45 suites，Python桥内部另29项；检查器34项；105HTML/261构建产物。全部示例、恢复演练、tsc、链接/先修DAG、公开控制/禁发marker和故意泄漏检查通过。维护源码与隔离源码相等，既有锁无漂移。A/B分批也执行全套门禁。

可复现入口：例子README的npm ci/test/frontend/backend/operations/build；根按VALIDATION准备固定Node/JDK/Python和已登记包后运行npm run kb:verify、npm test。不会从任意Markdown提取执行命令。日志/tmp/engineering-[a|b|c]-independent.log、-mutant-*.log、-restored.log、-verify.log、-tests.log；总审计/tmp/engineering-final-audit.json、-sources.json、-entries.log；临时例子指针/tmp/kb-engineering-final-example.txt，根/tmp/kb-h3b-path.txt。临时失效按README重建，不改全局解释器。

## 发布回执

| 批次 | 完整SHA | Actions | 结果 |
| --- | --- | --- | --- |
| A | ee310d731146c22182c707cb72233b5095aaa68c | 34803663548 | 同SHA quality/Build/Deploy成功，5入口/30资源/索引97/404 |
| B | 5419d2689fea84c7c1e3a4079ba8eb7baf9d4cb0 | 34804170699 | 同SHA quality/Build/Deploy成功，8入口/30资源/索引100/404 |
| C | 6aa8fd9610d5a56badba17984322c5466b93aaea | 34804707349 | 同SHA quality/Build/Deploy成功，11入口/30资源/索引104/404 |

C作业回执：[{"name": "quality / verify", "status": "completed", "conclusion": "success", "sha": "6aa8fd9610d5a56badba17984322c5466b93aaea", "completed_at": "2026-09-14T04:06:32Z"}, {"name": "Build website", "status": "completed", "conclusion": "success", "sha": "6aa8fd9610d5a56badba17984322c5466b93aaea", "completed_at": "2026-09-14T04:07:11Z"}, {"name": "Deploy website", "status": "completed", "conclusion": "success", "sha": "6aa8fd9610d5a56badba17984322c5466b93aaea", "completed_at": "2026-09-14T04:07:22Z"}]。

本次收尾仅docs/reports台账，自身普通push后仍核对实际最终HEAD的同SHA Actions与HTTP；自身SHA不循环写回自己。恢复先检查实际HEAD，不能把上述正文SHA当最新部署。网站https://patricklfdm.github.io/knowledge-base/，新路线roadmaps/reliable-engineering。

## 完成范围与下一项

关闭H5-003A/B/C、H5-ENGINEERING-GATE及H5-003；父任务显式依赖综合门禁，BACKLOG唯一状态台账。H5三条既定主线现已完成，下一项H6-001分布式基础与故障实验，H6/H7尚未实施完。

浏览器挂载/交互/键盘/辅助技术/移动端/Profiler及H4/v1.0仍未验收。React前端用本地fixture，后端使用可信测试会话，不提供密码登录、Cookie、前后端认证接线、完整React生态或生产认证。进程实验只测试自身Node子进程；生产代理/容器/容量/云/付费服务/真实灾备未做。没有生产性能/RPO/RTO承诺，无其他项目、私密数据或真实token。以上边界不被单元测试成功覆盖。
