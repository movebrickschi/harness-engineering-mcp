---
name: dev-flow-doc-be
description: |
  按 PRD/需求文档实现后端功能（前端由他人或 Mock 消费）。后端视角的契约优先模式：
  先产出 API_CONTRACT.md 与前端 owner 达成合同，再进入实现。覆盖鉴权、事务、回归、
  迁移、安全审计，带 4 个强制人工卡点 + 1 个契约交付卡点。
  Use when PRD is provided and only backend changes are needed.
  Voice triggers: "需求文档 后端", "PRD 后端", "接后端需求".
---

# dev-flow-doc-be

## 适用场景

PRD 给定、前端由他人或 Mock 消费、只做 API / Service / DB。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；通常由父 skill `/dev-flow` 通过 `dispatch-context.json` 传入。

## 流程步骤

### 阶段 0 · 上下文初始化

同 `/dev-flow-doc-fe` 阶段 0：`move_agent_to_root` → 建知识库目录 → 写 `META.md` → 加载 `_lessons.md`。

### 阶段 1 · 需求澄清（SwitchMode → plan）

通读 PRD，用 `/office-hours` 6 问视角挑战，**追加追问**：
- 并发策略（乐观锁 / 悲观锁 / 队列）
- 幂等设计（幂等键来源、有效期）
- 一致性要求（强一致 / 最终一致）

输出 `questions-for-pm.md`，按 _playbook.md Part B.2 卡点 1 阻塞。

### 阶段 2 · 契约先行（后端视角）

- **第一动作**：输出 `API_CONTRACT.md`（入参 / 出参 / 错误码 / 分页 / 幂等键 / 鉴权）
- 同步给前端 owner

**契约交付卡点**：

```text
prompt: "API 契约已送前端 owner，结果？"
options:
  - "前端已 sign-off，进入实现"
  - "前端提出修改（粘贴意见）"
  - "前端暂不可用，继续推进（风险：后续可能返工）"
```

### 阶段 3 · 项目勘察（并行 3 个 explore subagent）

- Task A：后端骨架（技术栈、目录结构、构建启动、ORM、配置管理）→ `PROJECT_CONVENTIONS.md`
- Task B：类似实体复用（CRUD 模板、DTO、Validator 在哪）→ `REUSE_AUDIT.md`
- Task C：横切（鉴权、日志、参数校验、错误处理、事务、限流、监控）→ 并入 `PROJECT_CONVENTIONS.md`

### 阶段 4 · 方案设计

- `IMPLEMENTATION_PLAN.md`：路由 / 控制器 / Service / Repo / DTO / Schema
- `IMPACT_ANALYSIS.md`（模板见 _playbook.md Part E.7）：反向依赖链、回归范围
- 如涉及 DB → 附 `MIGRATION_PLAN.md`（M4，模板见 Part E.9）
- `/plan-eng-review` → **卡点 2**（按 Part B.2）

### 阶段 5 · 垂直切片

- 挑选"读列表"或"读详情"接口
- 完整链路：路由 → 鉴权 → Service → Repo → DTO → 集成测试
- curl / Postman 验证 → **卡点 3**（按 Part B.2）

### 阶段 6 · 水平铺开

- `backend-agent`：剩余接口
- `test-agent`：单测 + 集成测试，覆盖 `IMPACT_ANALYSIS.md` 所列回归点
- 每接口完成立即原子 commit（`feat(scope): 中文描述`）

### 阶段 7 · 自查

- `/qa`（接口层为主）
- `/review`
- `/cso`（权限 / 敏感数据 / admin 接口必做）
- 汇总 `self-check-report.md`

### 阶段 8 · PM 验收

`demo-package.md` 用 curl/Postman 例子展示，**卡点 4**（按 Part B.2）。

### 阶段 9 · 上线

- 若叠加 M4 → `/land-and-deploy` 前**单独跑迁移**，确认成功再发代码
- `/ship` → `/land-and-deploy` → `/canary`（重点监控 DB 慢查询与同类错误）

### 阶段 10 · 复盘

append `_lessons.md`，更新 `META.md`。

## 错误处理

- 契约被前端打回 → 回阶段 2 更新 `API_CONTRACT.md`
- 切片卡在横切（鉴权 / 事务）→ 回阶段 3 补充 `PROJECT_CONVENTIONS.md` 后再切
- 迁移脚本 up/down 不幂等 → 必须修到幂等才能进阶段 6
- `/cso` 暴露密钥/SQL 注入 → 立刻回阶段 6 修复

## 产物清单

同 `/dev-flow-doc-fe`，加 `IMPACT_ANALYSIS.md`、接口文档；若 M4 叠加 `MIGRATION_PLAN.md`、迁移脚本、回滚脚本。

## 支持的修饰符

- **M3 新旧项目** → 已有项目严格走阶段 3 复用审计；新项目阶段 0 加 `ARCHITECTURE.md`，阶段 9 加 `/setup-deploy`
- **M4 数据库迁移** → 阶段 4 必须 `MIGRATION_PLAN.md`；阶段 5 本地跑 up→down→up；阶段 7 `/cso` 必做
- **M5 只联调** → 阶段 1 改为契约一致性挑战；阶段 6 派 `dev-agent` + `test-agent` 写 contract test

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- `/cso` 是后端场景的必选自查
- 编码派发 `backend-agent`、`test-agent`
- 上线 `/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
