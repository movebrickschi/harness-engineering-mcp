---
name: dev-flow-proto-fe
description: |
  PM 给了可运行的参考项目 A，只在 B 项目里实现前端。基于 dev-flow-full 裁剪：
  阶段 1 跳过后端探索 subagent，阶段 3 跳过后端横切，阶段 6 只派 frontend-agent
  + test-agent。保留 A 项目只读原则与 4 个硬卡点。
  Use when a reference/prototype project is provided and only frontend is needed in target project.
  Voice triggers: "原型 前端", "参考项目 前端".
---

# dev-flow-proto-fe

## 适用场景

- PM 提供参考项目 A（可运行）
- B 项目只做前端
- 后端接口由别人实现或已存在

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外需要 `prototype_path` 与 `prototype_url`。通常由父 skill `/dev-flow` 通过 `dispatch-context.json` 传入。

## 流程步骤

> 本 skill 是 `/dev-flow-full` 的"前端裁剪版"。可直接调用 `/dev-flow-full` 并传入
> `scope=fe` 让其内部裁剪，也可按以下步骤手动执行。

### 阶段 0 · 上下文初始化

同 `/dev-flow-full` 阶段 0：建知识库目录、写 `META.md`、加载 `_lessons.md`。

### 阶段 1 · A 项目探索（A 只读）

- `move_agent_to_root` 切到 A 项目
- **立即** `/freeze` 锁定 A 根目录
- `SwitchMode` → plan
- 用 `cursor-ide-browser` MCP 走查目标 URL：
  - `browser_snapshot` 抓页面结构
  - `browser_take_screenshot` 全页截图
  - 依次点击所有可交互元素
  - `browser_network_requests` 抓 API（用于反推后端契约，作为输入约束）
  - `browser_console_messages` 检查报错
- **并行**派发 2 个 explore subagent（**跳过后端 subagent**）：
  - Task A：项目骨架（技术栈、目录结构、入口文件、构建脚本）
  - Task B：前端实现（路由、组件、状态管理、API 调用层）
- 输出抽象化文档：
  - `BUSINESS_FLOW.md`（业务流程，禁含具体代码）
  - `API_CONTRACT.md`（**输入契约**，约束 B 项目实现的对接方式）
  - `ENV_NOTES.md`（A 运行环境特征）

### 阶段 2 · 需求澄清（卡点 1）

按 _playbook.md Part B.2 卡点 1，循环到无疑问。

### 阶段 3 · B 项目勘察

- `move_agent_to_root` 切到 B 项目
- `SwitchMode` → agent
- **并行 2 个 explore subagent**（**跳过后端横切**）：
  - 前端骨架（技术栈、目录结构、构建/启动、代码规范、git 工作流）
  - 前端类似功能复用审计（已有的页面/组件模板在哪）
- 输出 `PROJECT_CONVENTIONS.md` + `REUSE_AUDIT.md`

### 阶段 4 · 方案设计（卡点 2）

- `git checkout -b feature/[feature]`
- 只出前端 `IMPLEMENTATION_PLAN.md`：A 概念到 B 实现的翻译映射 + 新建/修改文件清单
- `/plan-eng-review` → **卡点 2**

### 阶段 5 · 垂直切片（卡点 3）

- 选最具代表性的端到端场景（通常列表 or 详情）
- 实现最小切片：1 个页面对接 1 个真实接口
- 原子 commit → **卡点 3**

### 阶段 6 · 水平铺开

- `frontend-agent`：剩余页面
- `test-agent`：交互/路由/表单测试

### 阶段 7 · 自查

- `/qa`、`/review`、`/design-review` 必做
- `/cso` 可选（无后端改动通常不需要）

### 阶段 8 · PM 验收（卡点 4）

`demo-package.md` 必含与原型 A 的行为对比表与已知差异说明。

### 阶段 9–10 · 上线 + 复盘

`/ship` → `/land-and-deploy` → `/canary` → append `_lessons.md`。

## 错误处理

- 依赖的后端接口不存在 / 行为不符 → 退出裁剪，升级到 `/dev-flow-full`（S6）
- A 项目无法访问/启动 → 报告问题，等待用户提供帮助
- A 与 B 的字段命名差异过大 → 在 `IMPLEMENTATION_PLAN.md` 显式列出映射表

## 产物清单

`/dev-flow-full` 阶段 1 产物（`BUSINESS_FLOW.md`、`API_CONTRACT.md`、`ENV_NOTES.md`）+ 前端侧阶段 3/4 产物（`PROJECT_CONVENTIONS.md`、`REUSE_AUDIT.md`、`IMPLEMENTATION_PLAN.md`）+ `self-check-report.md`、`demo-package.md`、PR。

## 支持的修饰符

- **M1 带设计稿**（A 通常自带）→ 阶段 1 把 A 的视觉作为设计参考；阶段 4 固化 `DESIGN_TOKENS.md`；阶段 7 必做 `/design-review`
- **M2 无设计稿**（A 行为即设计）→ 直接用 A 的视觉作为参照
- **M3 已有项目** → 严格走阶段 3 复用审计

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 本质是 `/dev-flow-full` 的裁剪版；可直接委托父 skill 并传 `scope=fe`
- 使用 `cursor-ide-browser` MCP 走查原型
- 自查链：`/qa`、`/review`、`/design-review`
- 上线链：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
- 全量参考：[dev-flow-full/SKILL.md](file:///c:/Users/Administrator/.cursor/skills/dev-flow-full/SKILL.md)
