# H5-001D：Java源码、编译与运行

2026-09-13，接续H5-001C已验证SQL批次。实际本机有Microsoft OpenJDK21.0.12+8，默认另有22；使用KB_JAVA_HOME命令级路径，CI安装同一21.0.12版本，不改全局选择。

## 有界交付

一篇J00，解释.java→javac→.class→java/JVM，public class/main、输出与最小命令行参数；用类型错、找不到主类、缺main和未重新编译的旧class作对照。新增独立无npm/Java库依赖examples/java-basics；Node仅为现有测试入口编排javac/java，不以Node模拟Java。新Java路线引用实际正文。

- [x] Java源、临时编译/运行工具、编译失败/启动失败/旧class与重新编译测试。
- [x] 同版本JDK接入必需CI与根示例门禁，遗漏/版本/顺序负面测试。
- [x] 一篇正文与独立运行/练习/来源/两次阅读复核。
- [x] 完整隔离安装/门禁/锁/范围、报告/台账/STATE、自动push同SHA部署。

## 实现约束与恢复

本机复用已安装JDK，不下载或修改用户全局配置；新包的.java-version固定21.0.12。JDK为新增测试环境要求，须更新README与VALIDATION，不能让CI缺Java却跳过测试。根框架依赖不升级，不加Maven/Gradle/Spring等隐式先修。

编译产物和负面源码只写自建临时目录，stdout/退出码与编译错误实际验证，所有运行设置超时并清理。浏览器仍不运行；不读GSE/Wayvia。完成后Java对象/集合与错误边界另设后续单元，H5父项不提前完成。

本地结果：六组Java实跑，故意days4检出4失败；独立npm ci锁不变，手工编译/启动可重现。完整门禁282 tests/35 notes/61 HTML/173产物PASS；新包无依赖，根锁不变。报告reports/H5-java-compile.md，待普通push同SHA CI/Pages/HTTP后补齐最终步骤；下一项H5-001E。

CI实证发现：8c737ac的Actions34785309277在setup-java阶段FAIL，Microsoft发现目录最高21.0.11，无法解析21.0.12；构建/部署正确跳过。保留失败，不放宽版本检查或跳过Java。改用目录已列出的固定21.0.11，在自建临时目录下载官方macOS归档并核对官方SHA256后重新验证；不修改用户已有21.0.12或默认22。此前“不下载”是初始实现选择，因远端真实失败调整为仅临时隔离运行时。后续README/版本文件/正文同步21.0.11，历史21.0.12本地证据保留在报告。

修复本地复验PASS：JDK21.0.11+10临时归档SHA256核对，七组Java（含版本错误拒绝）、独立安装/演示与故意days4检出4失败，完整283 tests/35 notes/61 HTML/173产物通过，原锁不变。等待修复提交同SHA远端复核，不重试已知缺版本的旧SHA。

最终结果：540ededb17733b9e8a372fceb0ea5bb5dab384f7的Actions34785541297三必需job成功，HTTP正文/实际资源/索引/404通过。使用固定21.0.11的七组Java和完整283项验证，当前任务完成；恢复从BACKLOG H5-001E继续。初次21.0.12远端发现失败保留报告，不追认成功。
