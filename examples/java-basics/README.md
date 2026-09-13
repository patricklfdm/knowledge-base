# Java 编译与运行：独立教学例子

使用合成行程摘要，直接调用真实 `javac` 和 `java`。不依赖 Maven、Gradle、第三方 Java 库或 npm 包。Node 24.21.0 仅组织测试；JDK 不由 npm 安装。

## 环境与命令

`.java-version` 固定 **21.0.11**；本机验收为 Microsoft OpenJDK 21.0.11+10/macOS arm64。必需 CI 使用 actions/setup-java 的 microsoft 发行版和同一版本文件。其他版本、Windows 与生产部署不在本例已验证范围内。

先选择自己已安装的对应 JDK 根目录，确认其中存在 `bin/java`、`bin/javac`，两条 `--version` 均为21.0.11。以下 `/path/to/jdk21` 是必须替换的占位路径。在仓库根目录运行：

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run demo --prefix examples/java-basics -- "海湾 城"
```

演示输出 `海湾 城: 3天`，无参数时 `山城: 3天`。完整根门禁同样需要 JDK：`KB_JAVA_HOME="/path/to/jdk21" npm run kb:verify`。也可使用已有的 `JAVA_HOME`（CI 自动设置）；`KB_JAVA_HOME` 优先，工具不回退到 PATH 上另一个 Java。没有合适 JDK 会明确失败，不跳过测试，不修改系统默认版本。

## 维护边界

`TripSummary.java` 是维护源码。`tools.mjs` 将其复制到名称含空格的自建临时目录，固定 UTF-8、目标 release21 和子进程英文诊断；对子进程移除外部 CLASSPATH 与 Java 附加选项以便重现，不修改父 shell 配置。编译、启动都有超时；测试与演示结束时清理自身源码副本和 class，不接受用户数据库或产物目录。

七组真实测试覆盖默认/中文参数、类型错误、错误类路径与类名、缺 main、公开类文件名、旧 class 与重新编译，以及 CLI、清理和缺 JDK 失败。演示在编译非零时停止，不运行旧产物。测试刻意保留旧产物以展示：改源码未编译，或者后续编译失败，都不意味着已有 class 随之更新或删除。

故障注入仅在独立副本：把 `int days = 3;` 改为4，测试必须失败；恢复源码后再跑。不要以“命令退出0”替代对实际摘要的断言。

正文与手工命令见 [Java 编译运行](../../content/topics/01-languages/java-compile-and-run.md)。浏览器延期；没有 JAR、包、多文件构建、对象建模或输入合法性结论。

## J01/J02：值、类型与输入

新增NumericValues.java演示拼接/整数除法/运算前后提升，DaysInput.java分离纯parse与CLI错误边界。使用同一JDK21.0.11，仓库根目录命令：

```sh
KB_JAVA_HOME="/path/to/jdk21" npm run values --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run input --prefix examples/java-basics -- 3
KB_JAVA_HOME="/path/to/jdk21" npm run input --prefix examples/java-basics -- 31
```

路径为需替换的占位值。最后一条故意退出2，stderr业务错误且无成功摘要；两条新入口只编译允许清单中的维护源码，不能从任意Markdown运行代码。npm test现在显式覆盖全部*.test.mjs：J00七组加本单元八组，合计15组。输入只接受ASCII数字串、允许前导零、不trim，表示范围及1–30业务范围分开；null由Java直接调用测试覆盖。无数据库/文件业务写入，不以纯解析实验声称生产事务保障。

在独立副本删除DaysInput的`|| days > 30`，原边界测试应失败，再恢复。两篇正文：[值与运算](../../content/topics/01-languages/java-values-and-operations.md)、[输入校验](../../content/topics/01-languages/java-input-validation.md)。

## J03–J05：对象、集合与调用契约

新增`npm run objects`、`npm run collections`、`npm run contracts`（均在本包执行，或在根加`--prefix examples/java-basics`）。沿前述KB_JAVA_HOME环境运行；contracts默认成功，追加`-- missing`预期退出2。TripModel为共享模型，三个维护示例和objects.test.mjs新增7组，包内累计22组。测试实际比较别名/复制、修改失败原值保留、容器与元素共享、缺失/重复、接口实现，以及private/泛型/受检异常编译失败。

不把List.copyOf叫作深复制；不把单线程Map先查再写叫作并发原子操作。独立副本把TripModel.copy改成返回this时原测试必须失败。
