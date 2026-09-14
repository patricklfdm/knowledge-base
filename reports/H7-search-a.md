# H7-001A 词法检索与离线评估验收

2026-09-13，既有v5/origin=patricklfdm/knowledge-base，基线9b15419ee50c1315e3f83f622d3f3e112b1466aa。R00分词/倒排、R01排序/BM25、R02离线评估三篇及导航完成；examples/search-lab新标准库包与CI登记。自动普通push、浏览器后移保持。

## 内容与复核

六条人工合成语料（5public、1仅测试可见性的internal，没有秘密）、3dev/4eval作者标注，固定分词与参数，不冒充外部盲测。查询规范化/双字词元、词频/长度/稀有度与分数非概率、指标分母/无答案/同义失败均有解释和迁移练习。

作者自审后第二遍按读者任务复核先修、命令/观测、公式变量与错误路径，5个有效官方来源Python Unicode、Stanford倒排/BM25/评估、Lucene9.12.3评分文档在线核对。最初旧倒排URL/某Lucene版本路径不可用，正文改用实际已核对有效页面，没有把失败链接标通过。不冒称专家审阅、Lucene运行器或模型能力。

真实evaluate：3有答案eval的宏P@2=1/3、Recall@2=2/3、MRR@2=2/3；1无答案正确不返回。两方法相同，保留“撤销未落盘变更”失败。合成微型集不证明生产效果或统计提升；内部权限字段不是保密机制。

## 实际验证

CPython3.13.0、Node24.21.0/npm11.19.0/macOS arm64。新包15项Python测试经1个Node桥执行；既有Python29+33项另列。独立含空格路径/无pip venv，npm ci --offline、npm test、直接run.py test、search/evaluate全PASS，锁与源码字节一致。故意把P@k分母从k换成已返回条数，原两项断言失败；恢复原字节后通过。新CI安装/锁/版本一致性受故意失败夹具保护。

隔离根kb:verify/npm test全通过：94 notes/0 errors、35检查器、378 Node测试/45 suites、129HTML/309产物；全部例子/回退演练/tsc/构建/资源/base path/禁发marker与注入泄漏检测通过，既有锁无漂移，未升级根依赖或改变主题。

日志/tmp/search-a-independent.log、-mutant-0.log、-restored.log、-verify.log、-tests.log，例子指针/tmp/kb-search-a-example.txt，根/tmp/kb-h3b-path.txt。临时失效按README重建。浏览器/真实模型/生产搜索与性能NOT_RUN，未调用付费接口。

## 发布检查点

本地验收完成，待普通push本批后记录完整SHA quality / verify、Build website、Deploy website及HTTP入口/资源/索引/404；不把本地构建称部署。继续第二批R03–R05，父项保持进行中。

发布回执：f28e94b94fa26eed7de52fbbad393e7fba189f48普通push，Actions34810326492同SHA quality / verify、Build website、Deploy website成功，2026-09-14T05:39:48Z/05:40:25Z/05:40:37Z完成；HTTP5入口/30资源200、索引128含三篇、404通过，日志/tmp/search-a-http.log。
