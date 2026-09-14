# H5-003B 工程纵深验收

2026-09-13本地，patricklfdm/knowledge-base既有v5；基线ee310d731146c22182c707cb72233b5095aaa68c。按H5-ENGINEERING-completion连续三批计划，自动普通push、浏览器后移保持。

## 交付和复核

E03会话与资源授权、E04条件更新/迁移、E05日志与等待预算三篇；后端新增8项（总17项）覆盖真实HTTP读写、401/404/412/428、输入拒绝、事务回滚、500/504与日志白名单。独立故意放宽revision相等条件被原412断言检出。

作者自审后另按读者任务重读：先修/术语、维护命令与代码对应、故障现象和解释、改变条件练习、实际验证边界。官方文档在线核对并邻近引用，不冒称独立专家。React真实挂载/Effect/焦点/键盘/辅助技术/Profiler、手机阅读均NOT_RUN，SSR/控制器/构建不是UI通过；G7按用户延期，不把H4或v1.0标完成。

## 实际验证

Node24.21.0/npm11.19.0、React/ReactDOM19.3.0、esbuild0.27.2、SQLite3.53.4、macOS arm64。既有Java21.0.11+10和Python3.13.0保持命令级选择。

独立含空格目录npm ci --offline、例子17项测试、本批demo与真实bundle构建PASS。注入故意错误使原断言非零退出，恢复原字节后再次PASS，维护源码与独立副本相等，锁文件安装前后相等。示例安装/锁/登记有CI故障夹具；不从正文提取执行任意命令。

根已干净安装隔离目录受控同步，kb:verify与npm test全PASS：73 notes、350项Node测试/45 suites；Python桥另29项。检查器34项、全部维护例子、recovery、tsc、构建101HTML/253产物、公开内容/禁发marker与注入泄漏检测通过。验证代码与工作源码相等；根依赖未升级、既有锁无漂移。

日志/tmp/engineering-b-independent.log、-mutant-*.log、-restored.log、-verify.log、-tests.log；独立指针/tmp/kb-engineering-b-example.txt，根/tmp/kb-h3b-path.txt。临时失效按例子README重建。只用合成数据及自己临时文件/本机端口，无浏览器/云/生产操作。

## 发布检查点

本地门禁完成，待本批普通push后核对同SHA质量/Build/Deploy与HTTP，并将回执追加下一批记录。恢复先核对实际Git与HEAD，不把基线当发布SHA；继续计划，不逐篇等确认。

发布回执：5419d2689fea84c7c1e3a4079ba8eb7baf9d4cb0普通push；Actions34804170699同SHA quality/verify、Build、Deploy均success（2026-09-14T03:56:56Z/03:57:40Z/03:57:52Z）。HTTP8入口、30资源200，索引100含全部前六篇，缺页404；日志/tmp/engineering-b-http.log。
