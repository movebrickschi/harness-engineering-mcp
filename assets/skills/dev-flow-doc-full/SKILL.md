---
name: dev-flow-doc-full
description: |
  按 PRD 完整实现前后端并联调。契约自治模式：自己写第一版 API 合同，阶段 5 切片
  必须真实端到端（禁 mock），阶段 6 并行三路派发（backend-agent / frontend-agent /
  test-agent）。4 个强制卡点。
  Use when PRD is provided and both frontend and backend need to be implemented.
  Voice triggers: "需求文档 全栈", "PRD 全栈", "前后端都做".
---

# dev-flow-doc-full

## 适用场景

PRD 给定，前后端都自己做，承担端到端交付责任。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外确认**是否有独立前后端仓库**或 monorepo（`target_project` 可能是 2 个目录）。

## 流程步骤

### 阶段 0 · 上下文初始化

同 `/dev-flow-doc-fe` 阶段 0，注意 `target_project` 可能是 2 个目录（前端 + 后端），分别 `move_agent_to_root` 时记录。

### 阶段 1 · 需求澄清（SwitchMode → plan）

通读 PRD，`/office-hours` 6 问视角挑战。输出 `questions-for-pm.md`，**卡点 1**（按 _playbook.md Part B.2）阻塞。

### 阶段 2 · 契约自治

- 自写第一版 `API_CONTRACT.md`
- `AskQuestion` 让用户/PM 确认 2–3 个关键字段的业务含义
- 此版本作为前后端实现的共同锚点，后续改动必须在此文档上同步

### 阶段 3 · 双侧勘察（并行 3 个 explore subagent）

- Task A：前端骨架 + 复用
- Task B：后端骨架 + 复用
- Task C：全栈横切（鉴权、日志、监控、错误处理）

输出 `PROJECT_CONVENTIONS.md` + `REUSE_AUDIT.md`（可分前后端两节）。

### 阶段 4 · 方案设计（Plan 模式）

- `IMPLEMENTATION_PLAN.md` **必须含前后端交互时序图**（mermaid）
- 如涉及 DB → `MIGRATION_PLAN.md`
- `/plan-eng-review` → **卡点 2**（按 Part B.2）

### 阶段 5 · 端到端垂直切片（最关键）

- 1 个接口 + 1 个页面，**真实 HTTP 调用，禁止 mock**
- 跑通整条链路（前端按钮 → API → DB → 返回 → 前端显示）
- 原子 commit：`feat(scope): 实现端到端垂直切片`
- **卡点 3**（按 Part B.2）

### 阶段 6 · 水平铺开（同一消息并行派发三路）

- `backend-agent`：剩余接口
- `frontend-agent`：剩余页面
- `test-agent`：单测 + 集成 + E2E
- 每实现一个接口立即对应前端接入 + 手动自测

### 阶段 7 · 自查

- `/qa`（E2E 全链路）
- `/review`
- `/cso`（权限 / admin 必做）
- `/design-review`（有 UI 必做）
- 汇总 `self-check-report.md`

### 阶段 8 · PM 验收

`demo-package.md` 配 GIF/录屏，**卡点 4**（按 Part B.2）。

### 阶段 9 · 上线

`/ship` → `/land-and-deploy` → `/canary`。若叠加 M4，迁移单独跑。

### 阶段 10 · 复盘

append `_lessons.md`，更新 `META.md`。

## 错误处理

- 切片暴露契约字段不够用 → 立刻更新 `API_CONTRACT.md`，同步前后端改动
- 前后端在阶段 6 出现认知不一致 → 回阶段 2 回溯契约
- E2E 反复失败 → 回阶段 5 重新切片
- 阶段 6 任一 subagent 失败 → 暂停其他派发，先解决当前问题

## 产物清单

`/dev-flow-doc-fe` + `/dev-flow-doc-be` 产物并集 + 前后端交互时序图。

## 支持的修饰符

- **M1 带设计稿** → 阶段 1 后 `/plan-design-review`，阶段 4 `DESIGN_TOKENS.md`，阶段 7 必做 `/design-review`
- **M2 无设计稿 UI** → 新项目阶段 0 加 `/design-consultation`；已有项目阶段 4 后 `/design-shotgun`
- **M3 新旧项目** → 同 `/dev-flow-doc-fe`/`-be`
- **M4 数据库迁移** → 阶段 4 `MIGRATION_PLAN.md`；阶段 5 本地 up→down→up；阶段 7 `/cso` 必做；阶段 9 迁移单独跑

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 三路并行派发 `backend-agent` + `frontend-agent` + `test-agent`
- 自查链：`/qa`、`/review`、`/cso`、`/design-review`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
