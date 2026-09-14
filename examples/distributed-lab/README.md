# 分布式故障实验

固定Node24.21.0/npm11.19.0，内置SQLite3.53.4，无第三方依赖。仓库根：

```sh
npm ci --prefix examples/distributed-lab
npm test --prefix examples/distributed-lab
npm run requests --prefix examples/distributed-lab
```

可将本目录复制到自己的新临时目录独立npm ci/test。不依赖根包；不要用用户既有数据库。请求模型只是明确丢请求/丢响应，不启动网络。requests输出两次尝试、一行业务、原创建结果、模型等待5；不是实测耗时。9项测试涵盖未知结果、重复对照、意图/owner、事务半失败、连接重开、错误分类、次数/预算/随机边界。

ledger仅创建专用示例schema，不是迁移任意旧库的工具。owner是可信合成身份，回执永久保留；保证只在同一SQLite事务内，外部副作用不回滚。retry要求operation自己遵守remainingMs，不能中止挂起操作；now必须单调、sleep推进对应时钟。没有生产SDK/集群或真实HTTP故障注入。

下一批扩展真实子进程投递和恢复，以及复制/写入防护模型。浏览器与生产验证NOT_RUN。
