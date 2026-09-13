# H5-001D：Java源码、编译与运行

2026-09-13，接续H5-001C已验证SQL批次。实际本机有Microsoft OpenJDK21.0.12+8，默认另有22；使用KB_JAVA_HOME命令级路径，CI安装同一21.0.12版本，不改全局选择。

## 有界交付

一篇J00，解释.java→javac→.class→java/JVM，public class/main、输出与最小命令行参数；用类型错、找不到主类、缺main和未重新编译的旧class作对照。新增独立无npm/Java库依赖examples/java-basics；Node仅为现有测试入口编排javac/java，不以Node模拟Java。新Java路线引用实际正文。

- [x] Java源、临时编译/运行工具、编译失败/启动失败/旧class与重新编译测试。
- [x] 同版本JDK接入必需CI与根示例门禁，遗漏/版本/顺序负面测试。
- [x] 一篇正文与独立运行/练习/来源/两次阅读复核。
- [ ] 完整隔离安装/门禁/锁/范围、报告/台账/STATE、自动push同SHA部署。

## 实现约束与恢复

本机复用已安装JDK，不下载或修改用户全局配置；新包的.java-version固定21.0.12。JDK为新增测试环境要求，须更新README与VALIDATION，不能让CI缺Java却跳过测试。根框架依赖不升级，不加Maven/Gradle/Spring等隐式先修。

编译产物和负面源码只写自建临时目录，stdout/退出码与编译错误实际验证，所有运行设置超时并清理。浏览器仍不运行；不读GSE/Wayvia。完成后Java对象/集合与错误边界另设后续单元，H5父项不提前完成。

本地结果：六组Java实跑，故意days4检出4失败；独立npm ci锁不变，手工编译/启动可重现。完整门禁282 tests/35 notes/61 HTML/173产物PASS；新包无依赖，根锁不变。报告reports/H5-java-compile.md，待普通push同SHA CI/Pages/HTTP后补齐最终步骤；下一项H5-001E。
