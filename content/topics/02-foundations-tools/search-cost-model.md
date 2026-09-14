---
id: y01-search-cost-model
title: 数据变多以后，查找工作量怎样增长？
description: 用线性与二分边界查找比较操作次数，分清预处理、空间和实际耗时。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [f04-modules-errors]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

一份行程清单有十六项时，逐项扫描没有明显负担；变成一千项后，要先知道哪里增加了工作量。先会[数组与对象](../01-languages/objects-and-arrays.md)和[模块与错误](../01-languages/modules-and-errors.md)。本篇寻找“第一个大于或等于目标的数”，未找到则返回数组长度，这叫下界（lower bound），返回的可能只是插入位置。

## 先约定成本是什么

search.mjs为每次读取一个候选数组元素计一次probe。线性查找从左向右检查；二分查找利用**已升序排列**这一前提，每轮缩小候选区间。我们统计probe，而不把机器运行毫秒数冒充算法性质。成本模型需要说清基本操作，增长级别与实际机器时间也不同。[算法分析教材原始资料](https://algs4.cs.princeton.edu/14analysis/)

```js
let lo = 0, hi = sorted.length, probes = 0
while (lo < hi) {
  const mid = lo + Math.floor((hi - lo) / 2)
  probes++
  if (sorted[mid] < target) lo = mid + 1
  else hi = mid
}
return { index: lo, probes }
```

这是维护lowerBound的循环。区间左闭右开[lo,hi)，右端不参与本轮候选。若中点值偏小，中点及左边都排除；否则中点仍可能是答案，保留它作为右边界。循环结束的lo可等于数组长度，不能无条件拿sorted[lo]当已找到的元素。

## 通过实际次数检查推导

对0、2、4直到2(n−1)的数组，查找2n。它比所有元素都大，线性查找检查全部n项。实测n=16时两种probe为16和4，n=1024时为1024和10，返回位置都等于n。二分每轮约减半，这个特定输入经过log₂n轮；并不是任意目标的次数都恰好相同。

通常用O(n)、O(log n)表达输入增长时的渐近上界，省略常数不意味着常数不存在。空数组、命中第一项和重复值会影响实际次数。O(log n)不保证一次小数组查找的毫秒数更小，也不能直接变成请求吞吐量结论。

## 预处理不能从账本中消失

prepare复制并按数值排序，验证有限数后冻结数组；原数组保持不变。复制需要随n增长的额外存储，排序有自己的代价。lowerBound不在每次查询前重新扫描确认有序，否则这段验证本身就至少检查n项。调用者必须遵守“先准备一次，再多次查询”的契约。

这也解释了数据结构选择：数组保留位置顺序，按键访问可考虑Map；SQL索引维护也用额外结构换取某些查询路径。读多写少和频繁插入的成本不同，不能只比较一次查找。这里没有实现平衡树/哈希表，也没有给JavaScript引擎排序指定未经核验的算法。

## 失败与迁移练习

真实测试覆盖空数组、单元素、负数、重复数、目标位于两项之间和超出两端；用独立的预期位置检查结果。NaN、Infinity和字符串输入被prepare拒绝；更改冻结副本失败。独立故障对照把hi=mid改成hi=mid−1，原边界测试必须失败。

练习：给[1,2,2,5]查找2，逐轮写出lo/hi/mid并核对最左位置；改成找“严格大于”时，哪一个比较条件需要变化？再比较只查询一次和查询一万次时，是否值得先排序；列出预处理、查询次数和更新频率，别只背复杂度符号。

真实耗时的方法参见[先验正确性再测量](../01-languages/java-measurement-and-evidence.md)。下一篇观察[进程的输入、输出与退出](process-interfaces.md)，把函数调用之外的成本边界也明确下来。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run basics --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
