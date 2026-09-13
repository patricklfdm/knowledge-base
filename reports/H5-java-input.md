# H5-001E：Java值、运算与输入边界验收

2026-09-13，基线52640bb139bbcb0450ffecc208c87b9b67e27b96；patricklfdm/knowledge-base v5，接手工作区干净，origin已核对。沿用户持续授权，内容优先、浏览器完成规划内容后集中验收、通过适用门禁后自动普通push。

## 交付与实测

新增J01 java-values-and-operations、J02 java-input-validation两篇，J00下一篇/Java路线同步。复用java-basics新增NumericValues与DaysInput，两个演示入口仅接受维护源码清单；编译夹具增加明确文件数组，供真实Java调用对照，保留J00全部测试。包测试脚本由单文件改为全部*.test.mjs，已接入既有根门禁与CI，无新依赖/运行时/工作流变化。

Microsoft OpenJDK21.0.11+10/macOS arm64，Node24.21.0/npm11.19.0；复用上轮官方SHA256核验的临时JDK，命令级KB_JAVA_HOME，不改用户安装。八组新增、包内共15组真实javac/java测试通过。实测数字5与拼接32、带括号5、整除2/负数-2、浮点2.5、boolean条件，以及先int加法再存long仍负溢出和先转long的2147483648；整数条件编译非零。

DaysInput覆盖1/3/30/03、空串/空白/换行/符号/小数/混合文字/阿拉伯与全角数字、0/31/int最大值业务拒绝、超int与40位整数解析拒绝。直接Java调用验证null拒绝、失败不执行调用者赋值、输入字符串保持、失败后合法30可继续；parseInt的+3/阿拉伯数字成功与自定义ASCII政策拒绝有对照。CLI成功stdout，错误stderr+退出2且无成功摘要，参数个数必须恰好一项；Node入口保留真实退出码，不吞错。

独立含空格副本npm ci --ignore-scripts --offline/test/values/input3通过，input31预期退出2；源码/锁与工作区逐文件相同。移除`|| days > 30`后3项测试失败、退出1，恢复后逐文件一致。另在自建目录实际执行上限14的迁移练习：1/14退出0，15/30退出2且文字为1–14；产物已清理。

受控同步本会话已干净安装隔离副本，根依赖未变，新包脚本通过独立安装验证。kb:verify/npm test全部PASS：37 notes=9导航+28教材，34检查器，291 tests/45 suites，0 fail/skip；全部示例、recovery普通revert夹具、tsc、正式构建、63 HTML/177产物、公开对照/三个禁发marker及故意泄漏检出通过。受测试content/examples/scripts/tests/workflow/root manifest与提交源一致，所有锁文件无差异。

证据：/tmp/h5e-independent.log、/tmp/h5e-mutant.log、/tmp/h5e-verify.log、/tmp/h5e-tests.log；独立指针/tmp/kb-h5e-example-path.txt，根隔离/tmp/kb-h3b-path.txt，JDK/tmp/kb-h5d-java-home.txt。临时证据失效按维护入口重建。

## 编辑复核与限制

核对JLS21类型/整数运算/字符串拼接/除法，以及Java21 Integer.parseInt和String.matches官方文档。作者自审后第二次按读者任务重读：从命令参数String到三层拒绝，解释null/短路/正则/throw/catch/final；实跑上限14迁移，确保非零错误是预期失败而非安装问题。没有独立专家背书。

特别区分整数可表示范围与业务范围、parseInt语法与本例ASCII契约、赋值前表达式溢出与目标变量类型、纯解析无副作用与真实数据库事务。不声称所有小数精确或long不会溢出；未测公网请求字节/频率/并发、对象集合、金融精度、数据库写入。无其他项目/真实资料读取，编译输出只在自建目录并清理。

G7/真实浏览器仍NOT_RUN：用户批准内容建设完成后集中验收。历史UI/环境/上游格式问题保留，构建中既有excalidraw检测提示和隔离副本无Git提示没有伪装成新测试通过。H4/v1.0与H5父项未完成。

## 发布与下一项

本地适用门禁完成，待本批普通push同SHA CI/Pages/HTTP；未把本地成功当已部署。下一项H5-001F：Java对象、引用与集合的有界单元，沿J02组织行程数据，保持独立合成例子与真实失败对照。
