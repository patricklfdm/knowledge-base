---
id: j04-java-collections-and-copies
title: 复制列表，怎样才能不共享行程的修改？
description: 从List和Map开始，理解泛型、循环、键查找以及容器复制与元素复制的边界。
note_type: tutorial
level: L0
status: reviewed
draft: false
publish: true
prerequisites: [j03-java-objects-and-references]
topics: [java]
tags: [languages]
aliases: []
tested_with: [Microsoft OpenJDK 21.0.11+10, Node.js 24.21.0, macOS arm64]
verified_on: 2026-09-13
---

难度 **L0** · 先修：[对象与引用](java-objects-and-references.md) · 目标：管理多个行程，区分列表结构、元素状态以及按编号查找的规则。

## List保存顺序，泛型约束元素类型

```java
List<TripModel> trips = new ArrayList<>();
trips.add(new TripModel("山城", 3));
trips.add(new TripModel("海湾", 2));
int total = 0;
for (TripModel trip : trips) total += trip.days();
```

`import java.util.List` 等导入声明让代码用短类名，完整导入见 `CollectionLesson.java`。List是列表接口，ArrayList是这里选择的具体实现；下一篇会解释接口。`<TripModel>` 是泛型（generic）类型参数，表示这里的元素是TripModel。它让误加String在编译时失败，既不校验对象天数，也不自动创建对象副本。

增强for循环每次把一个元素交给局部变量trip；`+=` 累加天数，两个行程合计5。列表下标从0开始，`get(0)` 取第一项，`size()` 取元素数量。空列表不能直接get(0)，应先按需求检查是否为空；本例在确认已添加后取首项。

## 三种复制保留的东西不同

```java
List<TripModel> shallow = new ArrayList<>(trips);
List<TripModel> readonly = List.copyOf(trips);
List<TripModel> detached = new ArrayList<>();
for (TripModel trip : trips) detached.add(trip.copy());
```

第一种新建了列表结构，但元素仍是原引用。原列表删除第二项后，原列表size为1，shallow仍为2；这不代表元素已经独立。将第一项改成7天，shallow和readonly中的第一项也读到7，detached读到复制时的3。

`List.copyOf` 返回不可修改的列表，不能通过它add/remove/set，测试中add抛 `UnsupportedOperationException`；它并没有冻结可变元素。[List 官方约定](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)明确区分不可修改列表和可变元素。不要依赖返回列表的对象身份，也不要把该操作当作任意对象图的深复制。

## Map回答“这个编号对应哪个行程”

```java
Map<String, TripModel> byId = new HashMap<>();
if (byId.containsKey("t1")) throw new IllegalArgumentException("重复编号");
byId.put("t1", trips.get(0));
TripModel found = byId.get("t1");
```

Map中的一个键至多对应一个值。直接put同一个键会替换旧映射；若业务禁止重复，必须像维护的addUnique那样明确拒绝。测试中重复t1被拒绝，原来的山城仍在。这个“先查再加”是单线程示例，不是并发原子操作。

get缺失键返回null。本例不存null值，因此可以把null解释为缺失；如果允许null值，还需区分“存在但值为null”。HashMap没有本例可依赖的遍历顺序，不要用它的打印顺序作为稳定输出断言。键比较、缺失与顺序边界见 [Map文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)。本例选不可变String作编号，避免修改键影响查找。

## 删除与迁移练习

维护例子最后用 `trips.removeIf(trip -> trip.days() > 5)` 删除超过5天的项目。箭头表达式是lambda：把一个接收trip、返回布尔值的小规则传给removeIf，不是在这行立即执行一次判断。该API在遍历中按规则删除，见 [Collection.removeIf](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html#removeIf(java.util.function.Predicate))。不要在增强for循环里随意对原列表执行结构删除。

练习：要求“列表结构不能被调用者改，行程天数也不能随原对象改变”。先预测仅List.copyOf能否满足，再组合逐元素copy与List.copyOf，验证原对象改天数后副本保留旧值。当前TripModel的复制边界仍只覆盖String/int。

下一篇：[接口和异常怎样划清调用契约？](java-interfaces-and-exceptions.md)

## 运行与验证

在仓库根目录使用Node24.21.0与Microsoft JDK21.0.11；将占位路径替换为实际JDK根目录。`npm ci`不安装JDK，Node只编排真实javac/java，产物在自建临时目录并清理。

```sh
npm ci --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm run collections --prefix examples/java-basics
KB_JAVA_HOME="/path/to/jdk21" npm test --prefix examples/java-basics
```

维护源码与完整测试见[java-basics](https://github.com/patricklfdm/knowledge-base/tree/v5/examples/java-basics)。正文中的结果来自实际运行；浏览器 **NOT_RUN：用户批准内容建设完成后集中验收**。
