# F10 SQL与持久化实验

独立、无npm依赖。使用Node24.21.0内置node:sqlite；本机SQLite实测3.53.4，其他Node版本可能内置不同版本。无需安装sqlite3命令行或连接数据库服务器。

```sh
cd examples/sql-trips
npm ci
npm test
npm run demo
npm run fail
```

最后一条故意违反days CHECK，退出1；demo捕获预期失败后退出0。demo/test只在自行创建的系统临时目录写合成数据库，关闭连接并删除该目录；failure只用内存库。所有命令无监听端口，不接用户数据。不要把现有数据库路径传给openTrips做实验。

- schema.sql：独立表结构，INTEGER主键、NOT NULL、非空目的地和1–30天CHECK、STRICT。
- store.mjs：固定SQL与参数绑定；create/get/list/atLeast/close，未实现F09的完整API输入校验。
- read.mjs：只读查询；demo在另一个Node进程运行它。路径缺失时不创建数据库。
- demo.mjs/failure.mjs：正常结果、受控失败与自动清理。
- sql.test.mjs：8组真实SQLite测试，含新进程、约束失败无写入、SQL样式输入、类型转换和旧表迁移反例。

get缺失返回undefined，list/atLeast返回数组。Node查询行可为无原型对象，示例用JSON.stringify输出；不是HTTP响应。编号为本例SQLite整数，未复用F09的t1字符串；没有全局唯一、永久不复用或连续编号承诺。ORDER BY明确顺序。

本例故意直接观察数据库规则：数字字符串3可被STRICT无损转为整数；空格和81个汉字的目的地仍可保存。未来API整合必须在绑定前保持F09业务校验，数据库约束不能替代请求契约。参数占位符绑定值，不绑定表名、列名或排序关键字。

练习：把schema.sql中的30改14，在全新临时库测试14成功、15失败、条数1；对原已建表文件执行同样CREATE IF NOT EXISTS，15仍能成功。这两种情况由第7组测试实跑，不是迁移实现。恢复schema后再运行全套测试；不要删除用户旧库来“迁移”。

文件持久化证据仅覆盖单机正常提交、关闭及新进程读取。断电、磁盘损坏、备份恢复、并发写入、完整事务专题和HTTP/UI整合NOT_RUN或留后续。DatabaseSync为同步接口，不适合直接据此推导高并发服务设计。浏览器NOT_RUN：用户批准集中验收。验收见reports/H3-sql.md。
