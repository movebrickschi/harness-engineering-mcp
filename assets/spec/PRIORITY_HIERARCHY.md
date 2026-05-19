---
spec_id: harness-spec-priority-hierarchy
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# Priority Hierarchy · 规范优先级裁决

> 当 rule / spec / skill / 项目本地约定之间出现冲突时，按本表裁决。**冲突即 stop**，不要"两边都做一点"。

---

## 1. 优先级（高 → 低）

| 层级 | 名称 | 文件位置 | 拒绝违反 | 可否项目级覆盖 |
|---|---|---|---|---|
| **L0** | **企业法务 / 合规硬约束** | `assets/spec/05-security-and-compliance.md` 内被标 `[compliance:gdpr/pipl/hipaa]` 的子项 | 必须 | 不可 |
| **L1** | **Hard rules（rules/）** | `assets/rules/*.mdc` | 必须，违反 = CI FAIL | 可在项目 `.cursor/rules/` 局部覆盖单条 |
| **L2** | **Spec 模块（applies_to 命中当前 mode）** | `assets/spec/01..06_*.md` + 专题（DORA / MATURITY 等）| 必须，违反需 ADR 解释 | 可通过 `harness.config.json.modules.*` 关闭模块开关 |
| **L3** | **Skill 流程（建议）** | `assets/skills/<name>/SKILL.md` | 推荐遵循，可记录理由跳步 | 可在项目内 fork 后改 |
| **L4** | **项目本地约定** | `<project>/docs/engineering-harness.md` 自添加部分 | 在本项目内有效 | — |

---

## 2. 冲突处理流程

### 2.1 同级冲突

| 同级别冲突 | 处理 |
|---|---|
| 两条 L1 rule 冲突 | 后编号优先；同时记 ADR 阐明合并 |
| 两个 L2 spec 模块冲突 | 取 `min_level` 更严格者 |
| 两个 L3 skill 推荐不同 | 选最新版本；用 `harness_load_skill` 加载时记录所选版本 |

### 2.2 跨级冲突

```
L0 与 任何级别 → L0 胜
L1 与 L2/L3/L4 → L1 胜（除非项目级覆盖明文写出）
L2 与 L3 → L2 胜
L3 与 L4 → L4 胜（本地优先）
```

例：

- skill 建议「直接上线」vs rule 要求「先 Gate Review」→ **rule 胜**
- 项目本地约定「测试覆盖 30% 即可」vs spec 默认要求 60% → **若已在 ADR 中阐明 + 主管签字 → 本地胜**；否则 spec 胜

### 2.3 当前未定义情况

任意冲突在本规范找不到裁决项 → 写 RFC（org 模式下走 `docs/rfc/`），不要"凭感觉决定"。

---

## 3. 项目级覆盖路径

### 3.1 关闭整条 rule

在项目根 `.cursor/rules/<rule-id>.mdc` 加 frontmatter：

```yaml
---
applies_to: []           # 显式置空，关闭本项目对该 rule 的应用
override_reason: "本项目不使用 MyBatis，使用 jOOQ"
---
```

`harness_check` 在扫描时跳过该 rule，并把覆盖原因记录到 `verification_baseline.json`。

### 3.2 关闭 spec 模块

`harness.config.json` 内：

```json
{
  "modules": {
    "security": {
      "secret_scan": false,
      "_override_reason": "纯内部工具，无敏感凭据"
    }
  }
}
```

升档时 `harness_upgrade_mode` 会**保留**这些覆盖项，不强制覆盖。

### 3.3 fork skill

把 `assets/skills/<name>/SKILL.md` 复制到 `<project>/.harness/skills/<name>/SKILL.md`，CLI / MCP 优先加载本地版本。

---

## 4. 反例（不允许的裁决方式）

| 反模式 | 危害 | 正确做法 |
|---|---|---|
| 「两边各执行一半」 | 规范失去信号 | 按上表裁决，单边执行 |
| 「按字数长的那个执行」 | 与原意无关 | 看 L 级别 |
| 「ADR 记一行就视作覆盖通过」 | 缺主管签字 = 无效 | 项目级覆盖必须 ADR + 评审 |
| 「Skill 比 Rule 详细 → Skill 优先」 | 颠倒优先级 | Rule 永远胜 Skill |

---

## 5. 与其它规范的关系

| 规范 | 关系 |
|---|---|
| `AI_AGENT_CONTRACT.md` | 互补 · AI 做什么 |
| `AI_EFFICIENCY.md` | 互补 · 怎么省 token |
| `MATURITY_LEVELS.md` | 互补 · 不同 mode 下 spec 命中范围 |
| `DEPRECATION_PATH.md` | 互补 · spec/rule 废弃流程 |
| 本规范 | **元规则** · 当上述发生冲突时按此裁决 |

---

## 6. 审计

CI 可以通过 `harness_check --strict` 跑出所有冲突列表（计划中）。短期内由人工 / Gate Review 把关。
