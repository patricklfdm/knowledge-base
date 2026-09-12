# F06：类型检查与运行时输入校验

独立包，只开发依赖 TypeScript 5.9.3；Node24运行，无服务器、数据库或网络请求。实测版本与文章核验报告对应。不依赖父仓库 node_modules，可以把整个目录复制到仓库之外（含空格路径）。

```sh
cd examples/typed-trips
node --version
npm ci
npm run check
npm run demo
npm test
node assertion-demo.ts
```

需 Node 24（本批24.21.0），npm11.19.0。`npm ci` 按本目录锁文件安装编译器；根 npm ci 不代替此步。`npm run check` 静态检查正常源文件，`npm test` 还会检查故意错误的 tsconfig.negative.json，预期TS2322并非零退出，随后验证相同错误文件仍能被Node执行。不要把原生Node类型擦除当成类型检查。

- trip.ts：unknown 输入，通过字段和业务检查后返回仅含允许字段的新对象，保留原输入。
- demo.ts：打印 `山城 3`，随后拒绝字符串天数。
- assertion-demo.ts：as断言仍通过静态检查，却打印 `string` / `31`。
- failures/type-error.ts：类型标注报错；Node直接运行仍打印31。

配置严格检查，只接受可擦除语法，允许.ts导入，noEmit不生成文件；`types: []` 隔离父项目的自动类型声明。lib包含ES2022与DOM的标准声明用于console类型，不代表示例依赖浏览器或已测试DOM。Node原生执行不读取tsconfig，这个文件供tsc使用。

输入范围：类似JSON解析后的普通数据对象。没有执行或防御任意getter/proxy，未做目的地长度上限、唯一编号、鉴权和持久化；额外字段在返回的新对象中丢弃。业务契约允许裁剪目的地首尾空白，天数必须是数字类型的1–30整数，不自动转换字符串。

停止与清理：程序同步/异步运行结束即退出，无后台进程。check/noEmit和测试不生成dist，不重置用户数据。练习修改放在自己的副本。
