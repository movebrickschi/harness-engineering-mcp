---
name: dev-flow-oneliner-be
description: |
  一句话后端需求（如"加个 X 字段查询"）。轻量级流程：补迷你 PRD + 必出 API 契约
  与 IMPACT_ANALYSIS。涉及 DB 强制升级到 dev-flow-doc-be；预估超 8 工时同样升级。
  Use when only a one-liner casual backend request is provided.
  Voice triggers: "一句话 后端", "后端小改", "加个字段".
---

# dev-flow-oneliner-be

## 适用场景

- "给 X 接口加个返回字段"、"列表加个按 status 过滤" 这类后端微需求
- 不涉及 DB 迁移
- 预估 4 小时内可完成（>8 工时强制升级 `/dev-flow-doc-be`）

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；`one_liner` 必填。

## 流程步骤

> 本 skill 与 `/dev-flow-oneliner-fe` 同构，但**必出 `API_CONTRACT.md` 与 `IMPACT_ANALYSIS.md`**。

### 阶段 0 · 上下文初始化

`move_agent_to_root` 进项目；建知识库目录；`META.md` 极简版。

### 阶段 1 · 一句话补 PRD（含契约）

- `SwitchMode` → plan
- 把一句话补成 `MINI_PRD.md`，**必出 `API_CONTRACT.md`**（即使是字段微调，也写出最终签名）
- **强制升级阈值**：
  - 涉及 DB 改动 → 强制升级 `/dev-flow-doc-be`（M4 加成）
  - 估算 >8 工时 → 强制升级 `/dev-flow-doc-be`

### 阶段 2 · 卡点 1 + 契约交付

```text
prompt: "迷你 PRD（MINI_PRD.md）+ API 契约（API_CONTRACT.md）已就绪，请确认："
options:
  - "理解正确 + 契约已与前端 owner 对齐，进入实现"
  - "需要修改（说明）"
  - "实际比想的复杂，建议升级到 dev-flow-doc-be"
```

### 阶段 3 · 项目勘察（精简）

派 1 个 explore subagent：找出待修改文件 + 横切关注点（鉴权？事务？日志？）+ 一句话 `IMPACT_ANALYSIS.md`（哪些接口/任务可能被影响）。

### 阶段 4 · 方案设计（精简）

- `git checkout -b feature/[feature]`
- `IMPLEMENTATION_PLAN.md` 半页：影响文件 + 改动要点
- `/plan-eng-review` 可跳过（小改动），但**任何鉴权 / 数据可见性改动**必须 `/cso`

### 阶段 5 · 实现 + 自查

- `backend-agent` 或主线程
- `/qa`（接口层快速）+ `/review`
- 鉴权/可见性改动必做 `/cso`
- 用 curl/Postman 跑一遍新行为

### 阶段 6 · 上线

`/ship` → `/land-and-deploy` → `/canary`（监控同类接口耗时和错误率）。

### 阶段 7 · 复盘（极简）

append `_lessons.md` 一行：场景 + 实际工时 + 是否触发升级阈值。

## 错误处理

- 估算超过 8 工时 / 涉及 DB → 强制升级 `/dev-flow-doc-be`
- 实现中发现需要前端改动 → 升级 `/dev-flow-oneliner-full`
- 影响范围超出预期 → 暂停，回阶段 3 重做 `IMPACT_ANALYSIS.md`

## 产物清单

`META.md`（极简）、`MINI_PRD.md`、`API_CONTRACT.md`（必出）、`IMPACT_ANALYSIS.md`（一句话）、`IMPLEMENTATION_PLAN.md`（半页）、PR 链接。

## 支持的修饰符

- **M5 只联调** → 几乎不会出现在一句话场景；如出现立即升级 `/dev-flow-doc-be`

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 升级条件触发 → 退出 → 调用 `/dev-flow-doc-be`
- 自查链：`/qa`、`/review`、`/cso`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
