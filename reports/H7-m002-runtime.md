# H7-M002 Python / Java补丁兼容性

## 基线、范围与决定

2026-09-14，Codex执行，基线81ed3780d9a1a3622c351b7307051aa718a060fa；patricklfdm/knowledge-base既有v5干净。H7-M001已完成，承接用户“下一轮”。初始kb:check通过98笔记，kb:review为0候选/248外链/5观测/120未比较环境。

本轮在独立环境验证CPython3.13.15和Microsoft OpenJDK21.0.12.1+1。旧正文和CI仍有CPython3.13.0/JDK21.0.11的明确复现证据，因此保留原examples版本文件，增加`npm run kb:runtime-compat`与单独必需CI job。该选择保留读者按旧命令重现的能力，并持续检查后续补丁；不是拒绝新补丁或推荐旧版本用于生产。没有升级Node/npm/Quartz/第三方库，也没有替换系统Python/JDK。未来整体切换基线需逐篇审阅，不能用批量替换日期代替。

## 官方来源与运行时准备

于2026-09-14读取[Python3.13.15发布页](https://www.python.org/downloads/release/python-31315/)、[Python构建配置](https://docs.python.org/3.13/using/configure.html)、[Microsoft下载页](https://learn.microsoft.com/en-us/java/openjdk/download)、[发行说明](https://learn.microsoft.com/en-us/java/openjdk/release-notes)。前者列2026-08-05维护版；后者列21.0.12.1。校验后的实际二进制输出优先于网页推测。

归档仅下载到自建`kb-m002-runtimes-*`临时目录，先比对发布者SHA256再解包；CPython用tarfile的data过滤，未运行系统安装器。实际摘要：

| 归档 | 官方入口 | SHA256 |
| --- | --- | --- |
| CPython源码tgz，30106468字节 | https://www.python.org/ftp/python/3.13.15/Python-3.13.15.tgz | c28d9d213c09b5b5ab2c29812950e12f746999e099b82894231be954b26baed9 |
| Microsoft macOS arm64，200089913字节 | https://aka.ms/download-jdk/microsoft-jdk-21.0.12.1-macos-aarch64.tar.gz | 6704f1372a02fabcc9e1efec84f63fcf4d9c1c904e2b8e29b04bed2fb62f7e6e |
| Microsoft Linux x64 CI归档 | https://aka.ms/download-jdk/microsoft-jdk-21.0.12.1-linux-x64.tar.gz | 4c0c7f5cd0b6bb81109d01f13a1678ee0f73f36c1020080d97c4de3ce3cac207 |

Python源码在该目录configure独立prefix、without-ensurepip、with-openssl指向既有Homebrew库，make -j4与make altinstall均成功；无sudo、无全局安装。实际CPython3.13.15、Clang16.0.0、macOS15.7 arm64，SQLite3.47.1、OpenSSL3.6.3。可选_gdbm/_lzma/_tkinter未构建；课程测试未使用它们，不能把此构建当作完整官方安装器或全部标准库认证。JDK java/javac/jar均报告21.0.12.1，java完整构建为Microsoft21.0.12.1+1-LTS。根编排Node24.21.0/npm11.19.0。

临时下载/编译回执：/tmp/kb-m002-runtime-root.txt所指目录receipt.json；/tmp/m002-python-configure.log、make.log、install.log。官方SHA256校验不等于本轮验证了Sigstore/GPG签名。

## 三个实际失败与修正

1. **四段Java版本漏报。** 新增夹具将tested_with设为21.0.12.1+1，旧review把它放到unCompared，runtime候选为空。新断言实际退出1；修正为明确支持Java三段/四段数字版本，含第四段参与比较；固定版本同样允许四段。Node/Python仍三段，五段/EA/带构建号的固定文件不在支持内。新测试分别覆盖不匹配、相同、第四段差异及非法固定值；11项review测试恢复通过。依据[Runtime.Version](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runtime.Version.html)区分数字版本、PATCH与构建信息，不宣称实现全部Java版本语法。
2. **Python venv预期硬编码。** 真实3.13.15创建的venv报告[3,13,15]，原测试写死[3,13,0]导致唯一失败。改为从该测试副本的.python-version读取期望，仍断言处于venv、子解释器版本准确。首次失败/tmp/m002-compat.log；修复后Python基础29、数据工程33、搜索31项通过。
3. **Java测量环境预期硬编码。** 新JDK测量输出java=21.0.12.1+1-LTS，原正则固定21.0.11，34组中33通过、1失败。改为从.java-version核对实际输出的数字版本，其他环境/样本/校验值断言保持。首次失败/tmp/m002-compat-after.log；修复后Java34组全部通过，/tmp/m002-compat-final.log。

没有修改教学业务算法来迁就测试。最初的版本不匹配拒绝是预期行为，与上述测试/工具缺陷分开记数。

## 新检查与CI

已实现`scripts/knowledge-base/runtime-compat.mjs`，版本来源maintenance/runtimes两文件。先验证真实CPython实现/精确版本、Microsoft JDK版本；复制四个受维护示例到自建目录，拒绝符号链接，忽略node_modules/venv缓存。每包先以原版本文件证明新环境被拒绝，再仅改副本版本并执行全部维护测试；测试失败/缺环境/无测试/超时均失败，finally清理副本。没有从Markdown任意提取命令，也不提供跳过版本守卫参数。

原`kb:verify`仍用旧固定环境；新命令显式要求新环境，二者不能在同一个shell混淆。可复用workflow新增Patch runtime compatibility job，发布的quality依赖涵盖两个必需job。测试覆盖删除job、continue-on-error、忽略失败、浮动Python版本和遗漏归档校验。

只读核对[setup-java Microsoft安装代码](https://github.com/actions/setup-java/blob/v6/src/distributions/microsoft/installer.ts)及其实际请求的[官方安装目录](https://aka.ms/download-jdk/microsoft-openjdk-versions.json)，目录21系列当时最高列21.0.11，未列21.0.12.1。因此新job从官方精确URL下载Linux x64包，用仓库固定SHA256校验后解包到runner临时目录，以KB_JAVA_HOME仅供该job使用；不修改原verify的setup-java配置。首次误用简写.sha256地址返回HTML，未将其作为校验值；随后从官方页面提取准确.sha256sum.txt并验证64位摘要，归档校验在CI实际执行。没有把下载可达或本机arm64结果当作Linux已通过。

## 内容复核与门禁

只更新P00/J00两篇入口，补充新补丁测试范围、版本号语义和新命令；旧verified_on/tested_with与其他文章历史证据保持。作者自审后再次按读者任务阅读：原命令选择原版本；兼容性命令需要两种新运行时；成功不能推广到其他JDK构建、库、OS或用户掌握情况。Windows、安装器UI、真实屏幕阅读器、第三方库、生产性能和完整安全审计均NOT_RUN。站点表现层未改，正文发布阅读另作抽查。

本地旧基线隔离`npm run kb:verify`和`npm test`通过：398 Node/45 suites、49检查器、Python29+33+31、98笔记、251外链、133 HTML/318产物；公开过滤与注入泄漏检出通过。日志/tmp/m002-verify.log和/tmp/m002-tests.log。复用之前干净安装且依赖/锁未变的隔离根，受控同步源码；根package.json仅添加脚本，没有新依赖。

独立副本删除Java第四段解析，新测试实际AssertionError/退出1（/tmp/m002-mutant-fourth.log）；独立副本将Python天数校验改为接受bool，新兼容性命令实际失败（/tmp/m002-mutant-compat.log）。恢复两处字节后新环境完整兼容性重新通过（/tmp/m002-restored-compat.log），最后逐字比较受控源码与锁/82篇verified_on无漂移。未把两个桥接计数与其承载的Python用例重复相加。

普通push提交bb3d054fbbaef0d0f7a4b7886ab7d744b8ee86a7，[Actions34892498528](https://github.com/patricklfdm/knowledge-base/actions/runs/34892498528)同SHA结果：旧verify success（20:24:56 UTC）、Patch runtime compatibility success（20:23:53）、Build success（20:25:41）、Deploy success（20:26:03）。新Linux x64归档实际下载/固定SHA校验、两种补丁运行时测试与原源码无修改检查均由必需job通过；未将该环境未读取的SQLite/编译器版本套用为本机数值。

HTTP7入口/31 CSS-JS资源200、索引132包含修改页、缺失页404通过，日志/tmp/m002-http.log。真实In-app Browser读到两篇新增段落与完整npm run kb:runtime-compat，390视口两页documentWidth均390；P00上一轮修正的__name__依然完整。仅正文阅读抽查，不扩大到安装器/教学应用UI；标签关闭、视口reset，未保存截图文件。

H7-M002验收完成，后续H7-M003分诊既有依赖PR。最终工程记录提交仍须按最新HEAD自身SHA核对部署，不能以本文功能提交替代未知后续SHA。运行时目录为后续验证保留，本轮无常驻服务；临时源码副本由命令清理。恢复从本计划、Git实际HEAD和Actions继续，不能用旧SHA成功替代当前批次。
