# F09：创建与校验的独立API

Node24.21.0/npm11.19.0实测，无npm依赖。可单独复制目录（含空格路径）运行，不依赖Quartz、其他示例包或数据库。只用合成行程。

```sh
npm ci
npm test
npm run demo
npm run fail
```

前3条成功；fail故意提交31天并抛HTTP422，应退出1，测试已断言。所有入口启动本机127.0.0.1随机端口并在finally/测试清理中关闭，不需要另开服务或reset；没有持续serve命令。

## 文件与契约

- server.mjs：startApi创建独立内存数组、路由与JSON响应，返回baseUrl/close。
- input.mjs：readJson负责媒体类型、实际字节上限、UTF-8/JSON；parseTrip负责业务字段；inputError创建附status/code的普通Error对象。
- demo.mjs：POST成功、Location读取、422、列表与新实例为空。
- failure.mjs：明确非零失败且清理服务。
- api.test.mjs：10组正常、边界、故意错误与真实HTTP集成测试。

| 接口          | 结果                                    |
| ------------- | --------------------------------------- |
| POST /trips   | 201、服务端生成id、Location与新行程JSON |
| GET /trips    | 200、当前内存列表                       |
| GET /trips/t1 | 200行程或404错误                        |
| 不支持的方法  | 405及Allow                              |

POST只接受application/json，允许大小写差异和可选charset=utf-8（可加双引号）；不接受其他媒体参数/编码或压缩正文。实际正文上限1024字节，超出后不再保留块，读完该请求后返回413；未使用Content-Length作为唯一判断。合法大小以内再严格解码UTF-8/解析JSON，失败400；业务失败422。提前路由/媒体错误会排空本次请求。没有应用级接收超时或速率限制，这不是生产抗滥用方案。

目的地trim后1–80个UTF-16代码单元（JS string.length，40个😀恰好80）；days必须number整数1–30，拒绝字符串数字。仅提取destination/days，额外字段不存，客户端id无效。普通JSON对象是输入范围，不把此函数称为任意对象沙箱。

重复POST创建两条不同记录；新实例丢失全部旧数据，编号重置。无更新/删除、数据库、持久化、鉴权、CORS、去重或自动重试。服务器只在教学命令期间运行，不部署到GitHub Pages。

## 练习与证据

在自己的副本将天数上限改14，同时修改提示与测试：14通过、15失败且不写入。把同一创建请求发两次，比较id和列表数量。验证见 reports/H3-create-api.md；示例内的10组测试也可独立复现。

浏览器交互与页面整合NOT_RUN：用户批准移至集中验收阶段。正文大小检查只限制本应用保留的正文内容，不能代表全部网络/Node内部缓冲的内存上限，也不能证明能抵抗慢速或无限上传。未知异常的500兜底未作故障注入验收，生产观测/加固留后续任务。
