# Python 基础与数据处理维护例子

固定CPython3.13.0，版本文件.python-version；Node24.21.0/npm11.19.0只用于接入既有CI。无第三方Python或npm依赖，不用pip安装，不改系统解释器。CI明确setup-python同版本；这是已测教学版本，不代表最新补丁或生产版本建议。当前支持macOS/Linux。

仓库根：

```sh
python3 --version
python3 -I -B examples/python-basics/run.py basics
python3 -I -B examples/python-basics/run.py test
```

也可`npm ci --prefix examples/python-basics`、`npm test --prefix examples/python-basics`；解释器不在PATH时命令级指定`KB_PYTHON=/绝对路径/python3`。run.py核对版本，显式导入自身目录，拒绝未知入口；`-I`忽略用户Python环境/路径，`-B`不生成pyc，并非安全沙箱。

P00–P02当前10项unittest：安静导入、自建无pip venv、错误版本、语法/名称错误、ASCII输入及范围、bool/int、别名/浅/深复制、共享默认参数反例、字典重复/缺失。独立副本将total_days的`type(value) is not int`误改为`not isinstance(value, int)`，bool断言必须失败；恢复再跑。shared_default故意错误仅教学对照，不用于业务处理。

venv由测试TemporaryDirectory拥有并清理，显式调用bin/python而不activate。源码不访问用户笔记、数据库或网络，不从Markdown提取命令运行。根kb:examples与npm test均执行Node桥，Python失败使门禁失败；CI运行时/安装/版本文件保护有负面夹具。浏览器NOT_RUN：用户要求全部规划内容完成后统一验收。
