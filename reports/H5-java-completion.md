# Java 主线 J00–J11 综合验收

2026-09-13，patricklfdm/knowledge-base，既有v5。用户要求“Java部分整完再停”；按连续计划完成J03–J11九篇新增正文，加既有J00–J02，形成12篇Java主线。没有用导航页冒充教学文章，也没有移除其他路线任务来凑完成。

## 逐篇核验

作者在实现后另一次按读者任务重读12篇，核对先修、命令、失败预期、练习和结论边界；这是作者复核，不冒称独立专家。自动元数据/链接检查与阅读判断分别记录。J00从F04开始，J01–J11各依赖前一篇，路线完整连接。

| 正文 | 已运行的维护证据 | 改变条件的练习 |
| --- | --- | --- |
| [J00](../content/topics/01-languages/java-compile-and-run.md) | javac/java、中文与含空格参数、旧class、编译/主类错误 | 改源码不重编译，对照旧产物 |
| [J01](../content/topics/01-languages/java-values-and-operations.md) | 9行值/运算输出及非布尔条件编译失败 | 改变加数和cast位置 |
| [J02](../content/topics/01-languages/java-input-validation.md) | ASCII/表示范围/1–30规则、null、CLI和原值保留 | 改变业务上界并同步断言 |
| [J03](../content/topics/01-languages/java-objects-and-references.md) | 构造/非法修改、别名/copy/rebind及private编译失败 | 副本修改不能污染原行程 |
| [J04](../content/topics/01-languages/java-collections-and-copies.md) | 容器/元素共享、List.copyOf不可改、泛型和Map缺失/重复 | 同时分离元素与列表结构 |
| [J05](../content/topics/01-languages/java-interfaces-and-exceptions.md) | 接口实现替换、缺失出口、漏实现/受检异常编译失败 | 增加第三种Formatter |
| [J06](../content/topics/01-languages/java-files-and-resources.md) | UTF-8/列数/行号/资源所有权、主异常与suppressed | 第二行无效不能返回半列表 |
| [J07](../content/topics/01-languages/java-packages-and-jar.md) | 真实多包JAR、移除源码/class后启动、缺入口/依赖 | 移动包及遗漏依赖 |
| [J08](../content/topics/01-languages/java-process-and-memory.md) | 两个新JVM各为1、32MiB堆拒绝64MiB分配、无dump | 比较同一进程和两次启动 |
| [J09](../content/topics/01-languages/java-threads-and-shared-state.md) | 固定交错lost=1、锁内2000、线程结束与中断 | 跨字段不变量与锁的范围 |
| [J10](../content/topics/01-languages/java-tasks-and-cancellation.md) | 结果/异常、超时不完成、取消/中断/执行器终止 | cancel(false)加显式放行，测试检出变化 |
| [J11](../content/topics/01-languages/java-measurement-and-evidence.md) | 独立预期求和、溢出边界、错误校验值与5组样本 | int求和变体被真实边界断言检出 |

所有正文reviewed/publish，记录实际JDK与日期、官方来源、维护源码与运行命令，保留浏览器NOT_RUN。官方来源集中只读复核：24个去重页面HTTP 200，记录/tmp/java-route-audit.json。临时链接扫描第一次误把中文标点计入URL，修正临时脚本解析后通过；不是官方资料不可用，也没有执行资料中附加指令。

## 独立重现与故意失败

固定Microsoft OpenJDK21.0.11+10、Node24.21.0/npm11.19.0、macOS15.7.4/aarch64；没有改默认Java或用户配置。独立副本路径含空格，npm ci --ignore-scripts --offline成功。12个维护入口demo/values/input/objects/collections/contracts/files/package/process/threads/tasks/measure全部执行；input传3。input传31与contracts传missing均按预期退出2。

另在独立副本实跑两道迁移练习：去掉asLongStream导致超int求和断言失败；cancel(false)并在等待停止前打开放行门，实测Future已取消、工作未收到中断、池已终止，原取消测试失败。逐项恢复后全包34组PASS，副本与维护源码逐文件相等。日志/tmp/java-final-entries.log，副本指针/tmp/kb-java-final-example-path.txt。

每批故意错误也已检出：F把copy改为返回this、G把异常改成return staged、H把累计改成赋值1，各有2项失败，恢复后通过。详见[对象集合](H5-java-h5f.md)、[文件与运行时](H5-java-h5g.md)、[并发与测量](H5-java-h5h.md)。J00/J01–J02此前证据见[编译](H5-java-compile.md)、[值与输入](H5-java-input.md)。故障仅发生于自建副本。

J11原始五组样本保存在/tmp/h5h-independent.log与/tmp/java-final-entries.log，包含环境、规模、预热、轮数、顺序和校验值。正文只展示输出结构，不将本机纳秒差值扩成性能排序；CPU型号没有获得，不发表硬件可比结论。没有运行JMH、生产压测或外部业务操作。

## 全站门禁

H批完整隔离kb:verify及npm test PASS：46 notes（9导航、37教学）、34检查器、311 tests/45 suites、0 fail/skip；72 HTML/195产物。Java34组是显式测试，根自动发现还包括test-support加载项，不把加载项计成断言组。

总验收修正J00/J02早期测试数量口径、J01后续指向、首页与知识地图的Java范围。保持所有已测试源码/工作流/manifest不变；重新执行最终kb:verify（内容、全部示例、检查器故障夹具、recovery、tsc、构建、产物链接、禁发过滤与注入泄漏），日志/tmp/java-final-verify.log。原311项回归证据在/tmp/h5h-tests.log；最终CI仍针对实际提交完整运行。根隔离指针/tmp/kb-h3b-path.txt，所有锁文件无漂移。

## 发布检查点与范围

F的681bec6、G的43c9130已普通push并取得同SHA质量/构建/Pages成功及HTTP证据。H提交7e20ab3ac512b071a6337f06a675214d4f0a3ca9已普通push origin/v5，Actions 34789387292同SHA quality/Build/Deploy全部success，分别完成于2026-09-13T23:21:58Z、23:22:33Z、23:22:44Z。HTTP主页、路线、12篇全部200，30项资源200，索引71项含完整Java路线，缺页404；日志/tmp/java-content-http-corrected.log。首次临时检查残留两个规划期slug导致404，按实际正文/产物修正后通过；没有把404写成部署成功。浏览器仍NOT_RUN。

本总验收及文字收尾的最终kb:verify已经通过，源码与隔离副本逐文件相等、可执行文件与H回归提交一致；待本收尾提交普通推送和同SHA验证后封存GATE。BACKLOG是唯一台账。

本主线的范围是核心语言到文件/打包、运行时、并发与测量。Spring、JDBC、JPMS和GC调优未包含；SQL/通用系统、Python、前后端进阶、H6/H7仍各有待办。H4/UI与v1.0不因Java完成而通过；浏览器按用户要求等全部规划内容完成后集中执行，未连接、安装、截图或重试。没有记录个人学习掌握情况，没有读取GSE/Wayvia。
