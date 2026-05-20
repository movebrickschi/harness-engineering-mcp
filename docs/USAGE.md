# Harness Engineering MCP · 使用手册

> 本文档面向**第一次使用 `harness-engineering-mcp` 的开发者**，从安装到 4 个真实场景走完整链路。
> 参考文档：`README.md`（特性总览）、`docs/PROPOSAL.md`（设计思路）、`docs/M2_PS1_COMPATIBILITY.md` / `docs/M3_CURSOR_INTEGRATION.md` / `docs/M4_MULTI_IDE_INTEGRATION.md`（专题）。

---

## 0. 前置准备

- Node.js `>= 20`
- 任一支持 MCP 的 AI IDE：Cursor / Claude Code / Codex CLI
- （可选）`git` 在 PATH 中，否则 mode 推断会保守落到 `solo`

```bash
node -v   # 应输出 v20.x.x 以上
npm i -g harness-engineering-mcp@latest
harness --version
```

---

## 1. 场景 A：新项目从 0 接入

> 目标：5 分钟内把 Harness 完整接入一个空仓库。

### 1.1 初始化

```bash
mkdir order-api && cd order-api
git init
npm init -y
npm pkg set scripts.test="vitest run"
mkdir test

harness init --mode=solo --stack=node-typescript --type=backend-service --name=order-api
```

执行后会生成：

```
order-api/
├── .harness/
│   ├── config.json
│   ├── baseline.json
│   ├── engineering-harness.md             # SSOT
│   ├── adr/0001-engineering-harness-baseline.md
│   ├── features/INDEX.md
│   └── scripts/
│       ├── engineering-check.ps1
│       └── engineering-check.sh
└── .github/pull_request_template.md
```

### 1.2 首次门禁

```bash
harness check
```

预期：`PASS 7 · WARN 4 · FAIL 0`，整体 `WARN`（因为目前 `.harness/features/INDEX.md` 之类还是模板态）。

### 1.3 真实测试

```bash
# 写一个最小测试让 vitest 有内容跑
cat > test/sanity.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
describe("sanity", () => { it("works", () => expect(1).toBe(1)); });
EOF
npm install -D vitest

harness check --run-tests
```

预期 `tests.exec PASS` 出现在结果列表里。

### 1.4 后续

随着你陆续：

- 写 `.harness/adr/0002-...md` → `structure.adr` 转 PASS
- 在 `.harness/features/<name>/` 下用 Gate Review → `structure.features` 转 PASS
- 提交真实的 README → `docs.readme` 转 PASS

整体状态会逐步从 `WARN` 收敛到 `PASS`。

---

## 2. 场景 B：日常需求 → AI 自动路由

> 目标：把一句话需求交给 AI，让它自己选 skill、跑流程、最终绿灯提交。

### 2.1 把 MCP 挂到 Cursor

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "harness-engineering": { "command": "harness-mcp" }
  }
}
```

重启 Cursor，工具栏里会出现 `harness_*` 六个 tool。

### 2.2 一句话需求

在 Cursor 对话里直接说：

> 请用 harness_route_task 帮我把这句需求路由：「列表加一个状态筛选」

Cursor 会调：

```json
harness_route_task { "task": "列表加一个状态筛选" }
```

返回：

```json
{
  "skill": "dev-flow-oneliner-fe",
  "skill_uri": "harness://skills/dev-flow-oneliner-fe",
  "weight": "一句话需求",
  "deliverables": ["MINI_PRD", "IMPACT_ANALYSIS", "API_CONTRACT(if needed)"],
  "forced_upgrade": null,
  "modifiers": ["M2"],
  "suggested_next_tools": ["harness_load_skill", "harness_check"]
}
```

### 2.3 加载 skill

```json
harness_load_skill { "name": "dev-flow-oneliner-fe" }
```

Cursor 把 SKILL.md 内容塞回上下文，AI 后续按里面的清单（迷你 PRD → 切片 → 验证 → 提交）逐步推进。

### 2.4 闸门

写完代码后让 AI：

```json
harness_gate_review {
  "cwd": "/path/to/repo",
  "feature_name": "status-filter",
  "action": "generate"
}
```

→ 在 `.harness/features/status-filter/03_GATE_REVIEW.md` 生成 8 维度评审表。

人工 / AI 填表后再：

```json
harness_gate_review {
  "cwd": "/path/to/repo",
  "feature_name": "status-filter",
  "action": "check"
}
```

无 BLOCKER + 通过框打勾 → `status: passed`，可以进入实现 / 合并阶段。

### 2.5 提交前

```bash
harness check --strict --run-tests
```

`--strict` 把 WARN 升 FAIL；`--run-tests` 跑 `npm test`。整体 PASS 才考虑 commit。

---

## 3. 场景 C：触发强制升级（DB 变更）

> 目标：演示路由器如何对高风险任务**强制升级**到 `dev-flow-doc-*`。

```bash
harness route "后端新增订单表和查询接口"
```

输出（截取）：

```json
{
  "skill": "dev-flow-oneliner-be",
  "forced_upgrade": {
    "to": "dev-flow-doc-be",
    "reason": "涉及数据库 schema 变更"
  },
  "modifiers": ["M4"]
}
```

`forced_upgrade` 非空意味着：**这件事不能只走一句话需求骨架**，必须走完整 PRD 流程（`dev-flow-doc-be`），含完整阶段文档 01-06 + Gate Review。

触发关键词清单：

| 强制升级条件 | 关键词 |
|---|---|
| DB schema 变更 | 数据库 / schema / 表结构 / 建表 / 新增...表 / migration |
| 鉴权 / 租户 | 鉴权 / 权限 / auth / 租户 / 多租户 |
| 支付 / 订单 / 钱包 | 支付 / 订单 / 钱包 / payment |
| 工时 > 8h / 跨多模块 | 大改 / >=8h / 跨 N 模块 |

---

## 4. 场景 D：团队扩张升档

> 目标：从单人项目（`solo`）一步步走到组织级（`org`），零迁移成本。

### 4.1 solo → small-team

```bash
harness upgrade --to=small-team
```

新增（如果不存在）：

- `CHANGELOG.md`
- `.github/pull_request_template.md`

`.harness/config.json` 自动开启 `release.changelog` / `release.semver` / `process.gate_review_enabled`。

### 4.2 small-team → mid-team

```bash
harness upgrade --to=mid-team
```

新增：

- `.github/CODEOWNERS`
- `.harness/oncall.md`
- `.harness/SLO.md`

modules 中开启 `people.codeowners_enabled` / `people.oncall_enabled` / `quality.coverage_hard_gate` / `security.sca_on_pr` 等。

### 4.3 mid-team → org

```bash
harness upgrade --to=org
```

新增：

- `.harness/DORA.md`（部署频率 / lead time / 变更失败率 / MTTR）
- `.harness/rfc/0000-template.md`
- `.harness/SBOM.md`
- `.harness/compliance/.gitkeep`

modules 中开启 `release.feature_flags` / `release.slo_enabled` / `security.sbom_required` / `security.audit_log_required` / `knowledge.post_mortem_required` 等。

### 4.4 跨级升档

```bash
harness upgrade --to=org   # 直接从 solo 跳到 org，中间 tier 的增量文件会累积生成
```

已存在的文件**保留不动**，只补缺失项。

### 4.5 跑一次 check 验收

```bash
harness check --strict
```

升档完成后任何新模式下应启用的检查项不会 FAIL（除非你自己关掉了对应模块）。

---

## 5. 场景 E：CI 集成

> 目标：把 `harness check` 接进 GitHub Actions / GitLab CI。

### 5.1 GitHub Actions

```yaml
name: Harness Engineering

on: [pull_request]

jobs:
  harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install -g harness-engineering-mcp
      - name: harness check
        run: harness check --strict --run-tests --json > harness-report.json
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: harness-report
          path: harness-report.json
```

### 5.2 输出格式契约

PR-mode parser 可以按以下结构稳定消费：

```jsonc
{
  "status": "WARN",
  "summary": { "pass": 8, "warn": 3, "fail": 0, "total": 11 },
  "results": [
    {
      "category": "config",
      "check_id": "config.exists",
      "status": "PASS",
      "message": "..."
    }
  ],
  "elapsed_ms": 142
}
```

`check_id` 命名空间稳定见 `docs/M2_PS1_COMPATIBILITY.md`。

---

## 6. 常见问题

### Q1. `harness check` 报 `config.exists FAIL`？

仓库还没初始化。先跑 `harness init`。如果只是想做一次 dry run：

```bash
harness init --dry-run --mode=solo --stack=other --type=library --name=demo
```

### Q2. `tests.exec WARN: 无法为 stack=other 推断可执行的测试命令`

`stack=other` 时不会主动启动测试命令。把 `.harness/config.json` 里 `project.stack` 改成具体的栈即可。

### Q3. Cursor 中调 `harness_init` 时返回 `status: needs_input`？

输出 `ask_user` 数组告诉 AI 还差哪些字段，AI 应该继续问用户并把答案合并后再调一次。

### Q4. 想跑某一类检查项

```bash
harness check --categories=tests,secrets --run-tests
```

### Q5. `harness upgrade` 误升档怎么办？

升档**没有自动降档**。但所有增量文件可以手工删除，然后把 `.harness/config.json` 里 `project.mode` 改回原值再跑一次 `harness check`。下次升档时缺失的文件还会自动补齐。

### Q6. 工具升级后已生成文件不会回滚？

是。`harness upgrade` 永远只做**累积新增**，不破坏已有内容。如果想改 mode 增量模板，更新 `assets/templates/...` 后下次新项目 init 会用到新版本，老项目可以手工同步。

### Q7. 想强制按最新模板重新生成所有文件？

```bash
# ⚠️ 会覆盖你手写的 INDEX.md / ADR / config 自定义，先 git commit 一次再跑
harness init --force --mode=solo --stack=node-typescript --type=library --name=demo
```

不带 `--force` 时 init 默认**保留**已存在文件（即使内容与模板不同），返回 `action: skipped, reason: kept_existing`。

### Q8. 项目以后不再使用 harness 怎么彻底清除？

```bash
harness uninstall --dry-run     # 先看会删什么
harness uninstall               # 交互确认后递归删除 .harness/
harness uninstall -y            # 一键清除，无确认（脚本用）
```

`CHANGELOG.md` 和 `.github/*` 因为 npm / GitHub 外部工具约定**不会**被自动删除，会列在 `kept[]` 里提醒你手工处理。

如果只想清空 `.harness/` 内部但保留目录占位（便于 git 追踪）：

```bash
harness uninstall --keep-root-dir -y
```

---

## 7. 进阶链接

- 项目设计思路：`docs/PROPOSAL.md`
- ps1 → harness check 等价对照：`docs/M2_PS1_COMPATIBILITY.md`
- Cursor 联调清单：`docs/M3_CURSOR_INTEGRATION.md`
- Claude Code / Codex CLI 接入 + npm 发布流程：`docs/M4_MULTI_IDE_INTEGRATION.md`
- 内置 skills 索引：`harness list skills` 或读 `assets/skills/`
- 完整 spec：`harness list spec` 或读 `assets/spec/`
