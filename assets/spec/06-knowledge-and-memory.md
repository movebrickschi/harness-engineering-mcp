---
spec_id: harness-spec-06-knowledge
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# 06 Knowledge & Memory

> ADR、features 任务板、Onboarding、Post-mortem、文档站点。
>
> solo 模式必读 §1（ADR） + §2（features 看板最简版）。

---

## 1. ADR（Architecture Decision Records） [solo+]

### 1.1 何时必写

参考 [`02-process-and-governance.md`](02-process-and-governance.md) §3。要点：

- 引入 / 替换 / 移除外部依赖
- 修改架构分层
- 影响 ≥ 1 季度的技术选型
- 性能 / 可用性 / 安全关键决策
- 规范条目废弃 / 升级（参考 [`DEPRECATION_PATH.md`](DEPRECATION_PATH.md)）

### 1.2 文件位置与命名

```
.harness/adr/
├── README.md                  ADR 总说明
├── 0000-template.md           模板
├── 0001-<title>.md            真实 ADR
├── 0002-<title>.md
└── ...
```

命名：4 位数字 + kebab-case 标题。

### 1.3 模板必备字段

参考 [`templates/governance/adr/0000-template.md`](templates/governance/adr/0000-template.md)：

- 状态（proposed / accepted / superseded by NNNN / deprecated）
- 日期
- 决策者
- 上下文（context）
- 决策（decision）
- 后果（consequences，含正反两面）
- 拒绝的替代方案
- 实施计划
- 验证方式

### 1.4 状态流转

```
proposed -> accepted -> [superseded by NNNN | deprecated]
```

被替代时旧 ADR 不删，新 ADR 显式 `Supersedes 0017`。

### 1.5 Mode 差异

| Mode | 是否需要 Reviewer 签字 |
| --- | --- |
| solo | 自己拍板即可 |
| small-team+ | 至少 1 名共识 |
| mid-team+ | ≥ 2 名 owner + 项目负责人 |
| org | RFC 流程（[`DEPRECATION_PATH.md`](DEPRECATION_PATH.md)） |

---

## 2. features 任务板 [solo+]

### 2.1 文件结构

```
.harness/features/
├── README.md                  使用说明
├── INDEX.md                   全部任务看板
├── _template/                 阶段文档模板
│   ├── 01_REQUIREMENT_ANALYSIS.md
│   ├── 02_SOLUTION_DESIGN.md
│   ├── 03_GATE_REVIEW.md      [mid-team+]
│   ├── 04_DEVELOPMENT.md
│   ├── 05_CODE_REVIEW.md
│   └── 06_TEST_REPORT.md
└── <feature-slug>/            每个真实需求一个目录
    ├── 01_REQUIREMENT_ANALYSIS.md
    └── ...
```

### 2.2 INDEX.md 字段

每条记录：

- ID / 标题 / T 档
- 状态（planned / in-progress / blocked / done / postponed）
- 负责人
- 关联 ADR
- 关联 PR
- 创建 / 完成时间
- 备注（如紧急通道、回滚记录）

### 2.3 阶段文档启用规则

| T 档 | 启用阶段文档 |
| --- | --- |
| T0 / T1 | 仅 INDEX 一行记录 + MINI_PRD（feature-brief） |
| T2 Bug | 仅 INDEX + 根因记录 |
| T3 中需求 [small-team+] | 01 / 02 / 05 / 06 |
| T4 大需求 [mid-team+] | 01-06 全 |
| 紧急通道 | 事后补 |

### 2.4 Solo 模式建议

solo 项目的 features 看板可以直接合入 `docs/dev-notes.md` 单文件维护（不必拆目录）。升档到 small-team 时再拆。

---

## 3. Onboarding 30/60/90 [small-team+]

参考 [`templates/knowledge/onboarding-30-60-90.md`](templates/knowledge/onboarding-30-60-90.md)。

### 3.1 三阶段

| 阶段 | 时长 | 目标 | 验收 |
| --- | --- | --- | --- |
| 30 天 | 第 1 个月 | 能独立提交 PR、跑通本地环境、读懂主流程 | 至少 1 个被合入的 PR |
| 60 天 | 第 2 个月 | 独立完成 T2-T3 任务，理解 6 模块 | 至少 1 个完整 feature 闭环 |
| 90 天 | 第 3 个月 | 能 Code Review 他人 PR、参与设计评审 | 至少 1 次 Review 给出有效建议 |

### 3.2 必读清单

- README + CONTRIBUTING + 本规范包对应 mode 必读路径
- 项目内 SSOT
- 最新季度复盘
- 关键 ADR（按导师指定）

### 3.3 导师责任

- 第 1 周每天 30 分钟 1on1
- 第 2-4 周每周 1 次
- 90 天结束做正式回顾

---

## 4. Post-mortem [small-team+]

参考 [`templates/knowledge/post-mortem-template.md`](templates/knowledge/post-mortem-template.md)。

### 4.1 文化原则

- **Blameless**：对事不对人
- **5 Whys**：连问 5 个为什么直至根因
- **Action Items 必须有 Owner + 截止日期**
- **公开**：默认对全团队公开（敏感数据脱敏）

### 4.2 模板字段

- 摘要（1 段话）
- 时间线（精确到分钟）
- 影响（多少用户 / 多少订单 / 多长时间）
- 根因（5 Whys）
- 直接原因 vs 根本原因
- 已做的应急动作
- Action Items 表（项 / 负责人 / 截止 / 状态）
- 经验教训（What went well / Wrong / Lucky）

### 4.3 何时必写

| 触发 | 必写 |
| --- | --- |
| 生产事故 | 是 |
| 数据丢失 / 错误 | 是 |
| 安全事件 | 是 |
| 重大近 miss（差点出事故） | 建议 |
| 一般 Bug | 否 |

### 4.4 跟进

- 每周 stand-up 检查 Action Items 进度
- 季度复盘汇总未完成项

---

## 5. 文档站点 [mid-team+] [optional]

适合复杂产品 / 公开 SDK。可选：

- mkdocs（Python 生态）
- Docusaurus（Node 生态）
- VuePress / VitePress
- Hugo / Jekyll

不强求；solo / small-team 用 markdown + GitHub 渲染即可。

---

## 6. README 与 CONTRIBUTING [solo+]

### 6.1 README 必备字段

- 项目用途（一句话）
- 快速开始（5 行命令）
- 技术栈
- 目录结构
- 链接到 CONTRIBUTING / engineering-harness.md
- License

### 6.2 CONTRIBUTING 必备字段 [small-team+]

- 开发环境搭建
- 提交规范（链接到 [`01-people-and-collaboration.md`](01-people-and-collaboration.md) §2）
- PR 流程
- 紧急通道说明

### 6.3 项目内 SSOT（engineering-harness.md）

- 引用本规范包，标明 mode 与 maturity
- 列出与本项目特定的偏离 / 扩展
- ≤ 200 行

---

## 7. 决策日志 vs 任务记忆

| 类型 | 文件 | 维护频率 |
| --- | --- | --- |
| 决策日志（why） | `.harness/adr/` | 重大决策时 |
| 任务记忆（what / how） | `.harness/features/` | 每个 T2+ 任务 |
| 故障日志（what went wrong） | `docs/postmortem/` | 事故后 |
| 长期文档（how to use） | `docs/<topic>.md` | 持续 |

不要混用；混用会导致历史可追溯性变差。

---

## 8. 与其他模块的关系

- ADR 与 Gate Review -> [`02-process-and-governance.md`](02-process-and-governance.md)
- Onboarding 必读路径 -> 本规范包 README §2
- Post-mortem 与回滚 -> [`04-release-and-operations.md`](04-release-and-operations.md) §4
- AI Agent 改 ADR 必须人审 -> [`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md)
