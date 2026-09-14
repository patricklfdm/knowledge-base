# 搜索与AI应用参考实验

固定CPython3.13.0标准库、Node24.21.0桥，无新增第三方依赖。不接外部模型、真实用户资料或付费API，不替换Quartz站内搜索。KB_PYTHON可指向固定解释器，版本不符失败，不改全局环境。

```sh
npm ci --prefix examples/search-lab
npm test --prefix examples/search-lab
npm run search --prefix examples/search-lab
npm run evaluate --prefix examples/search-lab
```

从仓库根运行，或复制本目录到自有含空格临时目录npm ci --offline后运行。可用固定Python创建venv --without-pip，命令级KB_PYTHON指向venv/bin/python；run.py使用-I -B，零测试失败，未知入口退出2。当前31项Python unittest由一个Node桥执行，不混算测试数量。

corpus.json六条均为本仓库新写的合成摘要（包括internal可见性fixture，没有真实秘密），5条public参与候选与统计。queries.json由作者定义相关性，3 dev/4 eval；没有调参，不能冒称未接触过的外部盲测。NFKC+casefold，基本汉字双字词元与ASCII词元，不是完整中文分词或语义召回。最多24文档/正文512字符/标题80字符/查询128字符/k<=5；规范化索引内容+规则摘要不是认证。Index只在内存构建。

search的SQL索引首项sql-index；overlap与BM25式评分均可解释，后者固定k1=1.2/b=.75与正值idf变体，并非Lucene服务。evaluate的3条有答案eval查询中2条第一位命中，1条同义改写失败，宏P@2=1/3、Recall@2=2/3、MRR@2=2/3；无答案1/1正确不返回。两方法在此集相同，不声称效果提升。输出含语料/标注摘要及逐条记录；未知标注/重复结果/规范化词元集合重复查询/空split被拒绝。

独立故意错误：复制目录中把evaluation.py的hits/k改成hits/max(1,len(top))，原精确率分母断言应失败；恢复原字节再测试。勿从任意Markdown抽取命令执行。浏览器、真实模型、真实召回质量/吞吐与生产授权系统NOT_RUN。

## 上下文与受限响应

```sh
npm run context --prefix examples/search-lab
npm run workflow --prefix examples/search-lab
```

context按句子及80字符上限切片，保留原文偏移/文档摘要；检索前2文档，再按片段词元重合选择，默认160来源字符/2片段。预算不含完整请求开销，也不是token。HTTP超时实测选中15字符的http-timeout:0原句；没有证据返回abstained。摘要绑定本次问题/策略/预算/来源，不是认证。

输出只含context_sha256/status/citations；4096响应字节、UTF-8、重复键、字段、枚举、回答与引用一致性、允许chunk_id、精确quote逐层校验。无自由生成正文，因此只证明引用来自所选片段，不证明资料真实或答案相关。adapter收到深拷贝，不能通过改同一对象改变验证依据。

workflow默认2次/2逻辑单位、每次1单位，调用前扣除；只重试TransientFailure，永久失败/非法输出停止，无片段不调用。实测transient→ok成功余0、1单位时只调用一次后budget_exhausted、非法输出立即停止余1。逻辑单位不是货币/token/延迟；同步adapter无请求级超时/取消。外层Node入口60秒进程超时不等于生产取消协议。

ScriptedAdapter仅受控fixture，未调用LLM；有指令外观的合成资料可以被原样引用，但程序没有工具执行器，tool字段拒绝。这是本地协议边界测试，不是提示注入防御评测或任意Python代码沙箱。所有fixture公开可读，internal不是保密机制。

独立故意错误可在副本删除answers.py的quote相等守卫，或workflow.py的remaining < call_cost守卫，原套件应失败；恢复原字节后必须通过。全部维护入口为test/search/evaluate/context/workflow，不从正文提取任意命令。
