---
id: p00-python-runtime-and-modules
title: 同一份Python脚本，为什么换个终端就不能运行？
description: 区分解释器、虚拟环境、模块和入口，用明确路径重现运行条件。
note_type: tutorial
level: L1
status: reviewed
draft: false
publish: true
prerequisites: [f04-modules-errors]
topics: [python]
tags: [language]
aliases: []
tested_with: [CPython 3.13.0, macOS arm64]
verified_on: 2026-09-13
---

## 从文件到正在执行的程序

你会[模块与错误](modules-and-errors.md)，现在把一段行程统计改用Python实现。编辑器里看到的.py文件只是源码；实际执行它的是某个Python解释器（interpreter）。终端里的python和python3是命令名称，不保证指向同一文件或版本。先运行python3 --version，再看维护目录的.python-version；本例实际使用CPython3.13.0，不把它称作最新版本。

2026-09-14版本复核：[Python官方3.13.0发布页](https://www.python.org/downloads/release/python-3130/)已标明它被3.13.15取代。本课程的3.13.0是重现历史验收的固定环境，不能当作新项目应长期安装的补丁版本。`docs.python.org/3.13/`文档会随3.13系列更新，不能假定其中每项行为都在3.13.0存在。升级课程环境需要一起调整三个Python示例的版本文件并重跑各自测试，不能只改`tested_with`。本轮没有执行3.13.15。

Python文件以缩进划定语句块。`if True:`后面的下一行必须缩进；漏缩进会在解析时得到IndentationError，程序尚未开始业务计算。语法合法却读取未定义名称，则是运行时NameError。维护测试分别触发这两种错误。排查时先看错误类型与文件位置，不要因为都显示红字便反复重装解释器。[Python错误说明](https://docs.python.org/3.13/tutorial/errors.html)

## 虚拟环境隔离的是安装位置

虚拟环境（virtual environment，venv）让项目有自己的解释器入口和第三方包安装位置，避免多个项目共享同一套包。本课程只用标准库，没有第三方安装步骤。测试实际用venv.EnvBuilder(with_pip=False)在新临时目录创建环境，再调用该目录的bin/python，观察sys.prefix与sys.base_prefix不同。

```python
with tempfile.TemporaryDirectory(prefix="kb-python venv-") as directory:
    venv.EnvBuilder(with_pip=False).create(directory)
    executable = Path(directory) / "bin" / "python"
    # 维护测试用这个绝对路径启动子进程
```

这是测试中的核心流程，所需导入与断言见test_basics.py。没有activate，也能直接使用环境的解释器；activate主要改变当前shell的PATH等配置。创建venv使用的是执行创建命令的Python版本，不会自动下载另一版本。[venv教程](https://docs.python.org/3.13/tutorial/venv.html)

venv不是容器或权限沙箱，代码仍拥有当前用户的文件访问权限。不要因为依赖隔离就运行陌生脚本。本课程也不在仓库里提交venv；测试结束删除自己拥有的临时目录，不删除用户现有环境。

## 模块与脚本入口是两件事

模块（module）让函数可以被其他代码import。kb_python/basics.py定义函数，导入时不读文件、不打印演示结果。run.py则负责解释命令并调用函数；末尾的入口保护是：

```python
if __name__ == "__main__":
    raise SystemExit(main())
```

直接执行该文件时，__name__为__main__；作为模块导入时不会因为这段保护自动调用main。但模块顶层的其他语句仍会执行，因此入口保护并不等于整个模块没有副作用。测试实际重载basics并确认stdout为空。[模块和入口说明](https://docs.python.org/3.13/tutorial/modules.html)

## 为什么命令带-I和-B？

本例run.py先核对版本，再显式把自己所在的维护目录加入模块路径，只导入这份代码。命令带-I，忽略用户Python环境变量及用户site-packages，不自动从当前工作目录寻找模块；-B避免生成pyc文件。它们减少本例的环境偶然性，同样不是权限隔离。[解释器命令行](https://docs.python.org/3.13/using/cmdline.html#cmdoption-I)

如果版本不符，入口在加载课程前明确退出，打印Expected CPython与实际版本。测试把独立副本的版本文件改成3.14.0，真实验证非零退出。不要为了“变绿”改版本文件；先在命令级选择匹配解释器，再复跑测试。

## 改变条件的练习

先预测：只改变当前目录、改解释器路径、把顶层print放进basics，分别影响哪里？用自己新建的目录验证前两种运行条件，再看安静导入断言能否发现新增输出。区分“找不到可执行文件”“找不到模块”“语法错误”和“业务校验失败”，每次只改变一个条件。

下一篇：[用函数表达输入规则](python-values-and-functions.md)。

## 运行与核验

仓库根目录，实际CPython3.13.0；完整维护代码在[examples/python-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/python-basics)，不把正文摘录当成独立程序。

```sh
python3 -I -B examples/python-basics/run.py basics
python3 -I -B examples/python-basics/run.py test
```

标准库，无第三方依赖；只用合成数据、自建临时目录，自动清理。Node桥接入口为`npm test --prefix examples/python-basics`。版本不符先查README，不修改系统默认环境。正文来源与例子实际核对，浏览器 **NOT_RUN：用户批准全部规划内容完成后统一验收**。
