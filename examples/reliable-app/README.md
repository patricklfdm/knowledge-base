# Reliable app：工程纵深隔离例子

Node24.21.0/npm11.19.0，独立锁React/ReactDOM19.3.0、esbuild0.27.2。根目录：

```sh
npm ci --prefix examples/reliable-app
npm test --prefix examples/reliable-app
npm run frontend --prefix examples/reliable-app
npm run build --prefix examples/reliable-app
```

可将本目录复制到自己的新临时目录后npm ci/test；不依赖Quartz根node_modules。test含状态、确定性Promise顺序、SSR结构和真实bundle构建；frontend打印筛选计数与HTML；build在自己mkdtemp目录创建bundle/HTML并清理。它是非交互构建验证入口，不是预览服务器。

web/app.mjs提供真实createRoot/useReducer/useEffect/useMemo接线；read为两条合成本地数据，无后端登录或HTTP接线。将来浏览器验收可调用buildClient取得新目录再由受控本机服务器提供；本轮不运行。无全局npm或浏览器安装，不接生产服务。测试时间输出只作诊断，不作为性能结论。

前端9项测试：旧快照/未知action、派生筛选、缓存键/计数、晚到成功、取消后失败与重建、当前失败与重试、SSR关联/故意缺label、文本转义、bundle。SSR与纯控制器PASS不表示真实事件、Effect挂载、键盘/屏幕阅读器/Profiler通过；这些NOT_RUN，等待所有规划内容完成后集中验收。

## 后端批次

`npm run backend --prefix examples/reliable-app`用合成会话、内存SQLite和127.0.0.1随机端口验证200/404/更新200/旧版412，finally关闭；不输出token。新增8项测试，总计17项。session.issueFixture仅可信进程调用，不是HTTP登录；Map无持久化/多实例/定期清扫。server接收GET/PUT /notes/:id、GET /ready；PUT只允许title，要求单个强十进制If-Match标签。store迁移v1→v2加revision，SQL同时检查owner与revision。没有密码、Cookie、真实账号或前端后端接线。

observe记录白名单五字段，保留最近100日志，计数独立累计；服务端finish≠客户端收到。withDeadline限制异步依赖等待，abort不能抢占CPU或撤销外部写入。HTTP头/体接收超时5000ms，正文保留最多1024字节并在读完后拒绝超限；只验证本机完整请求，不宣称公网资源防护。日志/指标内存态。

E06–E08将补进程与恢复实验；生产认证、云部署与浏览器仍不在本轮验证范围。
