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

## 运行可靠性批次

`npm run operations --prefix examples/reliable-app`先用自己的IPC子进程演练SIGTERM，再在自建临时目录备份WAL库、新进程恢复与写入，最后输出1000/1的确定性错误预算。正常关闭ready503/新任务503/既有请求200/退出0；故意挂起分支测试退出2且graceful=false。正常保护预算5秒、故障分支1秒、外层15秒，都是实验边界，非性能结论。只向自己fork的子进程发信号，finally回收，不操作用户进程。

新增7项，总24项测试。恢复使用node:sqlite backup生成snapshot，再复制到restored；只读检查版本/完整性/两行全部业务字段，新连接验证owner和一次写入。故意删除bob行时integrity仍ok但清单检查失败；源库与snapshot不变，自建目录清理。restore-worker会修改传入副本，仅由维护operations传入自己新建路径，不对用户已有库运行。

budget只计算本次进程中完成的便笺响应5xx比例；ready/未知路由不稀释分母，4xx不记bad；0流量unknown。1000是合成计数，不是线上负载。服务端finish不能证明客户端收到，内存计数重启清空；无滚动窗口或自动发布冻结。

生产认证/容量/容器/云部署/真实灾备、前后端业务接线及浏览器均不在本轮验证范围；React真实UI统一NOT_RUN。
