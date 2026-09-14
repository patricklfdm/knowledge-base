# 补丁兼容性运行环境

原examples版本文件用于重现历史验收：CPython3.13.0 / Microsoft JDK21.0.11。此目录另固定CPython3.13.15 / Microsoft JDK21.0.12.1，检查同一份维护例子在后续补丁是否仍通过。不是操作系统安装器，不把历史版本称作生产部署建议。

先在自己管理的独立目录准备指定解释器和JDK，再在仓库根运行；占位路径必须替换，命令仅在本次进程生效：

```sh
KB_PYTHON="/path/to/python3.13" KB_JAVA_HOME="/path/to/jdk21" npm run kb:runtime-compat
```

无需额外npm/Python/Java库。新命令验证CPython实现/精确版本和Microsoft JDK数字版本，复制python-basics、data-pipeline、search-lab、java-basics到自建临时目录；拒绝源符号链接，忽略node_modules/venv缓存。先证明原版本文件拒绝新运行时，再只修改副本版本文件并执行维护测试；异常与失败非零，finally清理副本。它不自动安装环境，不操作用户数据。

本机官方源构建CPython3.13.15与官方Microsoft21.0.12.1+1 macOS arm64归档已实跑。版本比较不冒充完整构建/供应商兼容性证明；OS/SQLite/编译器信息、校验摘要和故障恢复证据见[H7-M002报告](../../../../reports/H7-m002-runtime.md)。所有旧verified_on保持，正文仅两篇入口增加补验证据。

CI的原verify仍使用历史版本，另一个必需job使用本目录Python版本。Microsoft的setup-java安装目录当时未列21.0.12.1，故从官方精确URL下载Linux x64包，使用`microsoft-linux-x64.sha256`固定散列、校验成功后再解包到runner临时目录，设置该job的KB_JAVA_HOME。不使用浮动latest，不关闭现有门禁；真实同SHA远端结果另见报告。checksum更新必须重新核对厂商对应归档，不能根据下载到的任意文件自行生成期望值。

本轮不包含Windows、其他JDK/Python构建、第三方库或生产性能/安全认证。未来迁移历史基线应作为独立任务逐篇审阅命令与证据；兼容性检查通过不自动改写原版本文件、tested_with或核验日期。
