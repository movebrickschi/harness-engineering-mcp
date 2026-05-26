---
name: dev-understand
description: 双项目开发流程的"理解需求"阶段（阶段 0-2）。在 PM 给的原型项目中只读探索，产出抽象化的需求文档，并通过 PM 沟通循环确保需求清晰。Use when asked to "理解需求", "梳理业务", "探索原型项目", "/dev-understand", or when user has a prototype project from PM but doesn't yet have clear requirements documented. Voice triggers: "理解需求", "梳理业务".
related: [codegraph, brainstorming, writing-plans]
---

# Dev Understand - 理解需求阶段

## 适用场景

完整开发流程的前置阶段。当 PM 给了原型项目，需要：
- 探索清楚业务流程
- 抽象化输出需求文档
- 通过 PM 沟通消除需求模糊点
- 为后续开发阶段（`/dev-implement`）准备好需求知识库

## 核心原则

1. **A 项目只读**：进入立即 `/freeze` + SwitchMode 到 plan 模式
2. **抽象化输出**：禁止把 A 的具体代码搬到文档里，要翻译成业务语言
3. **PM 沟通可循环**：支持多轮往返，用 `AskQuestion` 阻塞等待

## 启动参数收集

使用 `AskQuestion` 工具一次性收集（用户消息已含则跳过）：

1. **需求名称**（kebab-case，如 `supplier-batch-approve`）
2. **原型项目 A 路径**（智能推断后确认）
3. **原型功能 URL**
4. **PM 联系人**

写入 `~/Projects/_requirements/[feature]/META.md`。

## 流程执行

### 阶段 0：上下文初始化

1. 创建 `~/Projects/_requirements/[feature]/` 目录
2. 写入 `META.md`
3. **加载** `~/Projects/_requirements/_lessons.md`（如存在）作为背景
4. 输出执行计划

### 阶段 1：A 项目探索（只读）

1. `move_agent_to_root` 切到 A 项目
2. **立即** `/freeze` + SwitchMode 到 plan
3. 浏览器走查目标 URL：
   - `browser_snapshot` + `browser_take_screenshot`
   - 点击所有可交互元素
   - `browser_network_requests` 抓 API
   - `browser_console_messages` 查报错
4. **并行**派 3 个 explore subagent：
   - 项目骨架（技术栈/结构/运行环境）
   - 目标功能前端（路由/组件/状态/API 调用）
   - 目标功能后端（路由/Controller/Service/Schema）
5. **抽象化**输出 4 份文档到 `~/Projects/_requirements/[feature]/`：
   - `BUSINESS_FLOW.md`（业务流程，含截图、mermaid，**无代码**）
   - `API_CONTRACT.md`（接口契约，业务语言）
   - `DATA_MODEL.md`（数据模型，通用 ER）
   - `ENV_NOTES.md`（A 的运行环境特征）

**文档模板位置**：`~/.cursor/skills/dev-flow-full/templates/`（统一维护，避免重复）：
- `META.md` - 需求元信息
- `BUSINESS_FLOW.md` - 业务流程
- `API_CONTRACT.md` - 接口契约
- `DATA_MODEL.md` - 数据模型
- `_lessons.md` - 经验沉淀（已存在则追加）

读取模板后填充实际内容输出到 `~/Projects/_requirements/[feature]/`。

### 阶段 2：需求循环 ⏸ 卡点（可循环）

1. 用 `gstack-office-hours` 视角挑战需求文档
2. 输出 `questions-for-pm.md`：
   - 模糊业务规则
   - 缺失边界场景
   - 互相矛盾点
   - 每个问题附 AI 猜测 + 需 PM 确认的具体点
3. **调用 `AskQuestion` 阻塞等待**：
   ```
   prompt: "需求文档已生成，请查看 questions-for-pm.md。请选择："
   options:
     - "已和 PM 沟通，提供答复（粘贴在下条消息）"
     - "需求清楚无疑问，结束理解阶段"
     - "需要重新探索 A 项目某些细节"
   ```
4. 收到 PM 答复后：
   - 更新需求文档
   - 追加到 `pm-answers.md`
   - **再次** `AskQuestion` 询问"还有疑问吗？"
   - 循环至用户选择"无疑问"

## 完成标志

输出本阶段总结：
```
✅ 理解需求阶段完成
📁 知识库位置：~/Projects/_requirements/[feature]/
📄 产出文档：
  - META.md
  - BUSINESS_FLOW.md
  - API_CONTRACT.md
  - DATA_MODEL.md
  - ENV_NOTES.md
  - questions-for-pm.md
  - pm-answers.md（如有）

下一步建议：使用 /dev-implement 进入开发实现阶段
```

## 错误处理

- A 项目无法访问 → 报告问题等用户帮助
- 浏览器 MCP 无法连接 → 仅用代码探索，标注"未做运行时验证"
- PM 长时间不回复 → 不要继续，明确告知等待中
- explore subagent 失败 → 重试或换关键词

## 与其他 Skill 的关系

- 完成本 Skill 后通常接 `/dev-implement`
- 如果整个流程都要做 → 用 `/dev-flow-full`
