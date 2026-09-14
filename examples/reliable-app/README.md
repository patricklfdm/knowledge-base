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

E03–E08后续批次会扩展合成会话、临时数据库和进程恢复；当前尚不提供生产认证或服务端部署。
