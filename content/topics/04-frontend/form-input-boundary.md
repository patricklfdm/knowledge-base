---
id: f07b-form-input-boundary
title: 表单怎样把文字输入变成合法行程？
description: 用 FormData 收集字段，在明确边界转换天数，并让合法输入和失败反馈走不同路径。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [f07a-html-css-dom]
topics: [forms, validation, dom]
tags: [frontend]
aliases: []
tested_with: [Node.js 24.21.0, Python 3.13.0, macOS arm64]
verified_on: 2026-09-11
---

难度 **L0** · 先修：[HTML/CSS/DOM](html-css-dom.md) · 目标：从表单文字生成 `{ destination, days }`，说明为什么转换和校验都不可省略。

核验：Node24.21.0下的输入转换、正常/边界/失败及独立运行已测试；HTTP只验证静态文件。**真实提交、Enter、焦点及屏幕阅读器反馈 NOT_RUN：用户批准移至集中验收阶段**。本例只有预览，没有API、持久化或已完成产品的承诺。

## 为什么不能直接把“3”交给上一层？

F06的parseTrip要求days是number，字符串 `"3"` 会被拒绝。这个要求没有错。表单是另一种输入边界：用户敲下的字符先是文字，需要制定“接受什么文字、如何转换”的规则，之后才得到业务对象。

假设目的地填 `山城`，天数填 `3`。我们决定：去除首尾空白，目的地不能空；天数只接受十进制数字字符组成的整数文字，允许 `03`，拒绝 `3.0`、`+3`、`3e0`；转换后的数值仍须是1–30。格式规则与数值规则回答的是不同问题，不能仅靠一次Number调用表达全部要求。

## label、id 与 name 各负责什么？

完整例子在 [web-forms 目录](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/web-forms)。`index.html` 中的表单核心如下；完整文件另外包含模块脚本、提示段落和反馈区域：

```html
<form id="trip-form" novalidate>
  <label for="destination">目的地</label>
  <input id="destination" name="destination" type="text" required />
  <label for="days">天数（1–30）</label>
  <input id="days" name="days" type="text" inputmode="numeric" required />
  <button id="submit" type="submit" disabled>生成预览</button>
</form>
```

label给控件文字标签，for对应控件id；id也可供DOM选择器定位；name则是收集表单数据时使用的字段名。三者有关联，但不是一个概念。删除name后，标签可能仍然显示正常，FormData却不再按这个名字收集该输入。[MDN label](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label) 与 [FormData 构造器](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) 分别说明了标签关联和字段收集。

本例选择text控件，以保留我们要解释的文字边界。[inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode) 提示设备适合的输入键盘，不负责验证。required保留必填语义；novalidate让提交时不走浏览器内建交互校验，由下面的JS统一给出业务错误。这样安排是为了教学规则一致，并不意味着每个表单都应该关闭内建校验。[MDN 表单约束验证](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation) 说明了约束与novalidate的作用。

## submit 表示提交意图，不代表已经保存

`form.js` 先用querySelector取得form、feedback、summary和submit按钮，并检查它们不为null。其监听器主体如下：

```js
form.addEventListener("submit", (event) => {
  event.preventDefault()
  const data = new FormData(form)
  try {
    const trip = parseTripFields(data.get("destination"), data.get("days"))
    feedback.textContent = ""
    summary.textContent = trip.destination + "：" + trip.days + "天（仅预览，未保存）"
  } catch (error) {
    if (!(error instanceof Error)) throw error
    summary.textContent = ""
    feedback.textContent = "未生成预览：" + error.message
    feedback.focus()
  }
})
```

这是依赖前面DOM变量和fields.js导入的摘录，不能单独粘到终端执行。event是浏览器传给处理函数的事件对象。preventDefault取消这次事件的默认提交行为；随后我们只在本地生成预览，不发保存请求。监听form的submit，而非只监听按钮click，可以统一处理按钮提交和满足条件的键盘提交意图；真实键盘行为仍需另行验证。[MDN submit事件](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) 说明了提交事件的触发条件。

new FormData(form)收集当前可提交的带name字段。get读取某个名字的第一个值，缺失时为null；文本字段通常给string，文件字段可能给File。不能把get的结果无条件当成数字，也不能假设所有字段都存在。[MDN FormData.get](https://developer.mozilla.org/en-US/docs/Web/API/FormData/get) 描述了读取行为。

## 把转换规则写成不依赖页面的函数

`fields.js` 的完整内容如下。它接收两个值，不读取document，也不保存数据，因此可以先在Node中验证规则。

```js
export function parseTripFields(destinationText, daysText) {
  if (typeof destinationText !== "string" || typeof daysText !== "string") {
    throw new Error("目的地和天数必须是文字字段")
  }
  const destination = destinationText.trim()
  const digits = daysText.trim()
  if (destination.length === 0) {
    throw new Error("目的地不能为空")
  }
  if (!/^[0-9]+$/.test(digits)) {
    throw new Error("天数请填写十进制整数文字，例如3")
  }
  const days = Number(digits)
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error("天数必须是1到30的整数")
  }
  return { destination: destination, days: days }
}
```

先检查类型，避免对null或数字调用trim。正则表达式 `/^[0-9]+$/` 是一条文字匹配规则：`^` 从开头匹配，`[0-9]` 表示一个ASCII数字，`+` 表示至少一个，`$` 要求到结尾；test返回是否匹配。这里的规则刻意拒绝符号、小数点、字母和全角数字。先trim也意味着首尾换行会移除，但中间空白仍被拒绝。[MDN 正则断言](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Assertions) 解释了边界匹配。

Number负责转换，Number.isInteger与范围条件负责业务要求。`Number("")` 是0，`Number("3e0")` 是3；后者数值合法，却不符合本例规定的输入格式，所以先检查文字。不要以 `parseInt("3天")` 得到3作为合法证据，它会接受数字前缀，忽略后面的无效文字。[MDN Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) 和 [parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt) 说明了转换区别。

这个函数最终返回新对象，days已经是数字。F06的TypeScript示例仍严格要求数字类型；这里使用普通JavaScript，是为了直接供浏览器模块加载，未引入类型编译器或打包器。后续API会继续独立校验业务数据，客户端函数不能代替服务器边界。

## 成功和失败应该让人看懂

成功文字特意带“未保存”。非法输入则显示具体原因，并保留字段内容供读者修改。完整HTML把成功状态summary和错误说明feedback分开：前者带 `role="status"`，用于表达状态更新且不主动获取焦点；后者带 `tabindex="-1"`，允许脚本移入焦点，而不加入普通Tab顺序。两种结果互相清空，避免新错误旁仍显示旧成功。[MDN status角色](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) 建议状态更新不移动焦点；[tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) 文档说明了负值的用途。是否产生清晰且不重复的辅助技术反馈，需要真实环境验证，当前没有这份证据。

页面始终用textContent写文字，目的地 `<b>山城</b>` 不被我们的代码拼成HTML模板。测试证明校验函数保留了这段文字，但这不是浏览器注入防护测试。目的地长度上限、权限和编号尚未实现；客户端代码还可以被改写或绕开，因此未来服务端必须再次验证。[MDN 客户端校验](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation) 说明了客户端校验的边界。

## 运行结果与改变条件的练习

在 `examples/web-forms` 内，用Node24执行：

```sh
npm ci
npm test
npm run demo
npm run fail
```

此包无 npm 依赖。demo实测打印：

```text
山城 3 number
拒绝：天数请填写十进制整数文字，例如3
```

fail故意传31，实测非零退出，错误是“天数必须是1到30的整数”。测试断言了正常边界1/30、首尾空白/前导零、缺字段、非字符串、错误格式、越界、独立返回对象与入口退出码。浏览器脚本只做语法检查。

现在把上限改成14。在自己的副本同时修改函数里的上限、错误文字、HTML提示和测试，预测14/15各走哪条路径，再运行测试。参考：14通过、15范围失败；`3e0`仍在格式检查处失败，限制变小并没有改变格式。这个14/15的规则变更已在隔离副本验证；修改HTML后实际提示与键盘反馈仍待浏览器验收。

读者要运行页面时，沿上一篇的Python静态服务步骤访问本机根页。刷新会丢掉预览，这符合本篇没有持久化的范围。下一篇：[一次HTTP请求里，究竟传了什么？](../03-web/http-request-response.md)，再讨论怎样真正把数据交给接口。

[返回页面与DOM](html-css-dom.md) · [返回全栈基础路线](../../roadmaps/fullstack-foundations.md)
