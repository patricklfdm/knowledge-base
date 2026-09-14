# H5-002B Python内容验收

2026-09-13本地日期，patricklfdm/knowledge-base既有v5，基线56aac6ffc2519250cd7a85dba08ccf06fb3723db。按H5-PYTHON-completion连续三部分计划；用户持续自动普通push、内容完成后浏览器统一验收有效。

## 交付与审阅

P03–P05三篇：类型注解不自动校验、dataclass明确字段不变量；只读UTF-8字节上限/JSON重复键和整批校验；CSV引号/列数/条数及Decimal金额契约。Python18项测试，Decimal替换成float故意错误使1.15和0.29的金额断言失败，恢复通过。演示从合成JSON读山城3天，CSV保留逗号备注，正确115分、浮点反例114分。

CPython3.13.0、Node24.21.0/npm11.19.0、macOS arm64，Java既有21.0.11+10。官方Python3.13资料在线核对，运行时/CI用实际版本固定；不是最新补丁推荐。正文作者自审后另一次按读者任务复核，核对术语先修、核心片段、输入/错误/边界、迁移练习，不冒称独立专家。G7 NOT_RUN：用户批准全部规划内容完成后集中验收。

## 实证

独立含空格目录无网络创建无pip venv、npm ci --ignore-scripts --offline、Python全套18项unittest与本批demo成功；故意错误使原断言失败，恢复原字节后18项再次PASS，副本与维护源码/锁相等。入口和CLI版本错误明确非零，不从任意Markdown抽取执行。

根已干净安装隔离目录受控同步后kb:verify、npm test全部PASS：63 notes、333个Node测试（Python桥内部另执行18项，不混算）、45 suites、91 HTML/233产物。34检查器及故障夹具、全部维护例子、recovery、tsc、构建、链接/先修、公开对照/3禁发marker与注入泄漏检测通过。依赖无升级/锁无漂移；新增桥包无npm依赖。

日志/tmp/python-b-independent.log、-mutant.log、-restored.log、-verify.log、-tests.log；独立指针/tmp/kb-python-b-example.txt、根隔离/tmp/kb-h3b-path.txt。临时失效按README重建，不修改全局Python/JDK。

## 发布与恢复

本地门禁通过，待本批普通push同SHA质量/Build/Pages与HTTP后记录；随后直接继续计划下一部分，不逐篇请求确认。仅合成数据、自建文件与venv，清理自有资源；无浏览器/生产/其他项目操作。Python任务完成不表示其他H5–H7或H4/v1.0完成。
