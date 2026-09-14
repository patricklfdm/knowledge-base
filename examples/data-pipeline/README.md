# 有界批流数据实验

Q00–Q02批次：JSONL质量与本批去重、路线×60分钟汇总、generation清单与CURRENT切换。固定CPython3.13.0（沿用examples/python-basics/.python-version）、Node24.21.0；标准库，无第三方Python/npm依赖。KB_PYTHON可指向解释器完整路径；版本不符直接失败，不改全局环境。

```sh
npm ci --prefix examples/data-pipeline
npm test --prefix examples/data-pipeline
npm run batch --prefix examples/data-pipeline
```

从仓库根运行。也可将本目录完整复制到自有临时目录，在那里npm ci --offline、npm test、npm run batch。可用指定Python执行venv --without-pip，在命令级设置KB_PYTHON为新venv/bin/python。入口固定-I -B，未知命令退出2，零测试退出失败。node桥只是一个Node测试，内部Python测试数量应单列。

fixture为合成数据，输出5行中3接收/1重复/1拒绝，两组各300分。金额整数分、分钟整数，无真实时区/币种语义。最多65536输入字节、100行、512字节/行、20汇总组；资源参数拒绝超界。质量守恒与冲突、维度键唯一、守恒金额、发布前失败/损坏均有断言。

batch与tests只创建/删除自己的TemporaryDirectory；不接受现存生产数据路径。内部publish只支持自有本地目录、单写者；旧generation保留到示例统一清理。CURRENT成功替换不等于断电耐久，摘要不等于认证，不包含并发写者或对象存储协议。浏览器/真实上游/性能测试NOT_RUN。

独立故意错误复现：在复制目录中把pipeline.py的`if route in names:`改成`if False:`，npm test必须非零；恢复原字节再测试必须通过。不要编辑工作区来注入错误，也不执行任意正文代码块。
