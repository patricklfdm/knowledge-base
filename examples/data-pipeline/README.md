# 有界批流数据实验

Q00–Q05：JSONL质量与本批去重、路线×60分钟汇总、generation清单与CURRENT切换，以及事件时间、SQLite检查点、重放和补数对账。固定CPython3.13.0（沿用examples/python-basics/.python-version）、Node24.21.0；标准库，无第三方Python/npm依赖。KB_PYTHON可指向解释器完整路径；版本不符直接失败，不改全局环境。

```sh
npm ci --prefix examples/data-pipeline
npm test --prefix examples/data-pipeline
npm run batch --prefix examples/data-pipeline
```

从仓库根运行。也可将本目录完整复制到自有临时目录，在那里npm ci --offline、npm test、npm run batch。可用指定Python执行venv --without-pip，在命令级设置KB_PYTHON为新venv/bin/python。入口固定-I -B，未知命令退出2，零测试退出失败。node桥只是一个Node测试，内部Python测试数量应单列。

fixture为合成数据，输出5行中3接收/1重复/1拒绝，两组各300分。金额整数分、分钟整数，无真实时区/币种语义。最多65536输入字节、100行、512字节/行、20汇总组；资源参数拒绝超界。质量守恒与冲突、维度键唯一、守恒金额、发布前失败/损坏均有断言。

batch与tests只创建/删除自己的TemporaryDirectory；不接受现存生产数据路径。内部publish只支持自有本地目录、单写者；旧generation保留到示例统一清理。CURRENT成功替换不等于断电耐久，摘要不等于认证，不包含并发写者或对象存储协议。浏览器/真实上游/性能测试NOT_RUN。

独立故意错误复现：在复制目录中把pipeline.py的`if route in names:`改成`if False:`，npm test必须非零；恢复原字节再测试必须通过。不要编辑工作区来注入错误，也不执行任意正文代码块。

## 在线模型与补数

```sh
npm run stream --prefix examples/data-pipeline
npm run reconcile --prefix examples/data-pipeline
```

stream实际启动自己的worker子进程，第2行提交后os._exit(42)，重开position=2后继续，最终position=5、W=80、duplicates=1、late=[e3]，两组100/600分。tests还测提交前exit41后position=1，以及错误回滚、源/策略变化、相同源再次运行、边界与资源上限。Python当前共33项测试，Node桥1项，勿混算。

CPython3.13.0本机链接SQLite3.47.1；CI发行物内置SQLite可能不同，测试核对行为，不冒称统一库补丁版本。仅同库本地效果事务，不提供跨库、外部HTTP或断电保证。inspect在消费者停止后调用，不是并发快照协议。

输入是不可变有界JSONL，源SHA绑定整个字节串（不支持追加后沿用检查点），必须先通过字段契约；在线不静默忽略坏行。W=max(W,maxminute-10)，窗口end<=旧W判late，不加额外宽限，EOF不强制关闭尾窗口。minute<W但窗口未关仍可接收。保留所有seen和totals，默认100id/20组，超限回滚当前行、保留前缀；不是无限流实现。

reconcile比较同粒度的全量批次与在线结果，差额为窗口0的1件/300分；用完整generation替换补数，重复内容相等、总额1000。金额与计数都比较，实际多出的分组也能发现。修正批次不改旧在线检查点，不实现大型分区合并或下游通知。

独立故意错误可再把stream.py的`if end <= state["watermark"]:`改成`if False:`，或把`connection.rollback()`改为`connection.commit()`；原套件必须失败，再恢复原字节。worker.py是内部故障入口，父命令只传自身临时路径，不用用户文件/数据库。
