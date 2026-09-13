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

## S01/S02：关系查询与多步事务

保持F10的schema/store/demo不变；新增ledger-schema.sql/ledger.mjs使用自己的journeys/expenses两表，ledger-demo.mjs是受维护演示。`npm run ledger`自动创建并清理临时文件，`npm test`包含原8组及S01/S02新增7组；加上后述S03–S05共25组。

显式连接级foreign_keys=ON；孤儿/删除父行被拒绝；JOIN明细、LEFT JOIN汇总、COUNT星号与ON/WHERE反例。整数分只为合成数据，不是完整货币模型。无显式事务的失败保留部分写入；createWithTransaction同步BEGIN IMMEDIATE/COMMIT/ROLLBACK，约束失败撤销整个新增业务动作、保留既有记录。

运行`npm run ledger`查看对照。所有本批CLI实验不接用户库路径；直接调用openLedger只适用于内存或自建空文件，不作为旧F10库迁移。事务函数不支持嵌套或await，未处理生产磁盘故障、重试/并发/外部副作用。当前重开证据是同进程新连接，F10既有新进程测试另行保留；不宣称本批验证崩溃恢复。

## S03：索引访问计划

`npm run indexes`在新内存库生成100行程×20费用，共2000条；比较无索引、(journey_id,amount_cents)、反向列顺序及移除索引的同一查询。index-plans.test.mjs新增3组，S03完成时包内18组；全部通过既有根测试/示例门禁执行。金额1000边界、2000/2001/缺失行程及索引后增改删另有结果断言。

EQP观察仅针对实测SQLite3.53.4，不由应用逻辑解析，不承诺格式稳定；升级后应重核计划与结果。索引只在自建内存库创建/删除，不接用户路径，无依赖、端口、浏览器或性能数字。源码与DDL由维护入口执行，不从Markdown抽取执行。

## S04/S05：双连接写竞争与读快照

`npm run connections`运行connections.mjs中的受控交错：DELETE/WAL第二写者BUSY(5)、回滚释放对照、DELETE读事务阻止COMMIT、WAL旧快照升级写入BUSY_SNAPSHOT(517)。重试步骤按实际事务状态分别处理，不提供通用无限重试函数。

connections.test.mjs新增7组，包内合计25组。withPair只建自身临时文件、显式设置日志模式与两个连接busy_timeout=0；连接全部打开后才开始实验。无sleep/并行线程/HTTP/浏览器操作；是真实锁和快照的同步交错，不是并发吞吐基准。Node24.21.0/SQLite3.53.4错误对象实测errcode用于区别5与517，不依赖同为database is locked的文字。预期错误助手只接受准确代码，其他错误重新抛出。

夹具仅接同步教学回调，禁止在其中await；异常后关闭两个连接并清理自身目录，包括日志/WAL/SHM，不处理用户库。没有证明生产等待上限、跨进程容量、断电/磁盘恢复或WAL备份正确性。
