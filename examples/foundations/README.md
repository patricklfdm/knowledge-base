# F00–F02 基础例子

独立于 Quartz 的无依赖教学程序。实测 Node 24.21.0/npm 11.19.0，合成目的地与天数，不联网、不启动服务器、不写数据库。

从本仓库根目录执行：

```sh
cd examples/foundations
node --version
npm ci
npm test
node hello.mjs
node values.mjs
node rules-demo.mjs
```

- `hello.mjs`：按顺序打印；`failures/typo.mjs` 故意拼错方法并以非零退出。
- `values.mjs`：值、赋值、类型、字符串相加、严格相等与浮点边界。
- `rules.mjs`：1–30 的整数校验；`rules-demo.mjs` 调用它。
- `failures/reassign.mjs` 故意重新赋值 const 并失败；`failures/truthy.mjs` 会正常退出，却错误地接受不合法业务值。退出零不代表业务正确。

`npm test` 明确运行 foundations.test.mjs：验证 stdout、非零错误类型、行号和边界，失败样例被测试捕获，不是未处理的失败。新增例子必须显式登记到测试，不遍历执行任意 Markdown 或 shell。

停止/清理：这些程序执行完即退出；无后台进程，无 reset 数据操作。可以删除自己复制的临时练习文件，勿覆盖仓库受测文件。完整教材位于 content/topics/01-languages 与 content/topics/02-foundations-tools；当前批次未推送前，源码仅在本地工作区可读。
