# H3-001A 验收：对象、数组与模块错误边界

2026-09-11 America/Los_Angeles。开发基线 da75ddd，交接资料独立提交 722d859；目标 patricklfdm/knowledge-base 的 v5。用户本会话授权本批必要发布，线上证据另见 RELEASE-2026-09-11.md。

## 实现范围

新增 F03 `objects-and-arrays.md`、F04 `modules-and-errors.md`，接续 F02，首页/路线提供五篇真实入口。examples/foundations 新增数据创建/查找/复制与模块调用示例，四个失败文件均由显式测试捕获。没有新增依赖或服务。

交接资料原为未跟踪公开工程文档，人工审阅后单独入库；协调 AGENTS/METADATA/ENGINEERING 中已过期的“kb 命令未实现”描述，保留历史 BASELINE 的时间边界。没有纳入 Obsidian、环境文件、用户进度或其他项目材料。

手机菜单有既有定位缺陷：390px 宽度从侧栏 x=16 开始，右边达到 406px。quartz/styles/custom.scss 局部改为视口 fixed 定位、left:0，并保留盒内文字边距；不修改上游插件。

## 实际验证

环境 Node 24.21.0/npm 11.19.0、macOS arm64。新隔离目录由 git archive 与受控 content/examples 覆盖建立，没有复制原 node_modules；候选正文只在验证副本切换发布字段，完成核验后同步正式文件。

| 检查 | 结果与证据 |
| --- | --- |
| 根 npm ci、插件 install --from-config | PASS，368 包、审计 0 漏洞；插件报告已安装；锁未变化 |
| 示例独立 npm ci / kb:examples | PASS，10 组；新增组覆盖首项匹配/空数组/缺失/类型不符/浅复制反例及修复、模块异常路径 |
| 正文与源码 | PASS，7 段完整代码逐字匹配受测文件；F04 练习 30 与字符串 "3" 均另外实际执行并断言输出 |
| kb:check / kb:test | PASS，12 notes、0 errors，34 校验器测试含负面 fixtures |
| tsc --noEmit / Quartz build / kb:output | PASS，24 HTML、99 产物、0 链接错误；修复样式后重建并复测 |
| kb:publish-test | PASS，正向页存在；3 种禁发标记在全部衍生产物中均不存在；注入泄漏能够被检测 |
| npm test | PASS，207 tests，45 suites，0 fail/skip；含上游与 KB/示例回归 |
| 浏览器 G7 | PASS，Chrome 实际查看 F03/F04 的 390×844 与1440×1000，正文/代码/语言标识/难度和先修可读；整页宽度等于视口；手机菜单展开修复后 x=0/right=390 |
| 搜索/复制/键盘 | PASS，浅复制→F03、createTrip→F04，搜索结果 Enter 打开目标；F03 复制命令粘贴为完整 `node examples/foundations/trips-demo.mjs`；明暗模式可切换 |

根锁 SHA256：`6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0`；示例锁：`e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2`。安装前后相同。临时日志路径可由 /tmp/kb-h3-path.txt 找到；报告与受维护测试是可恢复证据，不依赖临时日志长期存在。

## 审阅与已知边界

完成作者自审，再从“新增停靠点但不修改原记录”和“非法天数应该在哪层处理”两个读者任务二次阅读。不是独立专家评审。解释 find 回调时使用已学 function，不引入未讲箭头函数；解释 const 绑定、浅复制层级、静态导入失败早于入口执行。目的地校验、唯一编号、异步与持久化均明确尚未实现。

来源在编写当日在线核对：MDN Working with objects、Array.find、Spread syntax、throw、try/catch 与 Node ESM 文档，链接均在相关正文段落。Node 的 v24 专页工具读取失败，改核对当前官方 ESM 基础规则并用24.21.0实测，文章明确区分文档主版本与运行环境。

首次沙箱 npm ci 因 DNS ENOTFOUND 失败，按审批联网重试成功；首次构建字体抓取失败，随后 CustomOgImages/esbuild 失败，批准联网后完整门禁成功。npm install-script 提示及未安装 Excalidraw 警告与基线一致，未新增使用该插件的内容。全仓 Prettier 既有差异仍见 H0，不执行批量格式化。搜索摘要实体显示问题保留 H4-001，不将搜索命中等同摘要质量完美。

## 台账与恢复

H3-001A 可标 done，父 H3-001 仍 in_progress。下一批 F05/F06：异步与 TypeScript/运行时校验，仍按 1–3 篇推进。发布状态及同 SHA 证据单独维护于 RELEASE-2026-09-11.md；不把本报告的本地 PASS 当成部署完成。
