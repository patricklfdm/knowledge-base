# 课程与知识地图

## 三个入口与一份正文

- `content/topics/`：按领域保存概念、教程和操作笔记。
- `content/roadmaps/`：路线只引用正文，维护学习目标、顺序、先修与自测。
- `content/projects/` 和 `content/labs/`：场景、决策、实验与失败验证；链接通用正文。
- `content/reference/`：查阅入口，避免与概念正文重复维护同一套解释。

不创建没有正文的 topics 子目录。导航可以列未完成的目标，但用普通文字和明确“计划中”，不能链接到不存在的文件。链接目标按构建后的实际 URL 验证。

## 领域覆盖

| 领域目录 | 基础 → 中级 → 深入 | 典型证据或练习 |
| --- | --- | --- |
| 01-languages | JS/TS、Java、Python；语法、函数、模块、异常、类型 → 异步/并发 → 运行时与性能 | 数据转换、边界校验、并发小实验 |
| 02-foundations-tools | 命令行、Git、调试；结构与复杂度 → 进程/线程/内存/I/O → 系统测量 | 调试一个错误，解释复杂度和资源开销 |
| 03-web | 浏览器/服务端、HTTP、DNS、TLS → Cookie/Session/CORS/缓存 → 协议与故障 | DevTools 请求观察，失败状态和缓存验证 |
| 04-frontend | HTML/CSS/DOM/可访问性 → React、状态、路由、表单 → 渲染、性能、组件体系 | 键盘表单、请求状态、取消/竞态、可访问性检查 |
| 05-backend | API/校验/业务模型 → 认证授权、分页、文件/任务 → 边界、限流与实时通信 | 不合法请求、越权测试、任务生命周期 |
| 06-data-storage | SQL/建模/约束 → 索引/事务/缓存 → 存储日志、恢复、并发控制 | EXPLAIN、冲突实验、缓存一致性、恢复演练 |
| 07-engineering | 测试、模块、Git/构建 → 契约、迁移、重构、CI/CD → 兼容/发布/设计取舍 | 回归用例、兼容性、可回滚变更 |
| 08-production | 容器/配置/部署 → 可观测性/安全/备份 → 容量/成本/SLO/事故 | 故障发现、定位、恢复和事后复盘 |
| 09-distributed | 网络故障/时钟/重试 → 幂等/消息/复制/分片 → 一致性/共识/事务/背压 | 断连、重复投递、崩溃和重放实验 |
| 10-data-engineering | 分析模型/批处理 → 流处理/分区/列存 → 湖仓/质量/血缘/事件时间 | 小规模采集处理分析，迟到/重复/重放 |
| 11-search-ai | 索引/召回/排序 → BM25/向量/混合/LLM → 评估/编排/成本/安全 | 离线评价集、规则基线、失败与降级 |

技术名词不是学习前提。每条路线在使用前引入必要概念。不要把学习路径强制线性化为“前端低级、分布式高级”；前端和数据都可以有独立的深入分支。

## 能力级别

L0：能写、运行和调试小程序。L1：能打通页面/API/数据。L2：能测试、维护与部署应用。L3：能解释并处理安全、性能、可观测性和恢复。L4：能给出跨节点故障假设并验证保证。L5：能建设数据处理闭环并处理质量、重放与资源效率。

测试、安全、错误处理贯穿所有级别。文章难度独立于语言目录；Java 变量是 L0，Java 内存模型不是 L0。

## 语言安排

第一主线 JS/TS + SQL；第二主线 Java 与系统；第三主线 Python 与数据/AI。Go、Rust、C/C++ 作为有明确学习收益时的后续扩展，不以学完所有语言作为做项目的前提。

## 首个教学项目：Trip Ledger

这是独立教学用“行程清单”，不是生产旅行平台。使用合成数据；不请求真实地图、预订或付费 LLM。

最小能力：创建、列表、修改行程条目；名称和天数校验；持久化；可理解的错误反馈；测试；可重启部署和冒烟验证。不要求登录、多人协作或复杂行程优化，认证授权留到下一条路线。

首条路线实际采用JS/TS + 最小Node后端 + SQLite；原PostgreSQL推荐留后续数据库服务/并发专题，当前不冒称PostgreSQL验收。初始浏览器层用 HTML/CSS/DOM 降低隐式门槛，React 放到下一步重构专题；具体轻量库由 Codex 在验证兼容性后记录选择，不套用 Wayvia 的架构。

整合示例代码实际位于 `examples/trip-app/`（早期trip-ledger为规划名，未创建重复项目），不在 `content/` 部署服务器源码。配置、依赖和测试与 Quartz 隔离，不把 root npm scripts 或 tsconfig 随意扩展成多个项目混合构建。

GitHub Pages 是静态托管平台，参见 [官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。在本项目中它只负责知识网站和可选静态演示，不能运行 Node API 或 PostgreSQL。教程的服务端部署先用本机隔离容器/进程验证；公网后端、付费云资源另行授权。不得声称“部署到 Pages 后数据库就能运行”。

## 样板路线的顺序规划

保留现有 fullstack-foundations 的 10 个目标，补齐下列先修桥接。下列编号是规划编号，不是必须创建同名空文件。

| 顺序 | 核心问题 | 先修 | 可观察成果 |
| --- | --- | --- | --- |
| F00 | 如何运行并观察第一个程序？ | 无 | 安装/版本检查、运行、打印、定位一处错误 |
| F01 | 值、变量和类型分别是什么？ | F00 | 预测表达式并用实际结果解释 |
| F02 | 如何用条件与函数表达一个规则？ | F01 | 封装校验；覆盖合法与不合法输入 |
| F03 | 对象和数组怎样表达行程？ | F02 | 创建、查找、更新数据；解释引用与复制 |
| F04 | 程序如何拆分，失败如何传递？ | F02–03 | 模块 import/export、throw/catch、边界 |
| F05 | 异步任务为什么不能当同步代码？ | F04 | Promise/await 的顺序、拒绝与处理 |
| F06 | 类型能保证外部输入安全吗？ | F01–05、必要 TS 语法桥接 | 类型/断言/unknown/运行时校验区分 |
| F07A | HTML/CSS/DOM 如何变成可操作页面？ | F06（沿既有路线） | 结构、样式、选择器、事件、纯文本更新 |
| F07B | 表单如何把操作变成数据？ | F07A | label/name、提交、文字转换、错误反馈；页面网络加载状态留 F11（HTTP失败层次见F08） |
| F08A | 一次 HTTP 请求里传了什么？ | F05、F07B | 方法、URL、headers、JSON、状态码 |
| F08B | 为什么fetch没抛错，请求却失败了？ | F08A | HTTP状态、断连、JSON解析、正文消费与业务合法性 |
| F09A | 怎样让POST真正创建行程？ | F08B（沿路线含F06） | 路由、201/Location、创建/读取、内存生命周期 |
| F09B | 请求该在什么边界被拒绝？ | F09A | 媒体/字节/UTF-8/JSON/业务规则，失败无写入 |
| F10A | SQL怎样保存行程？ | F09B（沿路线含F03） | 表、写入/查询、文件与新进程读取 |
| F10B | 参数绑定和约束分别保护什么？ | F10A | 值与结构、STRICT转换、约束失败、旧表不自动迁移 |
| F11A | 接口怎样连接SQLite？ | F10B | 创建/列表/修改、非法无副作用、服务器进程重启 |
| F11B | 页面怎样反馈保存结果？ | F11A | 同源、busy/编辑状态、保存成功但刷新失败 |
| F12A | 如何证明修改没破坏旧功能？ | F11B | 单元/集成/进程与浏览器边界、回归断言 |
| F12B | 添加字段要改哪些层？ | F12A | 备注全链路、旧表迁移、事务回滚 |
| F13 | 怎样部署并确认服务健康？ | F11–12 | 配置、启动/停止、日志、重启和冒烟 |

F12 是系统归纳测试，不是第一次写测试；前面的例子从一开始就有断言或测试。

H2 优先 F00–F02 的三个连续样板。H3 按已测样板补余项，遇到前置概念过多就拆文章。每篇有一个主要问题，不把一篇“表单”塞成整本 HTML/CSS 教程。

## 后续路线的完成标准

全栈可维护：加入认证/授权、迁移、模块化、端到端测试、React 重构。生产可靠：观察超时/权限/部署失败与备份恢复。系统存储：Java/索引/快照/日志的孤立实验。分布式：在明确故障模型中验证重复与恢复。数据工程：小样本批流闭环、可重放、质量规则。AI：离线合成/公开数据集与 deterministic 基线，付费模型调用不是起步依赖。

Wayvia/GSE 案例只在另获读取授权后补充。每篇记录 repo/commit/实现状态/验证边界；未经核对只写“教学假设”，不能称为真实项目结果。

## H5已实现主线与剩余课程

Java、SQL与通用系统的H5-001范围已综合验收，唯一状态台账仍为BACKLOG。逐篇证据见reports/H5-java-completion.md及reports/H5-sql-systems-completion.md。Python H5-002也已完成（reports/H5-python-completion.md），H5-003工程纵深E00–E08也已综合验收（reports/H5-engineering-completion.md）。H5既定三条主线与H6两条有限主线完成；H7-001也已完成，H7-002维护机制也已完成，下一项集中UI验收，集中UI另有任务。

| 路线 | 已实现单元 | 正文入口与证据 |
| --- | --- | --- |
| SQL | F10基础两篇；S01–S08关系/事务/索引、连接/快照、查询分页/保存点/备份 | content/roadmaps/sql-foundations.md；examples/sql-trips，30组及6个demo入口 |
| Java | J00–J11编译/值/输入，对象/集合/接口，文件/打包/进程，并发/取消/测量 | content/roadmaps/java-foundations.md；examples/java-basics，34组及12个入口 |
| 通用系统 | Y01–Y06查找成本、进程、字节流、文件发布、日志/快照、缓存竞争 | content/roadmaps/systems-foundations.md；examples/systems-basics，16组及2个demo入口 |
| Python | P00–P08运行环境/语法/容器，类型/JSON/CSV，测试/迭代/综合汇总 | content/roadmaps/python-foundations.md；examples/python-basics，29项Python测试、四demo与CLI |

Java从F04基础衔接，系统的线程/共享内存/测量复用Java正文；SQL由F10递进到S08，再支撑系统恢复单元。每个单元带先修、来源、维护命令、失败观察和改变条件练习；不重复另一套语言侧线程教材。

这是核心语言与系统存储实验主线，不是所有产品生态：Spring/JDBC/JPMS/GC调优、PostgreSQL服务、分布式共识、生产备份平台不在本次完成范围。未读取GSE/Wayvia。浏览器按用户安排等H5–H7全部规划内容完成后集中验收，H4/v1.0仍不能标完成。

Python H5-002按plans/H5-PYTHON-completion.md连续三批完成P00–P08，提供完整先修、迁移练习和有界数据处理入口。第三方数值/分析库、分布式批流与AI留H6/H7；状态以BACKLOG为准。用户已在Python完成后确认继续下一部分，H5-003也按三批完成；H6-001六篇基础故障实验也已完成，H6-002也已完成，H7-001也已完成，H7-002已按维护报告完成，当前下一项集中UI验收。

H5-003完成React状态/请求代次/语义与成本，合成会话/资源授权/条件更新/迁移/观测，进程排空/新进程恢复/服务目标九篇。入口content/roadmaps/reliable-engineering.md；examples/reliable-app含24项测试、frontend/backend/operations与build。真实登录和前后端认证接线不在此有限实验，React浏览器/Profiler与生产环境NOT_RUN，不能由SSR或本机进程测试推导。

## 分布式基础H6-001

D00–D05已按两批完成未知结果/幂等/重试、发件箱重放/复制读取/fencing，入口content/roadmaps/distributed-foundations.md，证据reports/H6-distributed-completion.md。examples/distributed-lab有18项测试及requests/delivery入口；确定性模型和真实SQLite/子进程证据分别标注，未部署消息代理或共识集群。H6-002也已完成批流、迟到/重复/重放与质量规则，H6有限内容主线完成，集中UI仍延期。

## 数据工程H6-002

Q00–Q05按两批完成事件质量/分析粒度/批次发布、事件时间/检查点重放/补数对账，入口content/roadmaps/data-engineering-foundations.md，证据reports/H6-data-completion.md。examples/data-pipeline有33项Python测试和batch/stream/reconcile入口；单源有界模型、真实SQLite事务与进程退出、完整修正快照各有边界。没有实现无限流框架或生产数据平台；后续H7-001搜索与AI应用也已完成，使用合成数据、确定性规则基线及离线评估；H7-002已按维护报告完成，当前下一项集中UI验收。

## 搜索与AI应用H7-001

R00–R05按两批完成词元/倒排、排序、离线评估、上下文、输出契约和受限工作流。入口content/roadmaps/search-ai-foundations.md，例子examples/search-lab含31项Python测试和search/evaluate/context/workflow四入口；证据reports/H7-search-completion.md。未运行真实模型或付费API，抽取引用与受控adapter不冒称模型能力。H7-002维护机制也已完成，下一项集中UI验收，再按既定依赖集中UI验收。

## 内容维护H7-002

只读kb:review、来源/版本/到期复核、读者反馈入口与回执/BACKLOG关联已实现，证据reports/H7-maintenance.md。H5–H7既定内容全部完成；不是所有生态知识已写完。下一阶段集中UI按UI_ACCEPTANCE最多三目标执行，历史未验收和搜索问题保留。
