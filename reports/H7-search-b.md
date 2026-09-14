# H7-001B 上下文、输出契约与受限工作流验收

2026-09-13，既有v5，基线f28e94b94fa26eed7de52fbbad393e7fba189f48。R03–R05三篇、路线和context/workflow入口完成；A已同SHA34810326492质量/Build/Pages及HTTP通过，见H7-search-a.md。持续自动普通push，浏览器后移保持。

## 内容和实际结果

片段保存原文偏移/文档摘要，默认160来源字符/2段、切片80字符；HTTP超时实际选择15字符原句，空证据abstained。上下文含版本与问题/索引/预算/来源摘要。字符不当作token或完整请求预算，固定切分和词元选择有语义遗漏反例。

精确输出字段/4096字节/UTF-8/重复键/枚举/回答-引用一致性/上下文身份/允许id/quote一致逐层检查。深拷贝防adapter污染对照。只输出抽取引用，没有自由生成正文，明确不证明资料真实或回答相关；手写契约不冒称JSON Schema标准实现。

受控ScriptedAdapter默认2次/2逻辑单位，调用前扣除；transient→ok实测成功余0，1单位时只调用一次，非法响应立即停止。没有片段不调用、永久错误不重试。资料动作外观保留为原文，但没有工具执行器，额外tool字段拒绝。没有运行LLM，不称模型提示注入防御评测；逻辑单位不是钱/token/时间，次数上限不保证真实请求超时。

## 验证与第二遍复核

CPython3.13.0、Node24.21.0/npm11.19.0/macOS arm64。新例子31项Python测试经1项Node桥进入根套件，既有Python29+33项另列。独立新目录/无pip venv/npm ci --offline/test、直接run.py test、search/evaluate/context/workflow通过；源码/锁一致。独立破坏指标分母、quote相等、预算预扣守卫均使原断言失败，恢复原字节通过。

另一个新副本从README运行四入口/31项测试，再破坏public过滤与规范化重复查询检查，原套件失败，恢复通过，未知入口退出2。第二遍读者复核六篇先修/术语、原句追溯/分母/失败解释、改条件练习和实测边界，不冒称专家背书。

九个官方来源正文均已通过web工具读取核对。逐URL直连结果为8个HTTP200，JSON Schema object页面HTTP403；保留直连失败，不把它写成200。该页面的字段/required/additionalProperties语义已从web工具读取，不受直连失败阻断。初次汇总脚本因403停止，修正为逐URL保留实际结果后继续其余独立验证；无绕过登录或权限。

隔离根全套kb:verify/npm test通过：97 notes（15导航/82教学），35检查器测试，378 Node/45 suites，132HTML/315产物；全部维护例子/回退/tsc/元数据/链接/资源/base path/公开正控制/禁发marker/故意泄漏检测PASS。既有锁无漂移，根依赖/主题/部署地址保持。

日志/tmp/search-b-independent.log、-mutant-*.log、-restored.log、-verify.log、-tests.log；/tmp/search-final-audit.json、-audit.log、-mutant-*.log、-restored.log。新例子指针/tmp/kb-search-b-example.txt、/tmp/kb-search-final-example.txt，隔离根/tmp/kb-h3b-path.txt。临时失效按README重建。

浏览器/真实LLM/收费/生产权限/向量检索/模型效果/真实网络取消/性能均NOT_RUN，不提升H4 UI/v1.0状态。

## 发布检查点

本地与综合内容复核完成，待普通push本批后核对同完整SHA质量/Build/Pages与8入口/资源/索引/404；之后关闭H7-001/GATE，下一项H7-002内容维护。当前不把待部署写成已部署。
