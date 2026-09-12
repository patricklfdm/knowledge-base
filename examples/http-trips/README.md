# F08：HTTP 请求与失败边界

独立无依赖包，Node.js24.21.0/npm11.19.0实测；可复制到含空格路径，不需要Quartz或其他示例包。只使用公开合成数据。

在此目录执行：

```sh
npm ci
npm test
npm run demo
npm run errors
npm run fail
```

前四条成功。最后一条故意让HTTP404不被catch，必须非零退出；测试断言退出码1和HTTP404，不能把失败脚本加到正常成功命令链里。

- server.mjs：内置node:http演示响应，绑定127.0.0.1和系统分配端口，记录方法/请求目标/Accept。不读取任何磁盘目录、凭证或数据库。
- inspect.mjs：自动启动→一次GET→打印消息信息/原文/解析对象→finally关闭。
- client.mjs：getJson先检查response.ok，错误正文读成文字后报HTTP状态；成功正文按JSON解析。不保证业务结构，不是通用生产请求库。
- errors.mjs：显示原始fetch收到404仍resolve，与显式HTTP错误、坏JSON、断连的区别。
- failure.mjs：用finally清理，不捕获故意HTTP错误。
- http.test.mjs：8组真实本机HTTP测试和独立子进程退出验证。

| GET路径                         | 固定结果                                         |
| ------------------------------- | ------------------------------------------------ |
| /trips/t1 或 ?view=full         | 200，完整行程，days为数字3                       |
| /trips/t1?view=summary          | 200，只有id和destination                         |
| /trips/t1?view=unknown          | 400，错误JSON                                    |
| /trips/missing 或其他未定义路径 | 404，错误JSON                                    |
| /html-error                     | 500，HTML错误页                                  |
| /broken-json                    | 200+application/json，但正文故意损坏             |
| /wrong-shape                    | 200+合法JSON，但days是字符串，不符合业务要求     |
| /disconnect                     | 收到请求后在发送响应头前断开连接，没有HTTP状态码 |

所有非GET方法都返回405和Allow: GET，不写入任何记录。固定路由只用于实验，不是完整生产HTTP实现。

每条命令自行启停服务，端口每次变化，结束后无需人工reset。finally以及测试清理会关闭自己创建的连接；没有长期serve命令，不要把demo打印的已关闭地址当在线API。不部署此服务到Pages。若本机环境禁止监听端口，需要正常环境授权；不关闭保护绕过。

迁移练习：复制inspect.mjs，把view=full分别改summary和unknown，运行后对照正文；在自己的副本给读取流程添加response.ok检查。第二篇再修复“先text后json重复消费”，可直接对已读文字用JSON.parse，无需再次读取响应。

验证结果见仓库 reports/H3-http.md。本机GET/HTTP错误/断连/坏JSON/重复正文消费已实测；测试超时只是防挂住，不能当性能数字。实际浏览器、CORS、页面加载/错误反馈、DNS/TLS、超时重试均未测；浏览器相关项NOT_RUN：用户批准移至集中验收阶段。例子无用户自定义URL入口、没有鉴权/响应大小限制/重试/数据保存，不用于生产。
