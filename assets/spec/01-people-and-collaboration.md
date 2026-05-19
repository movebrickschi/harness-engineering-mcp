---
spec_id: harness-spec-01-people
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
optional_for: [solo]
---

# 01 People & Collaboration

> 谁评审、谁批准、分支怎么开、提交怎么写、PR 多大、On-call 谁顶。
>
> solo 模式：本文整体可跳过；如对外开源建议读 §2（提交） + §3（PR 模板）。

---

## 1. 分支策略 [small-team+]

### 1.1 默认：trunk-based + 短期 feature 分支

```
main                    长期保护分支，CI 必通过
  └── feat/<scope>-<n>  ≤ 5 天生命周期
  └── fix/<issue>       ≤ 2 天生命周期
  └── chore/<task>
```

- 长期 feature 分支视为反模式（参考 [`ANTIPATTERNS.md`](ANTIPATTERNS.md)）
- 合入 main 前必须 rebase 或 squash，避免 merge commit 噪音

### 1.2 可选：git-flow [mid-team+]

适用：版本化发布产品（含发布周期 ≥ 月、需要并行多版本维护）。

```
main          稳定版本
develop       集成分支
release/x.y   发布准备
hotfix/<...>  从 main 拉，修复后回灌 main + develop
```

### 1.3 选型矩阵

| 团队特征 | 推荐策略 |
| --- | --- |
| 持续部署 / 多次/天 | trunk-based |
| 周/月发布 + 并行版本 | git-flow |
| 单仓多产品 | trunk-based + feature flag |

---

## 2. 提交信息规范 [small-team+]

### 2.1 Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

| type | 用途 |
| --- | --- |
| feat | 新功能 |
| fix | Bug 修复 |
| refactor | 重构（行为零变化） |
| perf | 性能优化 |
| test | 测试 |
| docs | 文档 |
| build | 构建 / 依赖 |
| ci | CI 配置 |
| chore | 其他 |
| revert | 回滚 |

### 2.2 中文 type 别名（可选）

允许：`新增`/`修复`/`重构`/`优化`/`测试`/`文档`/`构建`/`回滚`，工具应等价处理。

### 2.3 反例与正例

```
fix bug                                        反例：无信息
fix login                                      反例：scope 模糊
fix(auth): tokens not refreshed when expired   正例
feat(api): add /v1/orders pagination           正例
```

### 2.4 footer 字段

| 字段 | 何时写 |
| --- | --- |
| `Closes #123` | 关联 issue |
| `Co-authored-by: <name> <email>` | 多人 / Agent 协作 |
| `BREAKING CHANGE: ...` | 不向后兼容 |

---

## 3. PR 规范

### 3.1 PR 模板必填字段 [solo+]

参考 [`templates/collaboration/pr-template.md`](templates/collaboration/pr-template.md)。所有 mode 都需要：

- 背景 / 任务类型 / 影响范围
- 关键改动文件列表
- 测试方式
- 自检清单（CI 通过 / 文档同步 / 无密钥泄漏）

mid-team+ 增加：

- API 契约变更说明（若有）
- DB 迁移与回滚 SQL（若有）
- AI Agent 协作留痕（若涉及）

### 3.2 PR 大小硬上限 [small-team+]

| 上限 | 默认值 | 处置 |
| --- | --- | --- |
| 改动行数 | 800 行 | 超出由作者自拆，或评审者拒绝 |
| 改动文件数 | 20 文件 | 同上 |
| 改动模块跨度 | ≤ 3 模块 | 跨度过大要求拆 PR |

例外：自动生成代码、依赖升级、纯改名重构 — 必须在 PR 描述中显式说明。

### 3.3 Draft 与 WIP

- 大改动先开 Draft PR 让团队感知
- WIP 不进入正式 review；CI 仍跑

### 3.4 Squash / Merge / Rebase 选择

| 策略 | 适用 |
| --- | --- |
| Squash | 默认；保持 main 历史清洁 |
| Rebase | feature 分支与 main 同步用 |
| Merge commit | 仅 git-flow 的 release/hotfix 回灌 |

---

## 4. Code Review

### 4.1 自检版（solo / small-team） [solo+]

参考 [`templates/quality/code-review-checklist.md`](templates/quality/code-review-checklist.md) 自检版。开 PR 前作者按清单自检。

### 4.2 互审版 [small-team+]

| 阶段 | 评审者动作 |
| --- | --- |
| 第一轮：可读性 | 命名 / 注释 / 模块边界 |
| 第二轮：正确性 | 逻辑 / 边界 / 异常 / 并发 / 资源释放 |
| 第三轮：可维护性 | 测试覆盖 / 可观测 / 文档 |
| 第四轮：影响 | API / DB / 性能 / 安全 |

### 4.3 Review SLA [mid-team+]

| 严重度 | 首次响应 | 完成评审 |
| --- | --- | --- |
| 紧急修复 | 30 分钟 | 2 小时 |
| 一般 | 4 工作小时 | 1 工作日 |
| 低优 | 1 工作日 | 3 工作日 |

CODEOWNERS 自动指派，未指派的视为整团队负责。

### 4.4 评审者职责 [mid-team+]

- 不直接代写代码（避免角色混淆，参考回退路由 §5 of [`02-process-and-governance.md`](02-process-and-governance.md)）
- 必改项明示（"必须改"/"建议改"/"思考"）
- 评审通过须明示 LGTM 或 Approve

---

## 5. CODEOWNERS [mid-team+]

参考 [`templates/collaboration/CODEOWNERS.tmpl`](templates/entry/CODEOWNERS.tmpl)。规则：

- 每条路径至少 2 个 owner（避免单点）
- owner 离职 / 调岗时立刻更新
- 不允许把整个仓挂在 1 人名下

```
# 示例
/src/payment/        @alice @bob
/docs/adr/           @platform-team
/.github/            @devops-team
```

---

## 6. On-call 轮值 [mid-team+] [solo-skip]

参考 [`templates/collaboration/oncall-rotation.md.tmpl`](templates/collaboration/oncall-rotation.md.tmpl)。

### 6.1 轮值表必备字段

- 周次 / 主值班 / 副值班 / 升级路径
- 响应时长（生产事故 ≤ 5 分钟应答；其他 ≤ 30 分钟）
- 切换时刻（建议周一 10:00 北京时间）
- 切换 Runbook（前一名值班把未结事项书面交接）

### 6.2 升级路径

```
On-call (L1) -> Tech Lead (L2) -> 项目负责人 (L3)
```

L2 介入：1 小时未恢复 / 数据丢失嫌疑 / 安全漏洞嫌疑。
L3 介入：4 小时未恢复 / 跨产品影响 / 媒体可见性。

---

## 7. 工时与容量估算 [mid-team+]

| 任务规模 | 估算粒度 | 误差预期 |
| --- | --- | --- |
| 一句话需求 | 0.5 / 1 / 2 / 4 工时 | ±50% |
| 单模块需求 | 0.5 / 1 / 2 / 3 工日 | ±50% |
| 跨模块需求 | 1 / 2 / 4 / 8 工日 + 1 周 buffer | ±100% |

WIP 限制：每人同时 in-progress ≤ 3 任务。

---

## 8. 与其他模块的关系

- 提交规范 + PR 模板 -> [`02-process-and-governance.md`](02-process-and-governance.md) DoD
- Review checklist -> [`03-quality-and-testing.md`](03-quality-and-testing.md)
- 紧急通道 -> [`02-process-and-governance.md`](02-process-and-governance.md) §8
- AI Agent 协作 -> [`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md)
