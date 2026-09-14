# 分布式故障实验

固定Node24.21.0/npm11.19.0，内置SQLite3.53.4，无第三方依赖。仓库根：

```sh
npm ci --prefix examples/distributed-lab
npm test --prefix examples/distributed-lab
npm run requests --prefix examples/distributed-lab
```

可将本目录复制到自己的新临时目录独立npm ci/test。不依赖根包；不要用用户既有数据库。请求模型只是明确丢请求/丢响应，不启动网络。requests输出两次尝试、一行业务、原创建结果、模型等待5；不是实测耗时。9项测试涵盖未知结果、重复对照、意图/owner、事务半失败、连接重开、错误分类、次数/预算/随机边界。

ledger仅创建专用示例schema，不是迁移任意旧库的工具。owner是可信合成身份，回执永久保留；保证只在同一SQLite事务内，外部副作用不回滚。retry要求operation自己遵守remainingMs，不能中止挂起操作；now必须单调、sleep推进对应时钟。没有生产SDK/集群或真实HTTP故障注入。

## 交付与恢复

`npm run delivery --prefix examples/distributed-lab`已实现。新增9项，共18项测试。outbox把业务/事件放source事务，inbox把去重/计数放target事务；两个数据库没有跨库事务。relay-worker仅由维护replay传入自建临时路径；消费前退出31或消费提交后、确认前退出32，父进程实际检查文件状态并重启。默认demo输出退出32/replayApplied=false/effects=1/pending=0，之后输出副本应用版本2与fence epoch2。进程突然退出不代表机器断电。

事件域仅单个producer-a，串行relay、去重永久保留；未做broker、多relay认领、跨生产者顺序或背压。replica是有序单流内存模型，缺口不推进，最低版本不足拒绝；没有选主/网络复制/共识。fence只实现资源端最大已见epoch条件写，epoch由可信fixture给定，未做租约签发；新epoch到达前旧值仍可能被接受。相同epoch允许多次写，不能推导同持有者内的幂等/顺序。资源回滚旧备份会影响守卫。

所有入口关闭自建连接/回收子进程与临时目录；无真实账号或云服务。浏览器、真实网络故障、生产集群与灾难恢复NOT_RUN。
