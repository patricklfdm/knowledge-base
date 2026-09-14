# 通用系统隔离例子

固定Node24.21.0/npm11.19.0，无第三方依赖。仓库根运行：

```sh
npm ci --prefix examples/systems-basics
npm run basics --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

basics演示查找probe、子进程cwd/env/stdin/stdout/退出与字节流解码/背压。8组显式测试含空/单项/重复查找、准备副本、实际操作次数、字面参数、非零退出、部分协议、超时、UTF-8所有切分、坏尾部/超限/目标失败与drain。输出数据只来自自建文件，Node子进程使用显式环境和参数数组，不经shell；超时模式不忽略终止信号，没有孙进程。调用者不传个人目录。

独立副本把search.mjs的hi=mid改成hi=mid−1，原边界测试须失败，再恢复。排序不在每次查询中进行，probe不是CPU时长；TextDecoder开启fatal，末尾必须flush。collect示例有总字节上限，不能当作无限输入的恒定内存管线。

根kb:examples和npm test已纳入本包；CI显式安装本包并检查manifest/lock，遗漏安装或锁保护的负面夹具必须失败。Java与其他包仍完整执行，不改变Quartz类型范围或根依赖。测试只清理自建资源；浏览器NOT_RUN，等待全部规划内容完成后统一验收。
