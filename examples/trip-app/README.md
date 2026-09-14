# F11：页面、API、SQLite整合

独立无npm依赖，Node24.21.0，SQLite本机3.53.4。仅合成数据/本机教学。F09输入与F07字段转换按快照复制并维护，F10存储扩展UPDATE；不依赖兄弟目录。

```sh
cd examples/trip-app
npm ci
npm test
npm run demo
```

demo自动创建临时数据库，运行一个服务器进程，创建/修改/非法修改后关闭，再启动另一个进程读取，最后清理。基础应用与演进/冒烟合计13组，所有本机监听127.0.0.1随机端口、服务自行关闭；根测试也会运行它。

手动启动（只用新建教学目录）：

```sh
kb_app_dir=$(mktemp -d)
npm start -- "$kb_app_dir/trips.sqlite"
```

终端打印本次URL，以该URL提供页面和API。Ctrl+C关闭服务；在同一shell重复最后一条命令会打开同一文件，端口可能变化，数据库不会自动删除。实验结束、服务关闭后，可用 `rm -r "$kb_app_dir"` 清理自己本次创建的目录。不要填写用户现有库路径。未提供路径会明确退出，父目录必须存在。

2026-09-13已用Codex In-app Browser和本轮自建临时数据库完成基础应用的真实DOM/键盘创建、编辑、非法天数、取消提示/焦点、纯文本显示、busy等待/恢复与进程重启读回。见[UI报告](../../reports/H4-ui-acceptance.md)。真实屏幕阅读器、其他浏览器和保存成功后刷新失败的浏览器故障注入未运行；受控逻辑测试与真实UI证据分别列出。

| 请求             | 契约                                              |
| ---------------- | ------------------------------------------------- |
| GET /            | 教学页面；JS仅固定四个文件可读                    |
| GET /api/trips   | 按整数id排序的列表                                |
| POST /api/trips  | destination/days创建，201与Location               |
| GET /api/trips/1 | 读取已有记录，否则404                             |
| PUT /api/trips/1 | 完整替换destination/days，200；不自动创建缺失记录 |

API路径/id是本完整应用的新契约，旧F09例子不改。destination trim后1–80 UTF-16代码单元，days数字整数1–30；JSON正文实际1024字节上限、UTF-8/媒体类型规则同input.mjs；错误400/403/404/405/413/415/422和不泄漏内部细节的500。Host必须是打印URL的host；有Origin时须匹配该URL，无Origin的CLI允许。没有认证/跨源开放/生产加固；超限读完才响应的限制仍在。

- server/store/input：路由、绑定SQL与请求校验；数据库约束只是落库底线。
- serve/process/demo：启动、受控进程停止与重启证据。
- web/client：相对/api地址、HTTP状态和JSON。
- web/controller：转换、busy防重复、保存与刷新分开处理；view为可替换显示接口。
- web/app：真实DOM适配，textContent显示用户文字，修改按钮填回表单；基础应用已集中浏览器实测。

练习：对同一id连续PUT同样的5天，确认只有一行且days=5；提交31后重读，旧值仍5。测试覆盖相同行为。另一控制器练习：写入成功、列表刷新抛错时应提示“已保存，但列表刷新失败”，不能再次创建。测试用明确故障注入验证这一分支。

SQLite同步接口/默认隐式事务用于小数据；多客户端同时编辑是最后写入覆盖，没有版本冲突保护。重复POST仍会增加记录，按钮防重复不提供服务端幂等。断电/磁盘/备份/公网部署NOT_RUN。Pages只发布教材，不运行此动态应用。后续测试/部署课程继续补运行与演进证据。

## F12字段扩展与F13运行检查

`npm run exercise`只在新临时目录组装备注版本，迁移一条合成旧数据并重启读回，最后清理。基础F11接口/demo输出不变。exercises/build-note.mjs使用显式运行文件列表和唯一匹配补丁；找不到补丁位置就失败。note-input/note-fields/note-store是可读的覆盖文件，生成的base-*文件用于保留原校验；不是从任意Markdown执行代码。

备注缺省空串，必须string、最多120 UTF-16代码单元；完整PUT省略note会清空。SQL新增TEXT NOT NULL DEFAULT ''，长度由输入层保证。旧表迁移在事务内增加列与user_version=1，异常回滚；只支持本例已知结构/版本，不是通用生产迁移工具。页面字段、编辑填回、提交、显示均生成，源码/语法/HTTP资源和控制器已验证，真实DOM仍NOT_RUN。

应用运行时另开终端执行 `npm run smoke -- <serve打印的URL>`，只读页面/JS/列表，不写记录。成功打印pages与rows，失败非零。只接受127.0.0.1 HTTP，不是公网探测或浏览器测试。evolution.test.mjs验证迁移回滚、重复迁移、非法note、重启、只读冒烟和错误服务即使200也失败。
