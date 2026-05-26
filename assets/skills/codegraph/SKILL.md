---
name: codegraph
version: 0.1.0
description: Use when exploring unfamiliar codebases, tracing call chains, or assessing change impact — leverages CodeGraph's pre-indexed semantic graph to replace repetitive grep/read with structured queries, reducing tool calls ~70% and token usage ~59% on large projects.
applies_to: [all]
priority: P2
usage_frequency: weekly
depends_on: []
related: [dev-understand, systematic-debugging, refactor-flow, root-cause-tracing]
anti_triggers: [tiny project <50 files, no codegraph MCP server available]
---

# CodeGraph — 代码语义图谱加速

## Overview

AI agent 在大型代码库中的主要瓶颈不是推理，而是**发现**——反复 grep、逐文件读取来搞清楚函数在哪、谁调用了谁、改一行影响多大。

CodeGraph 在本地用 tree-sitter 解析代码库，构建符号级语义图谱（SQLite），通过 MCP 暴露查询工具。一次结构化查询替代十几次文件扫描。

**核心原则：CodeGraph 用于导航，不用于替代阅读源码。**

## When to Use

| 场景 | 触发信号 | 主要工具 |
|---|---|---|
| 项目上手 / 理解架构 | 首次接触项目、dev-understand 阶段 | `codegraph_context`, `codegraph_files` |
| 追踪调用链 | debug 阶段需要找"谁调用了这个函数" | `codegraph_callers`, `codegraph_callees` |
| 变更影响分析 | 重构前、修改公共接口前 | `codegraph_impact` |
| 符号快速定位 | 知道名字但不知道在哪 | `codegraph_search` |
| 跨文件关系理解 | 需要一次性看多个相关符号 | `codegraph_explore` |
| 索引健康确认 | 确认 CodeGraph 可用 | `codegraph_status` |

## When NOT to Use

- 项目 < 50 个文件（直接 grep/read 更快）
- 需要看最新未保存的改动（图谱有几秒延迟）
- 需要运行时行为分析（CodeGraph 是静态分析）
- 项目未初始化 CodeGraph（先 `codegraph init`）

## Prerequisites

```bash
# 全局安装（推荐）
npm i -g codegraph

# 项目初始化（在项目根目录执行一次）
codegraph init -i

# 验证 MCP 可用
# Cursor: .cursor/mcp.json 中已自动添加 codegraph 配置
```

确认方式：调用 `codegraph_status`，返回索引统计即可用。

## Tool Reference

### codegraph_context — 智能上下文构建（最重要）

根据任务意图一次性返回入口点、相关符号、代码片段。

```
intent: "explain" | "modify" | "debug" | "test"
symbol: 目标符号名
```

**使用时机**：拿到任务后的第一个动作，用它建立初始上下文。

### codegraph_search — 符号搜索

按名称跨代码库搜索函数、类、变量。

```
query: "UserService"
```

**使用时机**：知道名字但不确定位置时。

### codegraph_callers — 谁调用了它

查找所有调用指定函数/方法的位置。

```
symbol: "processPayment"
```

**使用时机**：debug 阶段反向追踪、评估修改影响。

### codegraph_callees — 它调用了谁

查找指定函数内部调用的所有函数。

```
symbol: "handleRequest"
```

**使用时机**：理解函数职责、判断复杂度。

### codegraph_impact — 变更影响分析

预测修改某符号后哪些代码会受影响（blast radius）。

```
symbol: "validateToken"
```

**使用时机**：重构前必用、修改公共 API 前必用。

### codegraph_node — 符号详情

获取特定符号的完整信息（签名、位置、可选源码）。

```
symbol: "AuthMiddleware"
include_source: true
```

### codegraph_explore — 多符号批量查看

一次返回多个相关符号的源码 + 关系图。

```
symbols: ["UserService", "UserRepository", "UserController"]
```

**使用时机**：需要同时理解一组相关类/函数。

### codegraph_files — 文件结构

返回已索引的文件树（比 ls -R 更快更结构化）。

### codegraph_status — 索引状态

返回语言分布、符号数量、最后同步时间。

**使用时机**：开始工作前确认 CodeGraph 可用且是最新。

## Integration with Existing Skills

### dev-understand 阶段

```
1. codegraph_status → 确认可用
2. codegraph_files → 获取项目结构概览
3. codegraph_context intent="explain" → 理解核心模块
4. 再用 Read 确认关键文件细节
```

### systematic-debugging 阶段

```
Phase 1 (Investigate):
1. codegraph_search → 定位报错函数
2. codegraph_callers → 反向追踪调用链
3. codegraph_callees → 正向追踪依赖
4. 缩小根因范围后再 Read 具体代码
```

### refactor-flow 阶段

```
Before refactoring:
1. codegraph_impact → 评估 blast radius
2. codegraph_callers → 找到所有需要同步修改的位置
3. 确认影响范围后制定分步计划
```

## Degradation Strategy

当 `codegraph_status` 调用失败（MCP server 不可用）时：

1. **不要阻塞工作流** — 自动降级到传统方式
2. 用 Grep 替代 `codegraph_search`
3. 用 Grep + Read 替代 `codegraph_callers`/`codegraph_callees`
4. 用文件树浏览替代 `codegraph_files`
5. 影响分析手动进行（搜索引用 + 人工判断）

## Anti-Patterns

| 反模式 | 正确做法 |
|---|---|
| 用 codegraph 结果直接做修改决策 | codegraph 导航 → Read 确认 → 再决策 |
| 小项目每次都走 codegraph | < 50 文件直接 grep/read |
| 忽略 codegraph_status 直接查询 | 先确认索引健康 |
| 把 codegraph 当全文搜索用 | 全文搜索用 Grep；codegraph 用于符号级语义查询 |
| 依赖 codegraph 做运行时分析 | CodeGraph 是静态分析，运行时行为需要 debug/log |

## Quick Decision Tree

```
需要理解代码？
├─ 项目 ≥ 50 文件 且 codegraph_status 可用？
│  ├─ YES → 用 CodeGraph 工具
│  └─ NO → 传统 Grep + Read
├─ 需要知道"谁调用了 X"？
│  └─ codegraph_callers → 比 grep "X(" 更精确（排除注释/字符串匹配）
├─ 需要评估修改影响？
│  └─ codegraph_impact → 给出完整 blast radius
└─ 只是想看某个文件？
   └─ 直接 Read，不需要 CodeGraph
```
