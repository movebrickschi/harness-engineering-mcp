---
name: dev-implement
description: 双项目开发流程的"开发实现"阶段（阶段 3-7）。在目标项目 B 中勘察规范、设计方案、做垂直切片验证、并行派多个 subagent 实现功能、完成自查。需要 _requirements/[feature]/ 已有需求文档作为前置。Use when asked to "开始开发", "实现需求", "进入开发阶段", "/dev-implement", or when user has requirements documented and wants to implement in target project. Voice triggers: "开始开发", "实现需求".
---

# Dev Implement - 开发实现阶段

## 适用场景

完整开发流程的核心阶段。前置条件：
- 已通过 `/dev-understand` 或手动方式生成 `~/Projects/_requirements/[feature]/` 的需求文档
- 目标项目 B 已确定

本阶段产出：实际代码 + 自查报告。

## 核心原则

1. **先垂直切片再水平铺开**：避免 3 个 subagent 同时朝错方向跑
2. **复用优先于新建**：必须先做复用审计
3. **原子 commit**：每子任务完成立即 commit，不要堆积
4. **强制卡点**：方案确认 + 切片确认 用 `AskQuestion` 阻塞

## 启动参数收集

使用 `AskQuestion` 工具一次性收集：

1. **需求名称**（用于定位 `~/Projects/_requirements/[feature]/`）
2. **目标项目 B 路径**
3. **是否新建 git 分支**（默认是，分支名 `feature/[feature-name]`）

启动前**必须验证**：`~/Projects/_requirements/[feature]/` 存在且包含 `BUSINESS_FLOW.md` / `API_CONTRACT.md` / `DATA_MODEL.md`。否则提示用户先跑 `/dev-understand`。

## 流程执行

### 前置：加载需求上下文

1. **必读** `~/Projects/_requirements/[feature]/` 下所有文档作为本次开发的输入
2. **加载** `~/Projects/_requirements/_lessons.md`（如存在）作为经验背景
3. 输出对需求的理解摘要，让用户快速校对

### 阶段 3：B 项目地形勘察 + 复用审计

1. `move_agent_to_root` 切到 B 项目
2. 确保是 Agent 模式（如在 plan 模式则 SwitchMode 切回）
3. **并行**派 3 个 explore subagent：
   - 项目骨架（栈/结构/构建启动/规范/git 工作流）
   - **类似功能定位**（项目里有没有类似实体？已有 CRUD 模板？字段命名习惯？）
   - 横切关注点（鉴权/日志/校验/错误处理/测试约定）
4. 输出 `docs/PROJECT_CONVENTIONS.md`（B 项目规范摘要）
5. 输出 `docs/REUSE_AUDIT.md`（复用审计），格式见 `~/.cursor/skills/dev-flow-full/templates/REUSE_AUDIT.md`

### 阶段 4：方案设计 + 影响分析 ⏸ 卡点

1. 创建 git 分支：`git checkout -b feature/[feature-name]`（如用户选择）
2. 输出 `docs/IMPLEMENTATION_PLAN.md`，包含：
   - A 概念到 B 实现的翻译映射表
   - 新建文件清单（**必做/应做/可选**标注）
   - 修改文件清单
   - 数据库迁移方案（如需）
   - 依赖检查（B 是否缺必要的库）
3. 输出 `docs/IMPACT_ANALYSIS.md`：
   - 反向依赖链
   - 回归风险点
   - 建议回归测试范围
4. 调用 `/plan-eng-review` 评审方案
5. **调用 `AskQuestion` 阻塞等待**：
   ```
   prompt: "方案设计完成。核心改动：[摘要]。请选择："
   options:
     - "方案通过，进入切片验证"
     - "需要修改方案（请提供修改意见）"
     - "需要重新做复用审计"
   ```

### 阶段 5：垂直切片验证 ⏸ 卡点

1. 选最具代表性的端到端场景（通常是核心 CRUD 中的"列表"或"读"）
2. 实现**最小切片**：1 个接口 + 1 个页面 + 1 个测试
3. 手动跑通切片，验证：
   - 技术栈假设正确
   - 与现有代码协同无冲突
   - 性能/规范符合 B 项目要求
4. 切片代码独立 commit：
   ```
   git commit -m "feat([scope]): 实现垂直切片验证"
   ```
5. **调用 `AskQuestion` 阻塞等待**：
   ```
   prompt: "垂直切片完成并通过验证。请选择："
   options:
     - "切片 OK，水平铺开剩余功能"
     - "切片暴露问题，回方案设计阶段"
     - "需要先做更多切片验证"
   ```

### 阶段 6：水平铺开（多 subagent 并行）

1. 根据 `IMPLEMENTATION_PLAN.md` 拆分剩余任务
2. **同一条消息内并行派发**：
   - `backend-agent`：完成剩余后端任务，遵循 `PROJECT_CONVENTIONS.md`
   - `frontend-agent`：完成剩余前端任务，复用 `REUSE_AUDIT.md` 列出组件
   - `test-agent`：补充单测/集成测试，覆盖 `IMPACT_ANALYSIS.md` 列出的回归点
3. **每个子任务原子 commit**，遵循中文 commit 规范：
   ```
   feat(scope): 中文描述
   fix(scope): 中文描述
   test(scope): 中文描述
   ```
4. 每完成一个 subagent 任务，输出 diff 摘要

### 阶段 7：自查（QA + Review + 按需 Security/Design）

按需调用：
1. `/qa` - 端到端 QA + 自动修 bug（**必做**）
2. `/review` - 代码评审（**必做**）
3. `/cso` - 安全审计（涉及权限/数据安全/admin 接口时**必做**）
4. `/design-review` - 视觉走查（有 UI 改动时**必做**）
5. 输出综合自查报告 `docs/self-check-report.md`

## 完成标志

输出本阶段总结：
```
✅ 开发实现阶段完成
🌿 git 分支：feature/[feature-name]
📝 commit 数：N
📄 自查报告：docs/self-check-report.md
🚦 自查结果：[QA: 通过/N 个 issue | Review: 通过/N 条建议 | ...]

下一步建议：使用 /dev-ship-retro 进入上线复盘阶段
```

## 错误处理

- 找不到需求文档 → 提示先跑 `/dev-understand`
- B 项目无 git 仓库 → 询问是否初始化
- 切片验证失败 3 次以上 → 主动建议回阶段 4 重新设计
- 任何 subagent 失败 → 不要继续派发其他任务，先解决当前问题
- QA 发现严重 bug 无法自动修复 → 输出 `/investigate` 建议

## 文档模板位置

统一维护在 `~/.cursor/skills/dev-flow-full/templates/`：
- `IMPLEMENTATION_PLAN.md` - 实施方案
- `REUSE_AUDIT.md` - 复用审计
- `IMPACT_ANALYSIS.md` - 影响分析

读取模板后填充实际内容输出到 B 项目的 `docs/` 下。

## 与其他 Skill 的关系

- 前置：`/dev-understand`（生成需求文档）
- 后续：`/dev-ship-retro`（PM 验收 + 上线 + 复盘）
- 完整流程：`/dev-flow-full`
