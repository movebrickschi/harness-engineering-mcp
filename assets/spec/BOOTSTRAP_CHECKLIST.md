---
spec_id: harness-spec-bootstrap
applies_to: [solo, small-team, mid-team, org]
min_level: L1
---

# Bootstrap Checklist

> 按项目模式选择起点段落落地。每段后是「完成判定」，不通过不进入下一阶段。

## 0. 通用准备（任何 mode 都要做）

- [ ] 把 `templates/entry/` 复制到项目根
- [ ] 重命名 `harness.config.<mode>.json` 为 `harness.config.json`
- [ ] 替换 `<PROJECT_NAME>` `<STACK>` 等占位符
- [ ] 通过 `harness.config.schema.json` 校验

完成判定：`harness.config.json` schema 校验通过。

---

## 1. solo 段（7+3 文件，约 1 小时）[solo+]

### 1.1 入口与规范

- [ ] `README.md`（来自 `templates/entry/README.md.tmpl`）
- [ ] `CONTRIBUTING.md` 或 `docs/dev-notes.md`
- [ ] `docs/engineering-harness.md` 项目内 SSOT（精简 200 行）

### 1.2 ADR 与基线

- [ ] `docs/adr/0001-engineering-harness-baseline.md`
- [ ] `verification_baseline.json`（含首次记录）

### 1.3 本地门禁

- [ ] `scripts/engineering-check.ps1` 或 `.sh`
- [ ] 跑通并输出 PASS/WARN/FAIL

### 1.4 选配（按项目类型）

- [ ] library / cli / frontend-spa: `docs/perf-budget.md`
- [ ] 对外发版: `CHANGELOG.md`

### 完成判定

- 上述 7 必备文件齐全
- `engineering-check` 单次执行 ≤ 5 秒
- ADR 0001 内容真实非模板

---

## 2. small-team 段（在 solo 基础上 +5 文件，约 5 天）[small-team+]

### 2.1 协作与提交

- [ ] `templates/collaboration/branch-strategy.md.tmpl`
- [ ] `templates/collaboration/commit-message.md.tmpl`
- [ ] `.github/pull_request_template.md`

### 2.2 简化版 Code Review

- [ ] `templates/quality/code-review-checklist.md`（自检版）

### 2.3 发版基线

- [ ] `templates/release/CHANGELOG.md.tmpl`

### 2.4 任务记忆

- [ ] `docs/features/INDEX.md`
- [ ] `docs/features/_template/`（仅启用 01 / 02 / 05 三个阶段）

### 完成判定

- 至少 1 个真实 PR 走完模板填写
- INDEX 至少 1 条真实记录
- CI 跑过一次（GitHub Actions / GitLab CI）

---

## 3. mid-team 段（在 small-team 基础上 +15 文件，约 30 天）[mid-team+]

### 3.1 6 模块文档完整启用

- [ ] [`01-people-and-collaboration.md`](01-people-and-collaboration.md) 全文
- [ ] [`02-process-and-governance.md`](02-process-and-governance.md) 全文（含 Gate Review / 回退路由 / DoD / 紧急通道）
- [ ] [`03-quality-and-testing.md`](03-quality-and-testing.md) 全文（含性能预算 + 覆盖率基线）
- [ ] [`04-release-and-operations.md`](04-release-and-operations.md) 全文（含 Feature Flag / SLO / Runbook）
- [ ] [`05-security-and-compliance.md`](05-security-and-compliance.md) 全文（含数据分级 / 审计日志 / SCA）
- [ ] [`06-knowledge-and-memory.md`](06-knowledge-and-memory.md) 全文（含 Onboarding / Post-mortem 文化）

### 3.2 横切补强

- [ ] [`PROJECT_TYPES.md`](PROJECT_TYPES.md)
- [ ] [`MATURITY_LEVELS.md`](MATURITY_LEVELS.md)
- [ ] [`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md)
- [ ] [`STACK_ADAPTERS/<stack>.md`](STACK_ADAPTERS/) 对应栈

### 3.3 模板补齐

- [ ] `templates/collaboration/pr-size-policy.md.tmpl`
- [ ] `templates/collaboration/oncall-rotation.md.tmpl`
- [ ] `templates/release/rollback-runbook.md.tmpl`
- [ ] `templates/release/feature-flags-policy.md.tmpl`
- [ ] `templates/release/slo-template.md`
- [ ] `templates/security/secret-management.md.tmpl`
- [ ] `templates/security/dependency-policy.md.tmpl`
- [ ] `templates/knowledge/onboarding-30-60-90.md`
- [ ] `templates/knowledge/post-mortem-template.md`

### 3.4 项目治理

- [ ] CODEOWNERS 启用
- [ ] On-call 轮值表上线
- [ ] perf-budget 写入 `verification_baseline.json` 并启用门禁对比
- [ ] SCA（依赖漏洞扫描）每 PR + 周报上线

### 完成判定

- 至少 1 次完整需求走过 6 阶段文档闭环
- 至少 1 次主动验证：CI 能拦截违反基线的提交
- 至少 1 次 post-mortem（如无真实事故，可用一次 near-miss）

---

## 4. org 段（在 mid-team 基础上 +余下全量，约 1 季度）[org-only]

### 4.1 度量与自证

- [ ] [`DORA.md`](DORA.md) 四指标采集上线
- [ ] `templates/knowledge/dora-dashboard.md.tmpl` 月度看板
- [ ] perf / 覆盖率 / SCA 趋势可视化

### 4.2 治理

- [ ] [`DEPRECATION_PATH.md`](DEPRECATION_PATH.md) RFC 流程激活
- [ ] AI Agent 硬留痕字段写入 PR 模板
- [ ] 季度 Harness 复盘上线

### 4.3 合规与安全深度

- [ ] `templates/security/data-classification.md.tmpl`
- [ ] `templates/security/audit-log-policy.md.tmpl`
- [ ] SBOM 自动生成与归档

### 完成判定

- 季度 DORA 四指标至少有一条数据
- 至少完成一次 RFC 流程（哪怕是简单条目调整）
- 跨项目共享 Harness 修订（多产品线同步规范升级）

---

## 5. 跨阶段反模式

- 跳级落地（solo 直接套 mid-team）→ 容易疲劳放弃，参考 [`ANTIPATTERNS.md`](ANTIPATTERNS.md)
- 升档但不改 `harness.config.json` → 工具仍按旧 mode 行为
- 把紧急通道当成日常路径 → 触发 [`02-process-and-governance.md`](02-process-and-governance.md) §8 红线

---

## 6. 升档零迁移成本

```
solo -> small-team:    改 harness.config.json mode + 按 §2 段补 5 文件
small-team -> mid-team: 改 mode + 按 §3 段补 15 文件
mid-team -> org:       改 mode + 按 §4 段补全量
```

任意阶段已存在的文件不需要改写或移动。
