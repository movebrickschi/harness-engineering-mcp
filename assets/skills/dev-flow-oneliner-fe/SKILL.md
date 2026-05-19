---
name: dev-flow-oneliner-fe
description: |
  一句话前端需求（如"列表加个状态筛选"）。轻量级流程：先用 office-hours 把一句话补成
  迷你 PRD，再走 doc-fe 简化版（少 1 个 explore subagent）。规模门槛若超 8 工时强制升级
  到 doc-fe，禁止"看似简单一句话"无声变成大工程。
  Use when only a one-liner casual frontend request is provided.
  Voice triggers: "一句话 前端", "前端小改", "顺手加个 X".
---

# dev-flow-oneliner-fe

## 适用场景

- "把列表加个状态筛选"、"按钮文案改一下"、"加个空态" 这类前端微需求
- PM/用户提供的信息少于 1 段话
- 预估 4 小时内可完成（>8 工时强制升级 `/dev-flow-doc-fe`）

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；`one_liner` 必填。

## 流程步骤

### 阶段 0 · 上下文初始化

`move_agent_to_root` 进项目；建知识库目录但 `META.md` 用极简版（只填 `feature_name` + `one_liner` + `target_project`）。

### 阶段 1 · 一句话补 PRD

- `SwitchMode` → plan
- 用 `/office-hours` 6 问视角把"一句话"撑成迷你 PRD：
  - 触发场景 / 用户预期 / 边界 / 错误 / 视觉规范 / 是否有依赖
- 输出 `MINI_PRD.md`（1–2 页足矣）
- **强制规模门槛检查**：若拆解后估算 >8 工时，**升级到 `/dev-flow-doc-fe`** 并退出本 skill

### 阶段 2 · 卡点 1（轻量版）

```text
prompt: "已把一句话补成迷你 PRD（MINI_PRD.md），请确认理解正确："
options:
  - "理解正确，进入实现"
  - "需要修改（说明）"
  - "实际比想的复杂，建议升级到 dev-flow-doc-fe"
```

### 阶段 3 · 项目勘察（精简，1 个 subagent）

只派 1 个 explore subagent：找出待修改文件 + 1 个最相似的已存在改动 commit 作为风格参考。输出极简 `REUSE_AUDIT.md`（半页）。

### 阶段 4 · 方案设计（精简）

- `git checkout -b feature/[feature]`
- `IMPLEMENTATION_PLAN.md` 半页：影响文件 + 改动要点 + 是否需要新增 API 字段
- `/plan-eng-review` 可跳过（小改动），但**任何 UI 改动**必须 `/plan-design-review`
- **卡点 2**（按 _playbook.md Part B.2，可与卡点 1 合并为一次询问）

### 阶段 5 · 实现 + 自查

- 直接改 + `frontend-agent`（小改动可在主线程做）
- 完成后跑 `/qa`（quick 模式）+ `/review`
- 若 UI 改动 → `/design-review`

### 阶段 6 · 上线

`/ship`（PR 描述带 `MINI_PRD.md` 链接）→ `/land-and-deploy` → `/canary`。

### 阶段 7 · 复盘（极简）

append `_lessons.md` 一行：场景 + 实际工时 + 是否触发升级阈值。

## 错误处理

- 估算超过 8 工时 → 强制升级 `/dev-flow-doc-fe`，不允许"轻量化绕过"
- 实现中发现需要后端改动 → 暂停，升级到 `/dev-flow-oneliner-full`
- 影响范围超出 1 个文件 / 1 个组件 → 升级 `/dev-flow-doc-fe`

## 产物清单

`META.md`（极简版）、`MINI_PRD.md`、`REUSE_AUDIT.md`（半页）、`IMPLEMENTATION_PLAN.md`（半页）、PR 链接。

## 支持的修饰符

- **M1 带设计稿** → 阶段 4 必做 `/plan-design-review`，阶段 5 必做 `/design-review`
- **M2 无设计稿** → 阶段 4 加一次"视觉规范确认"问答（参考已有页面色板/间距/字号）

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 任意一处升级条件触发 → 退出 → 调用 `/dev-flow-doc-fe`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
