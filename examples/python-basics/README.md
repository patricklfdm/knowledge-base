# Python 基础与数据处理维护例子

固定CPython3.13.0，版本文件.python-version；Node24.21.0/npm11.19.0只用于接入既有CI。无第三方Python或npm依赖，不用pip安装，不改系统解释器。CI明确setup-python同版本；这是已测教学版本，不代表最新补丁或生产版本建议。当前支持macOS/Linux。

仓库根：

```sh
python3 --version
python3 -I -B examples/python-basics/run.py basics
python3 -I -B examples/python-basics/run.py test
```

也可`npm ci --prefix examples/python-basics`、`npm test --prefix examples/python-basics`；解释器不在PATH时命令级指定`KB_PYTHON=/绝对路径/python3`。run.py核对版本，显式导入自身目录，拒绝未知入口；`-I`忽略用户Python环境/路径，`-B`不生成pyc，并非安全沙箱。

P00–P02有10项unittest：安静导入、自建无pip venv、错误版本、语法/名称错误、ASCII输入及范围、bool/int、别名/浅/深复制、共享默认参数反例、字典重复/缺失。独立副本将total_days的`type(value) is not int`误改为`not isinstance(value, int)`，bool断言必须失败；恢复再跑。shared_default故意错误仅教学对照，不用于业务处理。

venv由测试TemporaryDirectory拥有并清理，显式调用bin/python而不activate。源码不访问用户笔记、数据库或网络，不从Markdown提取命令运行。根kb:examples与npm test均执行Node桥，Python失败使门禁失败；CI运行时/安装/版本文件保护有负面夹具。浏览器NOT_RUN：用户要求全部规划内容完成后统一验收。

P03–P05新增model.py/data.py与8项unittest，B批完成时共18项。运行`python3 -I -B examples/python-basics/run.py data`（仓库根）或`npm run data --prefix examples/python-basics`。Trip显式构造校验，JSON限字节/条数、严格UTF-8/重复键/常量和业务字段，CSV引号/列数/金额/总量都有断言。Decimal从字符串计算，独立副本改为float会把1.15变114分并使测试失败，恢复后再跑。JSON返回前整体校验，不提供数据库事务；CSV关系完整性尚由后续综合处理承担。

## P06–P08 完整主线

当前29项Python unittest，根333项Node测试包含一个Python桥，二者分别记数。仓库根新增`python3 -I -B examples/python-basics/run.py iterators`和`pipeline`，以及`summarize --help`；直接summarize传自己合成的trips.json和expenses.csv两个只读路径。四个demo入口basics/data/iterators/pipeline均由维护代码运行，不安装第三方包。

JSON上限8192字节/100条，CSV上限65536字节/100条；逐行迭代默认256字节（含LF/CRLF）和100条，可调范围见源码；输入流由调用者关闭，yield可能在消费时才报错。pipeline每份输入读一次、同文本解析/摘要，保留零费用并按id排序，拒绝重复和孤儿；实际总额144，改0.29为0.30得到145。摘要不是签名，多文件读取不原子，要求运行中输入不变。stdout故障不属于输入无半报告保证。

独立副本去掉aggregate的费用id去重，原数据/CLI测试必须失败；恢复后全29项通过。CLI真实新进程覆盖成功、帮助、参数/文件/重复失败、无成功stdout和无输入修改；未知编程异常仍传播。静态类型检查、Windows、生产ETL与浏览器NOT_RUN，不把这些边界冒充已测试。
