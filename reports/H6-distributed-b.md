# H6-001B 分布式基础验收

2026-09-13本地，patricklfdm/knowledge-base既有v5；基线b5cec10abc61a259305695b241e46e5fe84687bb。按H6-DISTRIBUTED-completion连续两批计划，自动普通push、浏览器后移保持。

## 交付和复核

D03事务发件箱/消费去重，D04复制进度/会话读取，D05租约与fencing；新增9项（总18项）及delivery入口。真实子进程在消费前/消费提交后退出31/32，重放效果1且待发0。独立删除minimum守卫被检出；总验收另破坏epoch比较和回滚行为均失败，恢复后18项通过；六篇10官方来源HTTP200。

作者自审后另按读者任务重读：先修/术语、维护命令与代码对应、故障现象和解释、改变条件练习、实际验证边界。官方文档在线核对并邻近引用，不冒称独立专家。浏览器/手机阅读与真实网络集群均NOT_RUN，确定性故障模型不等同真实网络行为；G7按用户延期，不把H4或v1.0标完成。

## 实际验证

Node24.21.0/npm11.19.0、SQLite3.53.4、macOS arm64。既有Java21.0.11+10和Python3.13.0保持命令级选择。

独立含空格目录npm ci --offline、例子18项测试、本批demoPASS。注入故意错误使原断言非零退出，恢复原字节后再次PASS，维护源码与独立副本相等，锁文件安装前后相等。示例安装/锁/登记有CI故障夹具；不从正文提取执行任意命令。

根已干净安装隔离目录受控同步，kb:verify与npm test全PASS：83 notes、375项Node测试/45 suites；Python桥另29项。检查器34项、全部维护例子、recovery、tsc、构建114HTML/279产物、公开内容/禁发marker与注入泄漏检测通过。验证代码与工作源码相等；根依赖未升级、既有锁无漂移。

日志/tmp/distributed-b-independent.log、-mutant-*.log、-restored.log、-verify.log、-tests.log；独立指针/tmp/kb-distributed-b-example.txt，根/tmp/kb-h3b-path.txt。临时失效按例子README重建。只用合成数据及自己临时文件/本机端口，无浏览器/云/生产操作。

## 发布检查点

本地门禁完成，待本批普通push后核对同SHA质量/Build/Deploy与HTTP，并将回执追加下一批记录。恢复先核对实际Git与HEAD，不把基线当发布SHA；继续计划，不逐篇等确认。

发布回执：14b371039a8997c00ad0d20a67deee830d081c49普通push；Actions34806631218同SHA quality/Build/Deploy均success。HTTP8入口/30资源200、索引113、缺页404通过，日志/tmp/distributed-b-http.log，时间见综合报告。
