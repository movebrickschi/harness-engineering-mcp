---
name: perf-flow
description: |
  性能优化全流程。先 benchmark 立基线 → profile 找瓶颈 → 单一变量优化 → 再 benchmark
  对比。禁止"凭感觉优化"，每个改动必须带数据证明。
  Use when optimizing for performance, page speed, web vitals, or backend latency.
  Voice triggers: "性能优化", "/perf-flow", "提速".
version: 0.1.0
applies_to: [all]
priority: P1
usage_frequency: weekly
depends_on: []
related: [verification-before-completion]
---

# perf-flow

## 适用场景

页面慢、接口慢、内存高、CPU 高、bundle 大等性能问题。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外 `perf_target`（待优化的页面/接口/作业）+ `perf_metric`（耗时？吞吐？内存？）+ `perf_goal`（目标值）。

## 流程步骤

### 阶段 0 · 上下文初始化

`move_agent_to_root`；建知识库目录（极简 `META.md`）。

### 阶段 1 · 基线 benchmark

- 用 `/benchmark`（前端 web vitals）或 `cursor-ide-browser` 的 `browser_profile_start/stop`（性能录制）建立基线
- 后端：用现有 APM、日志、`ab/wrk/k6` 跑基准
- 输出 `PERF_BASELINE.md`：当前数值 + 测试条件 + 数据样本

### 阶段 2 · Profile 找瓶颈

- 前端：Chrome Performance、`browser_profile_*`、`/benchmark` 的 web vitals 拆解
- 后端：APM 火焰图、慢日志、DB explain
- 输出 `BOTTLENECK.md`：top 3 热点 + 数据证据

### 阶段 3 · 优化方案 + 卡点

```text
prompt: "瓶颈定位完成（BOTTLENECK.md）。优化方案："
options:
  - "方案 A（首选）"
  - "方案 B（更激进）"
  - "需要更多 profile"
```

### 阶段 4 · 单一变量优化

- 每次只改一处，commit `perf(scope): 优化 [瓶颈点]`
- 改完立刻 micro-benchmark 对比，写入 `PERF_DIFF_[step].md`

### 阶段 5 · 全量 re-benchmark

- 用阶段 1 同条件再跑一遍 `/benchmark`
- 输出 `PERF_FINAL.md`：基线 vs 终态对比
- 未达 `perf_goal` → 回阶段 2 再 profile

### 阶段 6 · 自查

`/qa`（确保功能未退化）+ `/review`。

### 阶段 7 · 上线

`/ship` → `/land-and-deploy` → `/canary`（重点监控同指标）。

### 阶段 8 · 复盘

append `_lessons.md`：瓶颈类型 + 优化手法 + 收益数据。

## 错误处理

- 优化后功能 broken → 立即 revert，回阶段 2 找新瓶颈
- benchmark 数据波动太大 → 增加样本数 / 固定测试环境
- 达不到 goal 但已无明显瓶颈 → 与用户讨论调整 goal 或更换方案

## 产物清单

`META.md`、`PERF_BASELINE.md`、`BOTTLENECK.md`、若干 `PERF_DIFF_*.md`、`PERF_FINAL.md`、PR 链接。

## 支持的修饰符

无标准修饰符；可叠加 M4（如优化包含建索引/分表）→ 必出 `MIGRATION_PLAN.md`。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- **强依赖 `/benchmark`** 与 `cursor-ide-browser` profile 工具
- 自查：`/qa`、`/review`
- 上线：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
