---
name: dev-flow-oneliner-full
description: |
  一句话全栈需求。预估超 8 工时直接强制升级到 dev-flow-doc-full；否则走 oneliner-fe
  + oneliner-be 的并集，并在阶段 2 必出端到端时序图。任何 DB 改动一律升级。
  Use when only a one-liner casual full-stack request is provided.
  Voice triggers: "一句话 全栈", "顺手前后端都改一下".
---

# dev-flow-oneliner-full

## 适用场景

- "搜索结果加个排序选项" 这类一句话需求，但同时涉及前后端
- 不涉及 DB 迁移、不改鉴权
- 预估 4 小时内可完成（>8 工时强制升级 `/dev-flow-doc-full`）

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；`one_liner` 必填；`target_project` 可能是前后端 2 个目录。

## 流程步骤

> 流程是 `/dev-flow-oneliner-fe` ∪ `/dev-flow-oneliner-be` 的并集 +
> **阶段 2 端到端时序图**。

### 阶段 0 · 上下文初始化

`move_agent_to_root` 进对应项目（前后端都要切一次）；建知识库目录；`META.md` 极简版。

### 阶段 1 · 一句话补 PRD

- `MINI_PRD.md` + `API_CONTRACT.md`
- **强制升级阈值**：
  - 涉及 DB → 升级 `/dev-flow-doc-full`
  - >8 工时 → 升级 `/dev-flow-doc-full`
  - 涉及鉴权改动 → 升级 `/dev-flow-doc-full`

### 阶段 2 · 端到端时序图（必出）

mermaid 时序图标出：用户操作 → 前端事件 → API 调用 → DB 读写 → 响应 → 前端展示。

### 阶段 3 · 卡点 1（合并版）

```text
prompt: "MINI_PRD + API_CONTRACT + 时序图就绪。请确认："
options:
  - "理解正确，进入实现"
  - "需要修改（说明）"
  - "实际比想的复杂，建议升级到 dev-flow-doc-full"
```

### 阶段 4 · 项目勘察（精简）

并行 2 个 explore subagent：
- 前端待修改文件 + 复用
- 后端待修改文件 + `IMPACT_ANALYSIS.md`

### 阶段 5 · 方案设计

`IMPLEMENTATION_PLAN.md` 一页内：前端改动 + 后端改动 + 时序图。

### 阶段 6 · 端到端切片实现

- 派 `backend-agent` + `frontend-agent` 并行
- 实现完后**必须真实端到端跑一遍**（无 mock）

### 阶段 7 · 自查

`/qa`（quick）+ `/review`；UI 改动 → `/design-review`；鉴权改动 → `/cso`。

### 阶段 8 · 上线

`/ship` → `/land-and-deploy` → `/canary`。

### 阶段 9 · 复盘（极简）

append `_lessons.md` 一行。

## 错误处理

- 任何升级阈值触发 → 强制升级 `/dev-flow-doc-full`
- 端到端跑不通（前端拿不到字段、后端报错）→ 回阶段 5 重新方案

## 产物清单

`/dev-flow-oneliner-fe` + `/dev-flow-oneliner-be` 产物并集 + 端到端时序图。

## 支持的修饰符

- 几乎所有修饰符出现都意味着规模超出"一句话"范畴 → 直接升级
- 唯一可能的轻量场景：M1（带设计稿且只是小改）→ 阶段 7 必做 `/design-review`

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 升级条件触发 → 退出 → 调用 `/dev-flow-doc-full`
- 派发 `backend-agent`、`frontend-agent`
- 自查链：`/qa`、`/review`、`/cso`、`/design-review`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
