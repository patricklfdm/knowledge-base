---
id: f07a-html-css-dom
title: 一段 HTML 怎样变成可以操作的页面？
description: 从标签和样式走到 DOM 与事件，用一个按钮更新行程预览，并区分页面代码和终端代码。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f06-types-input-validation]
topics: [html, css, dom]
tags: [frontend]
aliases: []
tested_with: [Node.js 24.21.0, Python 3.13.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[类型与输入校验](../01-languages/types-and-input-validation.md)，尤其是对象、函数和模块 · 目标：读懂一个最小网页，指出结构、样式与事件各在哪里。

核验：已复核来源、源码与 JavaScript 语法，静态文件通过本地 HTTP 文本请求验证。**浏览器点击与视觉检查 NOT_RUN：用户批准移至集中验收阶段**。以下页面效果是依据代码的预期，未列浏览器实测环境。

## 从打印一行文字，到改变一段文字

前面运行 `console.log("山城", 3)`，结果出现在终端。现在希望读者按一下按钮，在页面里看到“山城：3天”。数据没有更复杂，但多了三个问题：文字放在哪里？怎样排版？什么时候更新？

先把这三个职责分开。HTML 描述文档结构，CSS 给匹配的元素应用样式，JavaScript 在本例中响应操作、修改文档对象。它们可以协作，但不能互相代替：写一个按钮标签并不会自动替我们计算行程。

## HTML 是结构，不是截图

新建文件夹，放入下面介绍的三个文件。完整文件已放在仓库 [web-forms 示例](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/web-forms)，先阅读 `dom.html`、`dom.js` 和 `style.css`；下一篇才用 `index.html`。

`dom.html` 中的核心结构是以下摘录，完整文档还包含 head、编码、标题、样式链接和模块脚本：

```html
<main>
  <h1>行程文字预览</h1>
  <p>先观察按钮怎样改变一段文字；此页没有保存数据。</p>
  <button id="preview" type="button" disabled>预览合成行程</button>
  <p id="summary" role="status">等待预览</p>
</main>
```

`<p>` 是开始标签，`</p>` 是结束标签，里面的文字是内容，合起来表示一个段落元素（element）。main 包住本页主要内容，h1 是主标题，button 是按钮。这些名字描述用途，不能仅根据默认字体大小来选择标签。把标题写成普通段落再加大字号，结构语义仍是段落。[MDN HTML 语法](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax) 解释了元素、嵌套与属性。

`id="summary"` 是属性，用来标识这个元素；本页同一个 id 只能出现一次。`type="button"` 明确它是普通按钮。disabled 是布尔属性，写出来就禁用，不能用 `disabled="false"` 表示启用。示例先禁用按钮，等脚本装好监听器才启用；如果脚本没加载，页面保留初始文字，不冒充已经完成预览。

完整文件开头的 `<!doctype html>` 声明现代 HTML 文档模式；`lang="zh-CN"` 说明文档语言；`meta charset="utf-8"` 指定编码，避免把中文按错误编码解释。head 放这些文档信息，body 放页面内容。它们不是 JavaScript 对象里的字段。

## CSS 如何找到要排版的部分？

`dom.html` 的 head 通过 `<link rel="stylesheet" href="./style.css" />` 引入同目录文件。样式中的一条规则如下：

```css
main {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1rem;
}
```

main 是选择器（selector），选择所有 main 元素；大括号里每一项是“属性名: 值”。max-width 限制内容块最大宽度；rem 相对于根元素字号；上下外边距为0、左右auto在这里用于居中；padding 给边框以内留空。外边距与内边距不是同一块空间。[MDN CSS 入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS) 介绍了规则与选择器。

同一元素可能匹配多条规则，最终样式还受到层叠与继承影响，本篇先不展开。当前例子只用基础选择器、字号、间距和焦点轮廓，不引入布局框架。修改 style.css 的 padding 只能改变间距，不会改动目的地或把天数变成数字。

## DOM 是脚本操作文档的入口

浏览器解析 HTML 后建立文档对象模型（Document Object Model，DOM），脚本通过 document 访问它。HTML 文件是源文本，DOM 是运行时的节点结构；修改 DOM 通常不会反写硬盘上的 HTML 文件。

`dom.js` 的完整内容是：

```js
const button = document.querySelector("#preview")
const summary = document.querySelector("#summary")
if (button === null || summary === null) {
  throw new Error("页面缺少预览按钮或结果段落，请核对id")
}
button.addEventListener("click", () => {
  summary.textContent = "山城：3天（仅预览）"
})
button.disabled = false
```

querySelector 接受 CSS 选择器字符串，`#preview` 中的井号表示按 id 匹配。它返回第一个匹配元素，没有匹配则返回null。因此先检查缺失，再使用结果；选择器拼写错时，空值不会自动变成按钮。[MDN querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) 给出了返回值和无匹配行为。

addEventListener 注册事件监听器。这里的 `() => { ... }` 是没有参数的箭头函数：先把函数交给监听器，click 事件发生时再调用。注册本身不会立即执行花括号里的赋值。最后启用按钮后，用户才有可操作入口。[MDN 事件入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events) 说明了事件与处理函数的关系。

textContent 把结果写成纯文本。如果将来目的地输入是 `<b>山城</b>`，我们希望显示这些字符，而不是把用户输入解释成页面标签，因此这里不用innerHTML拼接输入。[MDN textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) 说明了纯文本与 HTML 解析的区别。这个选择不代表整个应用已经完成安全审计。

## 怎样运行，怎样定位失败？

在仓库根目录执行：

```sh
cd examples/web-forms
npm ci
npm test
python3 -m http.server 8080 --bind 127.0.0.1
```

Node 使用24.21.0；此包没有 npm 依赖。Python3.13.0只提供本机静态文件，不承担业务接口。只在这个公开示例目录启动服务，读者可访问 `http://127.0.0.1:8080/dom.html`；端口被占用就换一个空闲端口，Ctrl+C停止。不要在私人资料目录启动服务。

HTML 中 `script type="module" src="./dom.js"` 让浏览器按模块加载文件，解析完文档后执行这个普通模块脚本；本例没有async属性。使用HTTP服务，避免直接双击HTML后file协议引起模块加载限制。[MDN JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 说明了模块加载与本地测试的注意事项。

本轮 npm test 的语法检查能发现 JS 拼写/语法错误，却没有 DOM 环境，不能证明点击有效。若直接 `node dom.js`，本轮实测因没有document而失败（ReferenceError，非零退出）；Node能执行JS，并不表示它提供浏览器文档。反过来，静态服务返回HTTP200只证明文件可读取，也不能证明脚本正确运行。

读者之后实际打开页面时，可按以下线索排查：按钮一直禁用，先看脚本是否加载；报“页面缺少…”，核对HTML的id和JS选择器；文字已改变但刷新恢复初始值，这是只修改内存中的DOM，没有保存数据。不要在没有证据时先重装依赖。

## 练习：只改一侧的 id

在自己的副本里，把HTML的 `id="summary"` 改成 `id="result"`，保留JavaScript不变，先预测结果，再解释该改哪一行。随后让按钮改写成另一组合成行程文字。

参考：旧选择器找不到目标，summary得到null，显式检查抛错，启用按钮那行不会执行。需要同步改为 `querySelector("#result")`。第二个修改发生在textContent赋值处，不在CSS里。此练习的浏览器结果目前未实测；可在集中交互验收时执行。

下一篇：[表单怎样把文字输入变成合法行程？](form-input-boundary.md) · [返回路线](../../roadmaps/fullstack-foundations.md)
