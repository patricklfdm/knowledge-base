# 搜索与AI应用参考实验

固定CPython3.13.0标准库、Node24.21.0桥，无新增第三方依赖。不接外部模型、真实用户资料或付费API，不替换Quartz站内搜索。KB_PYTHON可指向固定解释器，版本不符失败，不改全局环境。

```sh
npm ci --prefix examples/search-lab
npm test --prefix examples/search-lab
npm run search --prefix examples/search-lab
npm run evaluate --prefix examples/search-lab
```

从仓库根运行，或复制本目录到自有含空格临时目录npm ci --offline后运行。可用固定Python创建venv --without-pip，命令级KB_PYTHON指向venv/bin/python；run.py使用-I -B，零测试失败，未知入口退出2。当前15项Python unittest由一个Node桥执行，不混算测试数量。

corpus.json六条均为本仓库新写的合成摘要（包括internal可见性fixture，没有真实秘密），5条public参与候选与统计。queries.json由作者定义相关性，3 dev/4 eval；没有调参，不能冒称未接触过的外部盲测。NFKC+casefold，基本汉字双字词元与ASCII词元，不是完整中文分词或语义召回。最多24文档/正文512字符/标题80字符/查询128字符/k<=5；规范化索引内容+规则摘要不是认证。Index只在内存构建。

search的SQL索引首项sql-index；overlap与BM25式评分均可解释，后者固定k1=1.2/b=.75与正值idf变体，并非Lucene服务。evaluate的3条有答案eval查询中2条第一位命中，1条同义改写失败，宏P@2=1/3、Recall@2=2/3、MRR@2=2/3；无答案1/1正确不返回。两方法在此集相同，不声称效果提升。输出含语料/标注摘要及逐条记录；未知标注/重复结果/规范化词元集合重复查询/空split被拒绝。

独立故意错误：复制目录中把evaluation.py的hits/k改成hits/max(1,len(top))，原精确率分母断言应失败；恢复原字节再测试。勿从任意Markdown抽取命令执行。浏览器、真实模型、真实召回质量/吞吐与生产授权系统NOT_RUN。
