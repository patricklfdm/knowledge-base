# H5-001D：Java 编译运行入门验收

2026-09-13，基线ae13eb6a477af98ed350d1b1c519b73acb4eeb99，patricklfdm/knowledge-base v5，既有SQL批次已发布。当前实现由本轮接续写入，没有用户改动被覆盖。内容优先、浏览器内容完成后集中验收、自动普通push授权继续。

## 交付与验证

新增J00一篇与Java导航路线，首页/地图入口；独立examples/java-basics包含真实Java源码、Node编排工具、CLI与六组测试。根门禁显式接入，CI在验证前安装microsoft JDK，.java-version固定21.0.12；新增manifest/lock/version漂移检查及遗漏/安装顺序/额外版本覆盖负面用例。README、验证与恢复手册补齐JDK前提。修正SQL路线表格中意外空行，使S04/S05仍属于同一表格。

实际本机Microsoft OpenJDK21.0.12+8、Node24.21.0/npm11.19.0、macOS arm64。命令级KB_JAVA_HOME选择既有安装，不改全局JAVA_HOME或PATH配置，不安装JDK、不读取GSE。独立含空格目录npm ci --ignore-scripts --offline、npm test、npm run demo通过，无npm库/Java库依赖。实际手工`javac -encoding UTF-8 --release 21 -d`临时目录与java -cp命令得到默认山城3天、参数海湾 城3天。

六组测试验证类文件生成、参数、类型错误、公开类文件名不匹配、错类路径/类名、缺main、旧class/重编译/失败编译保留旧产物，以及CLI、清理和缺运行时明确失败。子进程超时且隔离语言/附加Java选项，不以Node模拟语言。独立副本将days3故意改成4后4项失败、退出1；恢复后逐文件一致，锁未变。编译产物只在自建临时目录并已清理。

根依赖未变化；复用本会话已干净安装的隔离副本，受控同步源文件，新无依赖Java包另外干净npm ci。使用固定JDK运行kb:verify与npm test均PASS：35 notes=9导航+26教材、34检查器、282 tests/45 suites、0 fail/skip；全部八包、普通revert隔离演练、tsc、正式构建、61 HTML/173产物、公开对照/三个禁发marker及故意泄漏检出通过。受测试源码、工作流与提交源逐文件相等，原锁文件无差异；新Java锁只含自身包，无依赖树扩张。

日志/tmp/h5d-verify.log、/tmp/h5d-tests.log、/tmp/kb-h5d-mutant.log；独立副本指针/tmp/kb-h5d-example-path.txt、根隔离指针/tmp/kb-h3b-path.txt。临时证据失效可按维护命令重现。

## 内容复核与边界

在线核对Oracle Java21 javac/java手册及actions/setup-java官方仓库，选用当前v6和java-version-file。先作者自审，再独立按读者任务重读并实跑手工命令：只会已有JS变量/数组的读者需理解main、条件表达式、类路径及编译退出码；正文逐一解释。特别保留源文件启动模式存在、失败编译不会自动删除本例旧class、编译成功不保证有main等反例。没有虚构独立专家或把测试数量当学习掌握。

未覆盖对象/集合/输入合法性、包/JAR/大型增量构建、Windows或生产运行。G7/浏览器/真实交互仍NOT_RUN：用户批准内容建设完成后集中验收；静态DOM自动检查不等于真实浏览器。历史UI/环境/上游格式问题保留，H4/v1.0与H5父项未完成。

## 发布与下一项

本地适用验收已完成；按持续授权普通push既有origin/v5并跟踪同SHA必需CI、Pages及HTTP。推送前云端Java验收仍pending，不能用本机成功替代；发布结果随后补记。下一项H5-001E：Java值、类型与输入校验的有界单元，复用当前独立例子，不引入框架。
