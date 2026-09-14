# H7-002 内容复核与维护验收

2026-09-13（运行日志UTC已到09-14），patricklfdm/knowledge-base既有v5，基线66eb047ed5dcfdd9521a8fe5990a7c946cf90631，接手工作区干净。按[执行计划](../docs/knowledge-base/codex/plans/H7-MAINTENANCE.md)完成；H4-001A先修已完成。

## 交付与实际效果

- [维护流程](../docs/knowledge-base/MAINTENANCE.md)覆盖年龄提醒、固定版本变化、来源访问与正文核验、反馈分诊、修正与证据、发布与恢复。
- `npm run kb:review`已接入kb:verify；复用现有检查器解析，输出日期/运行时候选、外链清单、观测索引、未比较环境。默认离线只读，不自动修改verified_on、tested_with、status或BACKLOG。
- [观测索引](../docs/knowledge-base/maintenance/observations.json)引用真实历史JSON Schema直连403及web正文核验，关联已有H7-001报告，不假装本次重测。回执模板和唯一BACKLOG关联支持后续复核。
- [读者反馈入口](../content/maintenance.md)与GitHub YAML表单提供文章、实际/预期、最小复现与环境字段。首页补齐数据工程、搜索和反馈路径；没有生成新一套教学主线。

反馈闭环用临时合成夹具实际演练：坏教材链接先触发MISSING_LINK，修正后复核成功并关联报告/任务，局部修正不刷新核验日期。没有真实用户Issue被创建、抓取或回复，不能把演练称用户反馈实证。

## 验证证据

固定Node24.21.0/npm11.19.0、Microsoft OpenJDK21.0.11+10、CPython3.13.0/macOS arm64。根依赖、锁和运行时未变，受控复用已干净安装的隔离根；git维护文件同步后执行`npm run kb:verify`、`npm test`。

结果：98 notes（16导航/82教学）、46检查器测试、389 Node/45 suites，Python基础29/数据33/搜索31由各Node桥真实执行；133HTML/317产物。全部示例、回退演练、tsc、构建、资源/base path、公开正控制、三个禁发marker及故意注入泄漏检出通过。隔离源码与维护源码逐文件字节一致，既有包锁无漂移。

本轮新增9项复核测试和2项门禁/表单测试：180/179日边界、闰日/未来/非法日期、三个运行时差异、未知版本未比较、Markdown引用式链接和代码忽略、分诊/关联、缺证据/错ID/非法状态/路径与符号链接、CLI非法参数非零退出、成功与失败均字节只读、合成修复闭环。故意删去必需命令或观察字段也被检出。

隔离副本独立故意错误：把`age >= maxAgeDays`改为`>`，原边界断言失败；插入对夹具文章追加换行，原只读/重复结果断言失败。各次退出1并实际含AssertionError，逐一恢复源码后9项通过，不以环境异常冒充守卫有效。

实际`--as-of 2026-09-13 --json`：98笔记、82教学、0候选、242去重外链、1历史观测、118条tested_with未比较；默认UTC09-14扫描也为0候选。未比较条目含库版本和OS，零候选不是全依赖兼容证明；242外链没有在本轮请求。

首次首页新增数据路线写成不存在的data-engineering.md，被复核的MISSING_LINK检出，修正为实际data-engineering-foundations.md后全部通过。GitHub表单语法按[官方文档](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)正文核对；配置检查不代替浏览器表单渲染。

日志：/tmp/maintenance-verify.log、maintenance-tests.log、maintenance-mutant-age.log、maintenance-mutant-readonly.log、maintenance-restored.log；固定日期完整清单/tmp/maintenance-inventory.json。临时路径不是永久证据，以上为可读验收摘要。

## 边界、发布与交接

年龄只提醒，无法推断内容失效；同运行时版本也不证明兼容，Java不比构建号。观测证据路径存在不证明报告真实，需维护者核对正文。观测索引没有任务状态，旧链接替换时更新索引并把完整历史留报告/Git。无自动抓取、定时器、真实Issue、浏览器、模型或生产资源操作；现有82篇verified_on未改动。

H7-002适用本地验收完成。当前内容提交尚待普通push及同SHA quality/build/deploy与HTTP回执，不能把基线SHA作为本批部署。自动普通push授权持续。H5–H7既定内容已完成，H4集中UI的内容依赖解除；UI仍未验收，历史工具失败和搜索实体/摘要问题保留，下一动作按刷新后的三目标计划继续。

恢复：核对实际Git/HEAD/origin/工作区，保护用户修改。隔离根/tmp/kb-h3b-path.txt、Java/tmp/kb-h5d-java-home.txt；临时失效按VALIDATION重建。先核对本次最终实际HEAD同SHA部署，不承诺离线持续执行。
