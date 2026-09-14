---
id: y04-file-publication-boundaries
title: 文件替换报错以后，读者看到的是旧版还是新版？
description: 区分候选文件、重命名可见性、同步和确认结果，用明确故障点验证状态。
note_type: tutorial
level: L2
status: reviewed
draft: false
publish: true
prerequisites: [y03-stream-boundaries]
topics: [systems]
tags: [engineering]
aliases: []
tested_with: [Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

## 场景与先修

你要把一份状态JSON替换成新版。若直接打开目标并截断后逐步写入，中途失败可能只留下半份内容。先理解[流与错误传播](stream-boundaries.md)，然后把“准备内容”“让读者看到”“确认完成”拆成不同步骤。

## 先准备候选，再替换名称

file-publish.mjs只在调用者自己创建的目录中工作，由单个写者发布不超过4096字节的小JSON。它在该目录下建立独有候选目录，独占创建文件，完整写入后对文件调用fsync并关闭，再rename到state.json，最后对目标父目录同步。

```text
生成完整JSON → 创建候选文件 → 写入并fsync → 关闭
             → rename到state.json → 同步目标目录 → 返回
```

候选和目标位于同一文件系统。不要把任意跨磁盘移动等同这一步rename，更不能先删除目标再重命名。Linux的rename手册描述了已有目标的原子替换及打开描述符不变；本机macOS实验也实际观察了旧句柄读旧内容、新路径读新内容。[Linux man-pages：rename](https://man7.org/linux/man-pages/man2/rename.2.html)

这种可见性说的是路径切换，不是多个文件一起提交，也不保证并发写者不会相互覆盖。若两个写者都根据旧状态产生新版，还需要另外的并发控制；原子rename并没有替你完成读改写事务。

## 文件同步与目录同步并非同一个动作

写入调用返回，不代表字节已经经过全部缓存到达物理介质。fsync请求同步相应文件；文件名所在目录也涉及元数据，所以只同步候选内容与确认目标名称不是同一件事。平台语义参见[fsync手册](https://man7.org/linux/man-pages/man2/fsync.2.html)和[Node固定版本文件API](https://github.com/nodejs/node/blob/v24.21.0/doc/api/fs.md)。

维护代码实际调用这些同步操作，但测试没有拔电源、破坏磁盘控制器或验证网络文件系统。它不把一次成功返回升级为所有硬件上的断电持久性承诺；硬件和文件系统假设必须另行核验。

## 在两个位置失败，结果不同

代码为教学测试提供before-rename和after-rename两个阶段钩子。重命名前抛错，原state.json仍为旧值；重命名后、目录同步前抛错，按路径读取已经看到新值。于是“函数抛错”不能一律解释为“什么也没发生”。生产调用者如果不知道发布进行到哪一步，应重新核对目标版本，而非盲目重复递增操作。

测试还启动真实子进程，让它在这两个位置直接退出17，跳过finally。父进程分别读到完整旧版和新版；候选目录因突然退出而残留，最终由拥有整个实验目录的父测试清理。这是进程中止实验，不是机器断电实验。普通抛异常路径则会执行finally，候选目录被删除。

## 验证与迁移练习

验证覆盖成功替换、旧文件描述符继续读旧内容、按路径读新内容、两种故障点、超大JSON拒绝与正常清理。测试目录由每次测试新建，不接收真实项目状态路径。

练习：先预测旧句柄和新打开句柄各读取哪一版，再运行。将故障点移到rename之后，解释为什么不能在catch中直接宣布“已回滚”；如果要发布两份互相关联的文件，列出只替换其中一份后读者可能看到的组合。

下一篇用[日志与快照](log-snapshot-replay.md)说明多个文件的恢复顺序。若需要数据库事务，应使用数据库提供的机制，不能从这份小JSON发布器推导出完整存储引擎。

## 运行与验证

仓库根目录使用固定Node24.21.0；维护例子在[examples/systems-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/systems-basics)。

```sh
npm ci --prefix examples/systems-basics
npm run storage --prefix examples/systems-basics
npm test --prefix examples/systems-basics
```

测试只使用合成数据与自建临时资源，结束清理。正文结果来自实跑，未运行的硬件/生产场景不扩成保证。浏览器 **NOT_RUN：用户批准全部规划内容完成后集中验收**。
