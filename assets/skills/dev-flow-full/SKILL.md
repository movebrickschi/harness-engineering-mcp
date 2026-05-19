---
name: dev-flow-full
description: 双项目模式的完整需求开发流程（10 阶段）。从 PM 给的原型项目接手开始，到上线复盘结束，全链路自动化执行，关键节点强制人工卡点。Use when asked to "接手新需求", "双项目开发", "完整开发流程", "/dev-flow-full", or when user has a prototype project from PM and needs to implement features in a different target project. Voice triggers: "接手需求", "完整流程", "双项目模式".
---

# Dev Flow Full - 完整需求开发流程

## 适用场景

- PM 给了一个原型/参考项目（A），用于理解业务
- 实际开发在另一个项目（B）中进行
- 需要完整经历"探索 → 理解 → 设计 → 开发 → 测试 → 上线 → 复盘"全流程

## 核心原则（必须严格遵守）

1. **A 项目只读**：进入 A 项目立即 `/freeze` + SwitchMode 进 plan 模式
2. **强制卡点**：4 个硬卡点必须使用 `AskQuestion` 工具阻塞，**严禁**自行判断"我觉得 OK"继续
3. **垂直切片优先**：水平铺开多 subagent 前必须先做最小端到端验证
4. **失败可回退**：每阶段失败有明确退路，不允许"将错就错"
5. **产物可复用**：所有中间产物落到 `~/Projects/_requirements/[feature]/`

## 启动参数收集

执行流程前，使用 `AskQuestion` 工具一次性收集以下参数（如用户消息中已提供则跳过对应项）：

1. **需求名称**（用于命名知识库目录，建议英文 kebab-case，如 `supplier-batch-approve`）
2. **原型项目 A 路径**（智能扫描 `~/Projects/`、`~/Developer/`、`~/repos/` 推断后让用户确认）
3. **原型功能 URL**（如 `http://localhost:3000/admin/api/suppliers`）
4. **目标项目 B 路径**
5. **PM 联系人**（用于沟通记录归档）
6. **截止日期**（可选）

收集后写入 `~/Projects/_requirements/[feature]/META.md`（模板见 `templates/META.md`）。

## 流程执行

### 阶段 0：上下文初始化

1. 检查/创建 `~/Projects/_requirements/[feature]/` 目录
2. 写入 `META.md`
3. **加载 `~/Projects/_requirements/_lessons.md`**（如存在），将其内容作为本次开发的背景知识
4. 输出本次开发的整体计划摘要

### 阶段 1：A 项目探索（只读）

1. 使用 `cursor-app-control` MCP 的 `move_agent_to_root` 切换到 A 项目
2. **立即执行** `/freeze` 锁定 A 目录，**严禁修改**
3. **切换到 Plan 模式**（SwitchMode 到 plan）
4. 使用 `cursor-ide-browser` MCP 走查目标 URL：
   - `browser_snapshot` 抓取页面结构
   - `browser_take_screenshot` 全页截图
   - 依次点击所有可交互元素，记录 URL 变化
   - `browser_network_requests` 抓取所有 API 请求
   - `browser_console_messages` 检查报错
5. **并行**派发 3 个 explore subagent：
   - 任务 A：项目骨架（技术栈、目录结构、入口文件、构建脚本、运行环境特征）
   - 任务 B：目标功能的前端实现（路由、组件、状态管理、API 调用层）
   - 任务 C：目标功能的后端实现（路由定义、控制器、Service、数据库 Schema）
6. **抽象化**输出 4 份文档到 `~/Projects/_requirements/[feature]/`：
   - `BUSINESS_FLOW.md` - 业务流程（用户故事 + 截图 + mermaid 流程图，**禁止包含具体代码**）
   - `API_CONTRACT.md` - 接口契约（业务含义/入参/出参/错误码/幂等性，**用通用描述，不绑定框架**）
   - `DATA_MODEL.md` - 数据模型（实体/字段/关系/枚举/校验，**用通用 ER 描述**）
   - `ENV_NOTES.md` - A 项目运行环境特征（mock 数据？真实环境？特殊配置？）

### 阶段 2：需求循环 ⏸ 卡点 1（可循环）

1. 调用 `gstack-office-hours` 技能视角挑战需求文档
2. 输出 `questions-for-pm.md`，包含：
   - 模糊不清的业务规则
   - 缺失的边界场景（错误/并发/权限/空状态）
   - 互相矛盾的地方
   - 每个问题给出 AI 的猜测和需要 PM 确认的具体点
3. **调用 `AskQuestion` 工具阻塞等待**，问题示例：
   ```
   prompt: "需求文档已生成，请查看 questions-for-pm.md。请选择："
   options:
     - "已和 PM 沟通，提供答复（粘贴在下条消息）"
     - "需求清楚无疑问，进入下一阶段"
     - "需要重新探索 A 项目某些细节"
   ```
4. 收到 PM 答复后：
   - 更新需求文档
   - 追加到 `pm-answers.md` 沟通记录
   - **再次** `AskQuestion` 询问"还有疑问吗？"
   - 循环至用户选择"无疑问，进入下一阶段"

### 阶段 3：B 项目地形勘察 + 复用审计

1. 使用 `move_agent_to_root` 切换到 B 项目
2. **切换回 Agent 模式**（SwitchMode 到 agent）
3. **并行**派发 3 个 explore subagent：
   - 任务 A：项目骨架（技术栈、目录结构、构建/启动方式、代码规范、git 工作流）
   - 任务 B：**类似功能定位** —— 项目里是否有类似实体/CRUD？已有的模板在哪？字段命名习惯？
   - 任务 C：横切关注点（鉴权/日志/参数校验/错误处理/测试约定）
4. 输出 `docs/PROJECT_CONVENTIONS.md`（B 项目规范摘要，加到 .gitignore 或 docs/）
5. 输出 `docs/REUSE_AUDIT.md`（复用审计），格式：
   ```markdown
   ## 可复用清单
   | 需求点 | 复用项 | 文件位置 | 复用方式 |
   |--------|--------|---------|---------|
   | 列表分页 | PaginationDto | src/common/dto/pagination.dto.ts | 直接引入 |
   | 权限校验 | @AdminGuard 装饰器 | src/admin/guards/ | 直接复用 |

   ## 必须新建清单
   | 需求点 | 原因 | 建议位置 |
   |--------|------|---------|
   | Supplier 实体 | 项目无类似领域 | src/admin/suppliers/ |
   ```

### 阶段 4：方案设计 + 影响分析 ⏸ 卡点 2

1. 创建 git 分支：`git checkout -b feature/[feature-name]`
2. 输出 `docs/IMPLEMENTATION_PLAN.md`，包含：
   - A 概念到 B 实现的翻译映射表
   - 新建文件清单（标注必做/应做/可选）
   - 修改文件清单
   - 数据库迁移方案（如需）
   - 依赖检查（B 是否缺必要的库）
3. 输出 `docs/IMPACT_ANALYSIS.md`，包含：
   - 反向依赖链（改动的核心模块被谁依赖？）
   - 回归风险点
   - 建议的回归测试范围
4. 调用 `/plan-eng-review` 评审方案
5. **调用 `AskQuestion` 工具阻塞等待**：
   ```
   prompt: "方案设计完成。核心改动：[摘要]。请选择："
   options:
     - "方案通过，进入切片验证"
     - "需要修改方案（请提供修改意见）"
     - "需要重新做复用审计"
   ```

### 阶段 5：垂直切片验证 ⏸ 卡点 3

1. 选择最具代表性的一个端到端场景（通常是核心 CRUD 中的"读"或"列表"）
2. 实现**最小切片**：1 个接口 + 1 个页面 + 1 个测试
3. 手动跑通切片，验证：
   - 技术栈假设正确
   - 与现有代码协同无冲突
   - 性能/规范符合 B 项目要求
4. 切片代码独立 commit：`git commit -m "feat(scope): 实现垂直切片验证"`
5. **调用 `AskQuestion` 工具阻塞等待**：
   ```
   prompt: "垂直切片完成并通过验证。请选择："
   options:
     - "切片 OK，水平铺开剩余功能"
     - "切片暴露问题，回方案设计阶段"
     - "需要先做更多切片验证（说明哪些）"
   ```

### 阶段 6：水平铺开（多 subagent 并行）

1. 根据 `IMPLEMENTATION_PLAN.md` 拆分剩余任务
2. **同一条消息内并行派发**：
   - `backend-agent`：完成剩余后端任务，必须遵循 `PROJECT_CONVENTIONS.md`
   - `frontend-agent`：完成剩余前端任务，复用 `REUSE_AUDIT.md` 列出的组件
   - `test-agent`：补充单测/集成测试，覆盖 `IMPACT_ANALYSIS.md` 列出的回归点
3. **每个子任务原子 commit**（不要等全部做完才 commit），格式遵循中文 commit 规范：
   ```
   feat(scope): 中文描述
   fix(scope): 中文描述
   ```
4. 每完成一个 subagent 任务，输出 diff 摘要

### 阶段 7：自查（QA + Review + Security + Design）

按需调用：
1. `/qa` - 端到端 QA + 自动修 bug（必做）
2. `/review` - 代码评审（必做）
3. `/cso` - 安全审计（涉及权限/数据安全/admin 接口时必做）
4. `/design-review` - 视觉走查（有 UI 改动时必做）
5. 输出综合自查报告 `docs/self-check-report.md`

### 阶段 8：PM 验收 ⏸ 卡点 4

1. 整理 demo 材料 `docs/demo-package.md`：
   - 主流程截图序列
   - 关键操作的 GIF/录屏（用 browser MCP 可截图分镜）
   - 与原型 A 的行为对比表
   - 已知差异说明
2. **调用 `AskQuestion` 工具阻塞等待**：
   ```
   prompt: "demo 材料已准备好。PM 验收结果："
   options:
     - "PM 通过，进入上线"
     - "PM 提出小修改（说明）"
     - "PM 不认可，需要回开发阶段"
   ```

### 阶段 9：上线（Ship + Land + Canary）

1. `/ship` - 创建 PR
2. `/land-and-deploy` - 合并 + 部署
3. `/canary` - 上线后监控
4. 输出 PR 链接和上线状态

### 阶段 10：复盘 + 知识库沉淀

1. 创建/更新 `~/Projects/_requirements/_lessons.md`，按以下分类追加：
   ```markdown
   ## [日期] [feature-name]

   ### PM 沟通踩坑
   - （这次 PM 沟通中哪些问题应该早问？）

   ### B 项目隐性规范
   - （发现的、未文档化的约定）

   ### A 与 B 的差异
   - （A 用了什么 B 没有？反之？）

   ### 架构决策
   - （这次为什么选 X 不选 Y？）

   ### 复用机会
   - （下次类似需求可以复用这次的什么？）
   ```
2. 更新本次需求的 `META.md`，标记完成状态、实际耗时、PR 链接
3. 输出本次需求的最终总结

## 错误处理

- 如果阶段 1 探索发现 A 项目无法访问/启动失败 → 报告问题，等待用户提供帮助
- 如果阶段 2 用户长时间不回复 → 不要继续，明确告知"等待 PM 反馈中"
- 如果阶段 5 切片验证失败 3 次以上 → 主动建议"是否回阶段 4 重新设计方案"
- 如果阶段 6 任何 subagent 失败 → 不要继续派发其他任务，先解决当前问题
- 如果阶段 9 部署失败 → 自动回滚 + `/investigate`

## 与其他 Skill 的关系

- 如果用户只想做"理解需求"部分 → 建议用 `/dev-understand`
- 如果用户已有需求文档，只想"开发实现" → 建议用 `/dev-implement`
- 如果用户已开发完，只想"上线复盘" → 建议用 `/dev-ship-retro`

## 文档模板位置

所有产出文档的模板位于本 Skill 目录的 `templates/` 子目录：
- `templates/META.md`
- `templates/BUSINESS_FLOW.md`
- `templates/API_CONTRACT.md`
- `templates/DATA_MODEL.md`
- `templates/IMPLEMENTATION_PLAN.md`
- `templates/REUSE_AUDIT.md`
- `templates/IMPACT_ANALYSIS.md`
- `templates/_lessons.md`

读取模板后填充实际内容输出到 `~/Projects/_requirements/[feature]/` 或 B 项目的 `docs/` 下。
