# H3-001B 验收：异步与类型校验

2026-09-11 America/Los_Angeles。基线 f5568ba，分支v5；工作区开始时干净，origin仍为db02102，本地既有1笔事后报告提交。任务为F05/F06，不将H3整条路线记为完成。

## 交付与设计

新增 `content/topics/01-languages/async-and-promises.md`、`types-and-input-validation.md`，从F04连接到两篇新文；首页/路线现有七篇连续教材。使用合成行程，正文说明没有真实网络、表单、接口或持久化。

F05在examples/foundations添加async-trips/async-demo和忘记await/漏接拒绝反例，仍无依赖。F06新增独立examples/typed-trips：唯一开发依赖固定TypeScript5.9.3（与原根工具版本一致），Node24原生执行可擦除语法，tsc单独做严格检查。独立tsconfig隔离父项目自动类型，noEmit不产生构建文件；没有新增根依赖或升级上游。

kb:examples显式运行两个包。CI新增`npm ci --prefix examples/typed-trips`，并检查两套示例及根manifest/lock漂移；README/VALIDATION同步安装步骤。负面测试删除独立安装步骤后保护断言失败，未用条件跳过或continue-on-error。

## 实测证据

环境：Node24.21.0、npm11.19.0、TypeScript5.9.3（实际tsc --version）、macOS arm64。隔离副本由git archive与受控变更文件建立，没有复制原node_modules；候选发布字段仅在副本用于阅读，完成后同步正式正文。

| Gate / 命令 | 结果 |
| --- | --- |
| 根 npm ci / plugin install --from-config | PASS，368包，审计0漏洞；插件报告已安装；已有install-script提示，不改全局设置 |
| 独立typed-trips npm ci | PASS，只安装1个开发依赖，审计0漏洞；在仓库外含空格目录也可重现 |
| typed-trips README check/demo/test | PASS，正常tsc通过，demo输出山城3与拒绝字符串原因，4组测试通过；不依赖Quartz祖先目录 |
| kb:examples | PASS，foundations13组 + typed-trips4组 |
| kb:check / kb:test | PASS，14 notes、0 errors、34校验测试含原负面fixtures与新增CI遗漏安装反例 |
| tsc / kb:build / kb:output | PASS，27 HTML、105产物、0内部链接或资源错误 |
| kb:publish-test | PASS，正面对照存在，3种禁发标记未进入任何衍生产物，注入泄漏被检测 |
| 完整 npm test | PASS，215 tests、45 suites、0失败/跳过 |
| 正文/练习 | PASS，完整代码段逐项匹配受测源码；F05改变await位置的练习另行执行并断言输出顺序；F06空白目的地与天数边界由测试覆盖 |
| 浏览器G7 | PASS，Chrome实际查看两篇1440×1000与390×844；每篇scrollWidth等于viewport，标题/先修/正文/代码语言可读；F05下一篇Enter打开F06 |
| 搜索/复制/颜色 | PASS，微任务→F05、unknown→F06，结果Enter打开正确URL/标题；F06类型定义复制显示成功标记，粘贴无行号；F05代码复制显示成功；F06明暗阅读可用 |
| G8 本批远端检查/部署 | NOT_RUN；本批没有新的发布授权，继续本地开发，上一批db02102已发布的证据不移作本批证据 |

根锁SHA256 `6564690aeccdb26ffa0878a378d4851391e2442cf32fb59ab08131945d76a1d0`；原foundations锁 `e814189ad8cc0f704cfce194b366374348efb07761a4c2b4a097895cd3133fe2`，均无漂移。新typed-trips锁 `9de2403f74c3dcea248fdf050f39614efcf646254b4cf22a6ec2b39960eb7bab` 在工作区、隔离构建与独立目录安装后相同。日志临时指针 /tmp/kb-h3b-path.txt、/tmp/kb-types-path.txt；持久依据为本文摘要及维护的测试文件。

## 失败路径确实执行

- F05 loadTrip返回Promise，直接读取destination得到undefined；await后取得山城。missing/空串/错类型均拒绝。
- 漏掉await的同步try不捕获后续拒绝；显式`--unhandled-rejections=strict`运行反例非零退出，只有“入口已离开try”的正常输出。
- F06同一个错误赋值：真实tsc报TS2322且定位1:7；Node直接执行却打印31。没有@ts-expect-error或删除负面用例。
- as断言通过正常静态检查，却打印string和31；运行时入口拒绝同样的字符串天数。
- 校验拒绝null/数组/缺字段/字段类型错误/空白目的地/非法范围/小数/NaN/Infinity；有效输入返回新对象、裁剪首尾空白、丢弃额外字段且原输入不变。

## 审阅与边界

作者自审后按“移动await预测先后”和“输入类型写对却数据不合约”两个读者任务二次阅读，不冒充独立专家评审。Promise示例明确用已兑现Promise观察微任务而不是测网络；F06先介绍type/标注/unknown/as再使用缩窄。讲明Node类型擦除不会校验、tsconfig不控制原生Node运行，catch未知值需识别Error。

编写时在线核对MDN async function/await、TypeScript Everyday Types/Narrowing/unknown/erasableSyntaxOnly与Node TypeScript文档，相关链接放在正文。官方当前文档版本与本例固定版本分开，命令和行为在24.21.0/5.9.3实测。

现有搜索摘要实体和命中片段定位质量问题仍见H4-001；没有声称本批解决。初次F06复制检查读到旧剪贴板，定位到可见代码区再次复制显示成功并粘贴正确内容，记录的是复核后的结果。字体网络/Excalidraw未安装但未使用警告沿用基线。未跑全仓格式化；只对自有变更格式化检查。typed-trips不是任意getter/Proxy的防御边界，目的地长度上限/唯一编号/鉴权/数据保存尚未实现。

## Git、恢复与下一项

本批按示例工程与教材记录分为小型本地提交，不推送/PR/tag。H3-001B完成，H3-001仍in_progress。下一项H3-001C：F07的HTML/CSS/DOM与表单桥接，可先拆1–2篇，不把表单教学塞入一篇全套前端教程。

本任务loopback预览已停止（退出143），浏览器视口已恢复、测试标签已关闭。工程已提交3a0996e，正文与本报告随后单独本地提交。下一会话先核对Git和STATE，再从H3-001C建计划并实现。
