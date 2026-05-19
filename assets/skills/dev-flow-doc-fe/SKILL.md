---
name: dev-flow-doc-fe
description: |
  按 PRD/需求文档实现前端功能（后端接口已就绪或由他人开发）。从需求澄清到上线复盘全流程，
  覆盖契约对齐、项目勘察、方案评审、切片验证、并行铺开、QA、上线、复盘 10 个阶段，
  带 4 个强制人工卡点。
  Use when PRD/需求文档 is provided and only frontend changes are needed.
  Voice triggers: "需求文档 前端", "PRD 前端", "接前端需求".
---

# dev-flow-doc-fe

## 适用场景

- 已有 PRD / 飞书文档 / Notion 文档，业务规则基本明确
- 后端接口已存在（或由别人并行开发）
- 本次任务只改前端代码

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数（`feature_name`、`target_project`、`prd_path` 必填）；如缺失，用 `AskQuestion` 补齐。

通常由父 skill `/dev-flow` 通过 `dispatch-context.json` 传入。

## 流程步骤

### 阶段 0 · 上下文初始化

- `move_agent_to_root` 进前端项目
- 创建 `~/Projects/_requirements/[feature]/`，写 `META.md`（模板见 _playbook.md Part E.1）
- 加载 `_lessons.md` 背景
- 复制/链接 PRD 到 `PRD.md`

### 阶段 1 · 需求澄清（SwitchMode → plan）

- 通读 PRD，用 `/office-hours` 的 6 问视角挑战（模糊规则 / 边界 / 错误 / 权限 / 并发 / 空状态）
- 输出 `questions-for-pm.md`（模板见 _playbook.md Part E.2）
- **卡点 1**（_playbook.md Part B.2）：

```text
prompt: "需求文档/澄清已生成，请看 questions-for-pm.md。请选择："
options:
  - "已和 PM 沟通，提供答复（粘贴在下条消息）"
  - "需求清楚无疑问，进入下一阶段"
  - "需要重新探索原型/项目某些细节"
```

收到答复后追加到 `pm-answers.md`，循环到无疑问。

### 阶段 2 · 契约对齐

- 与后端 owner 对齐 `API_CONTRACT.md`（字段、错误码、分页、幂等、鉴权）
- PRD 没写的一律落纸，`AskQuestion` 让用户/后端 owner 确认关键字段

### 阶段 3 · 项目勘察（并行 2 个 explore subagent）

- Task A：前端骨架（技术栈、目录结构、构建、路由、状态管理、UI 库）→ 写入 `PROJECT_CONVENTIONS.md`
- Task B：类似功能复用审计 → 写入 `REUSE_AUDIT.md`（模板见 _playbook.md Part E.6）

### 阶段 4 · 方案设计（Plan 模式）

- `git checkout -b feature/[feature]`
- 输出 `IMPLEMENTATION_PLAN.md`（模板见 _playbook.md Part E.5）：页面拆分、组件树、状态、路由、API 层
- `/plan-eng-review` 评审
- **卡点 2**：

```text
prompt: "方案设计完成。核心改动：[一句话摘要]。请选择："
options:
  - "方案通过，进入切片验证"
  - "需要修改方案（请提供修改意见）"
  - "需要重新做复用审计"
```

### 阶段 5 · 垂直切片（SwitchMode → agent）

- 挑选代表性页面（通常"列表"或"详情"）
- 1 页面 + 1 接口对接 + 1 组件测试
- 原子 commit：`feat(scope): 实现垂直切片验证`
- **卡点 3**：

```text
prompt: "垂直切片完成并通过验证。切片范围：[一句话]。请选择："
options:
  - "切片 OK，水平铺开剩余功能"
  - "切片暴露问题，回方案设计阶段"
  - "需要先做更多切片验证（说明哪些）"
```

### 阶段 6 · 水平铺开（并行 Task）

- `frontend-agent`：实现剩余页面
- `test-agent`：交互 / 表单 / 路由测试
- 每块完成立即原子 commit（`feat(scope): 中文描述`）

### 阶段 7 · 自查

- `/qa`（必做）
- `/review`（必做）
- `/design-review`（若有 UI 改动必做，修饰符 M1/M2 下更严格）
- 汇总 `self-check-report.md`

### 阶段 8 · PM 验收

- 整理 `demo-package.md`（截图 + GIF + 与预期对比）
- **卡点 4**：

```text
prompt: "demo 材料已准备好（docs/demo-package.md）。PM 验收结果："
options:
  - "PM 通过，进入上线"
  - "PM 提出小修改（说明）"
  - "PM 不认可，需要回开发阶段"
```

### 阶段 9 · 上线

- `/ship` → `/land-and-deploy` → `/canary`

### 阶段 10 · 复盘

- append `_lessons.md`（模板见 _playbook.md Part E.8）
- 更新 `META.md`（完成时间、实际耗时、PR 链接）

## 错误处理

- 切片暴露契约不匹配 → 回阶段 2 重新对齐 `API_CONTRACT.md`
- UI 反复返工 3 次 → 叠加 M1 或 M2（引入 `/plan-design-review` 或 `/design-shotgun`）
- 后端接口迟迟不 ready → 暂停，报告阻塞，建议启用 mock 层继续切片验证
- `/qa` 暴露严重问题 → 回阶段 6 修复后再跑

## 产物清单

`META.md`、`PRD.md`、`questions-for-pm.md`、`pm-answers.md`、`API_CONTRACT.md`、`PROJECT_CONVENTIONS.md`、`REUSE_AUDIT.md`、`IMPLEMENTATION_PLAN.md`、`self-check-report.md`、`demo-package.md`、PR 链接。

## 支持的修饰符

- **M1 带设计稿** → 阶段 1 后插入 `/plan-design-review`，阶段 4 固化 `DESIGN_TOKENS.md`，阶段 7 必做 `/design-review`
- **M2 无设计稿 UI** → 新项目阶段 0 加 `/design-consultation`；已有项目阶段 4 后加 `/design-shotgun`
- **M3 新旧项目** → 新项目阶段 0 前 `create_project` + `move_agent_to_root`；已有项目严格走阶段 3 复用审计
- **M5 只联调** → 阶段 1 改为契约一致性挑战，输出 `CONTRACT_DIFF.md`；阶段 6 派 `dev-agent` 实现适配 + `test-agent` 写契约测试

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 编码阶段派发 `frontend-agent`、`test-agent`
- 阶段 7 调用 `/qa`、`/review`、`/design-review`
- 阶段 9 调用 `/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座（横切原则、卡点模板、commit 规范、目录约定）：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
