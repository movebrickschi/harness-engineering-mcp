---
name: dev-flow-proto-be
description: |
  PM 给了可运行的参考项目 A，只在 B 项目里实现后端。基于 dev-flow-full 裁剪：
  阶段 1 跳过前端 subagent 但强化网络请求抓取，阶段 3 后端横切为主，阶段 6 只派
  backend-agent + test-agent。额外追加"契约交付"卡点。
  Use when a reference/prototype project is provided and only backend is needed in target project.
  Voice triggers: "原型 后端", "参考项目 后端".
---

# dev-flow-proto-be

## 适用场景

- PM 提供参考项目 A（可运行）
- B 项目只做后端
- 前端由别人实现或已存在

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外需要 `prototype_path` 与 `prototype_url`。

## 流程步骤

> 本 skill 是 `/dev-flow-full` 的"后端裁剪版"。

### 阶段 0 · 上下文初始化

同 `/dev-flow-full` 阶段 0。

### 阶段 1 · A 项目探索（A 只读，强化网络抓取）

- `move_agent_to_root` 切到 A
- `/freeze` + `SwitchMode` → plan
- 用 `cursor-ide-browser` 走查目标 URL，**强化 `browser_network_requests`** 抓完所有 API：
  - 每个接口的请求 headers / body / query
  - 响应 status / body 样例
  - 耗时与状态码分布
- **并行**派发 2 个 explore subagent（**跳过前端 subagent**）：
  - Task A：项目骨架（技术栈、目录、构建、运行环境）
  - Task B：后端实现（路由定义、控制器、Service、数据库 Schema、迁移文件）
- 输出：
  - `API_CONTRACT.md`（**从真实请求反推**，附原始样例）
  - `DATA_MODEL.md`（实体 / 字段 / 关系 / 枚举 / 校验）
  - `ENV_NOTES.md`（A 的运行特征：mock 数据？真实环境？特殊配置？）

### 阶段 2 · 需求澄清（卡点 1）

按 _playbook.md Part B.2 卡点 1。

### 阶段 3 · B 项目勘察

- `move_agent_to_root` 切到 B
- `SwitchMode` → agent
- **并行 3 个 explore subagent**（**跳过前端横切**）：
  - 后端骨架
  - 类似实体复用（CRUD 模板、DTO、Validator）
  - 后端横切（鉴权、日志、参数校验、错误处理、事务、限流）
- 输出 `PROJECT_CONVENTIONS.md` + `REUSE_AUDIT.md`

### 阶段 4 · 方案设计（卡点 2）

- `git checkout -b feature/[feature]`
- 后端 `IMPLEMENTATION_PLAN.md` + `IMPACT_ANALYSIS.md`
- 涉及 DB → `MIGRATION_PLAN.md`（M4）
- `/plan-eng-review` → **卡点 2**

### 阶段 5 · 契约交付卡点

向前端 owner 交付 `API_CONTRACT.md` 后阻塞：

```text
prompt: "API 契约（基于 A 项目反推）已送前端 owner，结果？"
options:
  - "前端已 sign-off，进入实现"
  - "前端提出修改（粘贴意见）"
  - "前端暂不可用，继续推进（风险：后续可能返工）"
```

### 阶段 6 · 垂直切片（卡点 3）

- 实现一个最具代表性接口（通常"读列表"）
- 完整链路 + curl/Postman 验证
- 与 A 项目对应接口的响应做 diff，确认行为对齐
- **卡点 3**

### 阶段 7 · 水平铺开

- `backend-agent`：剩余接口
- `test-agent`：单测 + 集成测试

### 阶段 8 · 自查

- `/qa`、`/review`、`/cso` 必做
- 对 A 项目的请求逐个 replay 到 B，确认响应一致

### 阶段 9 · PM 验收（卡点 4）

`demo-package.md` 必含 A 与 B 的接口响应对比。

### 阶段 10 · 上线

若 M4 → 迁移单独跑。`/ship` → `/land-and-deploy` → `/canary`。

### 阶段 11 · 复盘

append `_lessons.md`。

## 错误处理

- A 项目接口行为难以在 B 复现（依赖第三方）→ 补 `ENV_NOTES.md`，与 PM 商讨可接受的差异
- `browser_network_requests` 抓不到完整接口（隐藏接口/WebSocket）→ 询问用户提供 `.har` 文件或 PM 协助
- A 与 B 数据库结构差异大 → 在 `MIGRATION_PLAN.md` 给出迁移方案

## 产物清单

`/dev-flow-full` 阶段 1 产物 + 后端侧阶段 3/4 产物 + 接口文档 + （M4）迁移脚本。

## 支持的修饰符

- **M3 已有项目** → 严格走阶段 3 复用审计；新项目阶段 0 加 `ARCHITECTURE.md`
- **M4 数据库迁移**（常见）→ 阶段 4 必须 `MIGRATION_PLAN.md`；阶段 6 本地 up→down→up；阶段 8 `/cso` 必做

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 本质是 `/dev-flow-full` 的裁剪版
- 使用 `cursor-ide-browser` MCP 走查原型
- 派发 `backend-agent`、`test-agent`
- 自查链：`/qa`、`/review`、`/cso`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
- 全量参考：[dev-flow-full/SKILL.md](file:///c:/Users/Administrator/.cursor/skills/dev-flow-full/SKILL.md)
