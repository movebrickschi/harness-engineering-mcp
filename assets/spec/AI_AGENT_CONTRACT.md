---
spec_id: harness-spec-ai-agent
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# AI Agent Contract

> 与 AI 编程 Agent（Cursor / Claude Code / Copilot / Codex 等）协作的边界与留痕规则。
>
> solo 模式必读 §2 留痕最简版；mid-team+ 必读全文 + 在 PR 模板加硬字段。

---

## 1. 三类协作场景

| 场景 | 例 |
| --- | --- |
| Suggest | Agent 给建议，人写代码 |
| Pair | 人/Agent 交替 commit |
| Auto | Agent 自主 commit + PR |

不同场景对应不同审查强度。

## 2. 留痕规则

### 2.1 solo / small-team [solo+]

最简版：commit footer 加 `Co-authored-by`：

```
Co-authored-by: Claude <noreply@anthropic.com>
```

或 commit message 前缀 `bot:` / `agent:`。

### 2.2 mid-team+

PR 模板硬字段：

```markdown
## AI Agent 协作

- [ ] 是否使用 AI Agent: 是 / 否
- [ ] Agent 类型: Cursor / Claude / Copilot / 其他
- [ ] 协作模式: Suggest / Pair / Auto
- [ ] Auto 模式说明: <一句话>
```

CI 校验该字段非空。

### 2.3 org [org-only]

加：
- 单 commit 行数比例（agent vs human）写入 metadata
- 季度统计 Agent 参与率
- 安全敏感文件（密钥配置 / 审计日志 / IAM）禁止 Auto 模式

---

## 3. 边界矩阵

| 动作 | Agent 可自主 | 必须人审 | 留痕方式 |
| --- | --- | --- | --- |
| 业务代码（≤ 50 行 / 单文件） | yes | - | Co-authored-by |
| 业务代码（跨文件 / > 50 行） | - | yes | PR 模板字段 |
| 改 API 契约 | - | yes | PR 模板 + ADR |
| 改 DB schema / 迁移 | - | yes | PR 模板 + Gate Review |
| 改测试（新增） | yes | - | Co-authored-by |
| 删测试 | - | yes | PR 描述说明 + 评审 |
| 改配置（非密钥） | - | yes | PR 模板 |
| 改密钥 / `.env` | - | 严禁 | - |
| 起草 ADR | yes | yes | ADR Drafted-by 字段 |
| 改 Harness 自身规范 | - | yes + RFC | DEPRECATION_PATH |
| 紧急通道 | - | 严禁 Auto | 人执行 |
| 跑测试 / 跑构建 | yes | - | CI 留痕 |

阈值在 `harness.config.json.ai_agent` 可项目级覆盖：

```json
{
  "ai_agent": {
    "auto_commit_max_lines": 50,
    "auto_change_files_limit": 1,
    "require_human_review_for": ["api_change", "db_migration", "security", "secret"]
  }
}
```

---

## 4. Agent 操作的可观测性 [mid-team+]

### 4.1 必记录

- Agent 类型 / 版本
- 触发指令（prompt 摘要，不必全文）
- 改动文件 / 行数
- 是否走人审

### 4.2 不必记录

- 完整 prompt 与 reasoning（隐私 / 成本）
- 中间多轮对话

---

## 5. Agent 自我约束清单

Agent 在执行前自检：

- [ ] 改动是否超过单 PR 上限（默认 800 行 / 20 文件）
- [ ] 改动是否落在禁区（密钥 / 安全 / Harness 自身）
- [ ] 是否需要人审（按矩阵判定）
- [ ] 是否破坏现有测试
- [ ] 是否影响 API 契约 / DB schema

任一为 yes -> 切到人审模式，不直接 commit。

---

## 6. 反模式

| 反模式 | 危害 |
| --- | --- |
| Agent 写的代码我直接合 | 失去最后一道防线 |
| Agent 在紧急通道下 Auto 改生产代码 | 事故放大 |
| Agent 起草 ADR 直接 accepted | 决策无法追溯到人 |
| Agent 自动删测试 | 失去防线 |
| Agent 用 lint-disable 绕过规则 | 等于关闭工具 |

详见 [`ANTIPATTERNS.md`](ANTIPATTERNS.md)。

---

## 7. 与 .cursor/skills 和 rules 的关系

- skills 是 Agent 的执行流程定义（dev-flow / bugfix-flow 等）
- rules 是 Agent 必须遵守的硬规范
- 本契约定义 Agent **能做什么 / 不能做什么 / 怎么留痕**

互不替代。

---

## 8. 升档差异

| Mode | 留痕方式 | 边界检查 |
| --- | --- | --- |
| solo | Co-authored-by 即可 | 自我约束 |
| small-team | + PR 描述提及 | 评审者抽查 |
| mid-team+ | + PR 模板硬字段 + CI 校验 | 工具校验 + 评审者强制检查 |
| org | + 季度统计 + 安全敏感禁区强校验 | 平台级强约束 |
