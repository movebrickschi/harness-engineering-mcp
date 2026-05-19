# Harness Engineering MCP

> Engineering Harness as an MCP server + CLI · Cross-IDE engineering governance · TypeScript / Node 20+

`harness-engineering-mcp` 把一套**工程治理基线**（项目骨架 + 文档 + 门禁脚本 + 任务路由 + Gate Review + 升档剧本）包成一个可被任何 AI IDE 共用的 MCP server。

- **6 个 MCP 工具**：`harness_init` · `harness_check` · `harness_route_task` · `harness_load_skill` · `harness_gate_review` · `harness_upgrade_mode`
- **4 类 MCP 资源**：`harness://spec/*` · `harness://skills/*` · `harness://rules/*` · `harness://templates/*`（外加 `harness://config/schema` 与 `harness://stack-adapters/*`）
- **跨平台 CLI**：`harness init` · `harness check` · `harness route` · `harness upgrade` · `harness list` · `harness mcp`
- 一份配置即可同时挂载到 **Cursor / Claude Code / Codex CLI** 三家 IDE

---

## 目录

1. [安装](#1-安装)
2. [5 分钟上手](#2-5-分钟上手)
3. [核心概念](#3-核心概念)
4. [MCP 工具详解](#4-mcp-工具详解)
5. [MCP 资源详解](#5-mcp-资源详解)
6. [CLI 命令参考](#6-cli-命令参考)
7. [`harness.config.json` 配置](#7-harnessconfigjson-配置)
8. [IDE 接入](#8-ide-接入)
9. [常见场景](#9-常见场景)
10. [AI 高效执行 & 省 Token](#10-ai-高效执行--省-token)
11. [开发与贡献](#11-开发与贡献)
12. [更多文档索引](#12-更多文档索引)

---

## 1. 安装

```bash
# 全局安装
npm install -g harness-engineering-mcp

# 或在项目里直接调用，不全局安装
npx harness-engineering-mcp init
```

安装后会同时提供：

| 二进制 | 作用 |
|---|---|
| `harness` | CLI 主入口（init/check/route/upgrade/list/mcp）|
| `harness-mcp` | 启动 MCP server（IDE 自动调起，一般无需手工运行）|

> Node 版本要求：`>= 20`。

---

## 2. 5 分钟上手

```bash
# 1. 在任意项目根目录下初始化
cd my-project
harness init --mode=solo --stack=node-typescript --type=library --name=my-project

# 2. 跑首次门禁
harness check
# Harness Check: WARN
# PASS 7 · WARN 4 · FAIL 0 · 142ms
# ...

# 3. 给一句话需求做路由
harness route "列表加一个状态筛选"
# 推荐 skill: dev-flow-oneliner-fe
# modifiers: [M2]

# 4. （可选）加上真实测试执行
harness check --run-tests
# tests.exec PASS · 末尾: ... Tests 21 passed (21)
```

完整端到端只需要 **4 条命令**。

> 想看更详细的真实场景走通（新项目接入 / AI 路由 / DB 升级触发 / 团队升档 / CI 集成）请直接读 [`docs/USAGE.md`](docs/USAGE.md)。

---

## 3. 核心概念

### 3.1 模式（mode）

| mode | 适用规模 | 默认开启 |
|---|---|---|
| `solo` | 单人 / 1 person | trunk 分支、基础 secrets 扫描 |
| `small-team` | 2–4 人 | + CHANGELOG、PR 模板、code review 流程 |
| `mid-team` | 5–15 人 | + CODEOWNERS、On-call、SLO、SCA |
| `org` | 16+ 人 / 跨团队 | + DORA、RFC、SBOM、合规附件 |

升档零成本：`harness upgrade --to=mid-team` 自动累加缺失的增量文件，已有文件原样保留。

### 3.2 栈（stack）

| stack | 检测信号 | 测试命令 |
|---|---|---|
| `java-spring` | `pom.xml` / `build.gradle(.kts)` | `mvn test -B` / `gradle test` |
| `node-typescript` | `package.json` + `scripts.test` | `npm test --silent` |
| `python` | `pyproject.toml` / `requirements.txt` | `pytest -q` |
| `go` | `go.mod` | （计划中）|
| `other` | 默认兜底 | 用户自定义 |

### 3.3 项目类型（project_type）

`backend-service` · `library` · `cli` · `frontend-spa`

### 3.4 任务路由 modifiers

| tag | 含义 | 触发关键词示例 |
|---|---|---|
| `M1` | 有设计稿 | `带设计稿` `figma` `mockup` |
| `M2` | UI / 无设计稿 | `没有设计稿` `UI` `页面` `列表` `组件` |
| `M3` | 鉴权 / 多租户 | `鉴权` `权限` `auth` `登录` |
| `M4` | DB schema 变更 | `数据库` `schema` `新增...表` `migration` |
| `M5` | 联调 / 端到端 | `只联调` `联调` `集成测试` |

modifiers 与 `forced_upgrade.reason` 一起，决定推荐 skill（`dev-flow-oneliner-*` ↔ `dev-flow-doc-*`）。

---

## 4. MCP 工具详解

> 所有工具的输入输出契约都对应 `src/types/harness.ts`，IDE 客户端会自动加载 JSON Schema 用于参数校验。

### 4.1 `harness_init` · 项目初始化

扫描项目并生成 Harness 个性化文件。

**输入**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cwd` | string | ✅ | 项目绝对路径 |
| `mode` | `solo/small-team/mid-team/org` | | 缺省时由扫描器建议 |
| `stack` | `java-spring/node-typescript/python/go/other` | | 缺省时按文件签名识别 |
| `project_type` | `backend-service/library/cli/frontend-spa` | | |
| `project_name` | string | | 缺省时从 `pom.xml` / `package.json` / `pyproject.toml` 推断 |
| `ide` | `cursor/claude-code/codex/...` | | `auto` 自动检测 |
| `maturity_target` | `L1..L4` | | 默认 `L1` |
| `compliance` | `gdpr/pipl/iso27001/soc2/hipaa[]` | | |
| `dry_run` | boolean | | 仅预览不写盘 |

**输出**

```jsonc
{
  "status": "completed",            // ready | needs_input | completed | dry_run
  "detected": { "stack": "...", "project_type": "...", "evidence": [...] },
  "ask_user": [],                    // status=needs_input 时告诉 AI 还要问什么
  "generated_files": [
    { "path": "harness.config.json", "action": "created", "bytes": 1024 }
  ],
  "next_steps": ["运行 harness check 校验首次门禁"]
}
```

**示例**

```bash
harness init --mode=small-team --stack=java-spring --type=backend-service --name=order-api
```

生成 6 个核心文件：`harness.config.json` · `docs/engineering-harness.md` · `scripts/engineering-check.{ps1,sh}` · `docs/adr/0001-engineering-harness-baseline.md` · `verification_baseline.json` · `docs/features/INDEX.md`。

---

### 4.2 `harness_check` · 工程门禁

跨平台的 `engineering-check.ps1` 替代品。

**输入**

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `cwd` | string | — | 必填 |
| `categories` | `config/structure/tests/secrets/baseline/docs/all[]` | `["all"]` | |
| `strict` | boolean | false | WARN 也升级为 FAIL（等价 ps1 `-Strict`）|
| `output_format` | `summary/detailed/json` | `summary` | |
| `run_tests` | boolean | false | 真实执行 `mvn/npm/pytest`，结果落到 `tests.exec` |
| `test_timeout_ms` | number | 600000 | 单次测试命令超时 |

**输出结构**（每条 result）

```jsonc
{
  "category": "config",
  "check_id": "config.exists",
  "status": "PASS",            // PASS | WARN | FAIL
  "message": "harness.config.json 存在",
  "suggestion": "...",         // 可选
  "file": "...", "line": 12    // 可选
}
```

整体 status 计算规则：
1. 任一 FAIL → FAIL（exitCode=1）
2. `strict=true` 且有 WARN → FAIL
3. 否则有 WARN → WARN
4. 都没问题 → PASS

**check_id 全集**（ps1 兼容空间，详见 `docs/M2_PS1_COMPATIBILITY.md`）

```
config.exists · config.valid
structure.ssot · structure.adr · structure.features
secrets.envfile
tests.directory · tests.command · tests.exec (run_tests=true 时才出现)
baseline.exists · baseline.valid
docs.readme
```

---

### 4.3 `harness_route_task` · 任务路由

一句话需求 → 推荐 skill + 产物清单 + 强制升级判定。

**输入**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `task` | string | ✅ | 一句话需求 |
| `cwd` | string | | 项目根（可选）|
| `context.scope` | `frontend/backend/full-stack` | | 强制指定开发范围 |
| `context.has_prd` | boolean | | 是否带 PRD |
| `context.has_prototype` | boolean | | 是否带原型 |

**输出**

```jsonc
{
  "skill": "dev-flow-oneliner-fe",
  "skill_uri": "harness://skills/dev-flow-oneliner-fe",
  "weight": "一句话需求",
  "deliverables": ["MINI_PRD", "IMPACT_ANALYSIS", "API_CONTRACT(if needed)"],
  "forced_upgrade": { "to": "dev-flow-doc-fe", "reason": "涉及数据库 schema 变更" },
  "modifiers": ["M2", "M4"],
  "suggested_next_tools": ["harness_load_skill", "harness_check"]
}
```

**示例**

```bash
harness route "后端新增订单表和查询接口"
# skill: dev-flow-oneliner-be
# forced_upgrade: dev-flow-doc-be · 涉及数据库 schema 变更
# modifiers: [M4]
```

---

### 4.4 `harness_load_skill` · 加载技能正文

| 输入 | 输出 |
|---|---|
| `name`：技能名（如 `dev-flow-oneliner-fe`）| `content`（SKILL.md 正文）+ `depends_on` + `related` |

**示例**

```bash
harness list skills           # 看所有技能
node dist/cli.js mcp           # 启动 MCP 由 IDE 调用 harness_load_skill
```

技能总集见 `assets/skills/*/SKILL.md`，覆盖 dev-flow 全 13 个 + bugfix/refactor/perf/third-party/brainstorming 等。

---

### 4.5 `harness_gate_review` · 闸门评审

生成或检查 `docs/features/<name>/03_GATE_REVIEW.md`。

**输入**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cwd` | string | ✅ | |
| `feature_name` | string | ✅ | 在 `docs/features/<name>/` 下落盘 |
| `action` | `generate/check` | | 默认 `generate` |

**输出**

```jsonc
{
  "status": "generated" | "passed" | "blocked",
  "file_path": "docs/features/search-v2/03_GATE_REVIEW.md",
  "blockers": ["缺少回滚 SQL", "鉴权策略缺失"]
}
```

`status=passed` 仅在两个条件同时满足时返回：
- 文件中无 BLOCKER bullet 也无 B-N 表行
- 结论一节的 `[x] 通过` 已勾选

**示例**

```bash
# 生成
harness route "为 search-v2 做闸门评审" 
# 然后 AI 调用 harness_gate_review action=generate feature_name=search-v2

# 检查
harness_gate_review cwd=$(pwd) feature_name=search-v2 action=check
```

---

### 4.6 `harness_upgrade_mode` · 模式升档

零成本从 `solo → small-team → mid-team → org` 累积升档。

**生成文件清单（累积）**

| 目标 mode | 新增文件 |
|---|---|
| `small-team` | `CHANGELOG.md` · `.github/pull_request_template.md`（init 已建则跳过）|
| `mid-team` | `.github/CODEOWNERS` · `docs/oncall.md` · `docs/SLO.md` |
| `org` | `docs/DORA.md` · `docs/rfc/0000-template.md` · `docs/SBOM.md` · `compliance/.gitkeep` |

> 已存在的文件**保留原内容**并在 `generated_files[].action` 中标记为 `skipped`，永不覆盖。

**示例**

```bash
harness upgrade --to=mid-team
# from=solo to=mid-team
# 生成 5 个新文件，跳过 1 个已存在
```

---

## 5. MCP 资源详解

资源通过 `harness://` URI 暴露，AI 可直接通过 IDE 的资源面板加载。

| URI | 说明 |
|---|---|
| `harness://spec/index` | spec 文件索引（含 frontmatter）|
| `harness://spec/file/<filename>` | 单个 spec 文件正文 |
| `harness://skills/index` | 所有 skill 的 JSON 元数据列表 |
| `harness://skills/<name>` | 单个 SKILL.md 正文 |
| `harness://rules/index` | `.cursor/rules` 全集索引 |
| `harness://rules/<filename>` | 单条规则 markdown |
| `harness://templates/index` | 模板清单 |
| `harness://templates/<path>` | 单模板文件正文 |
| `harness://config/schema` | `harness.config.json` 的 JSON Schema |
| `harness://stack-adapters/<stack>` | 单个 stack 适配指南（java-spring / node-typescript / python）|

---

## 6. CLI 命令参考

### `harness init [...]`

| flag | 说明 |
|---|---|
| `-C, --cwd <path>` | 项目根，默认当前目录 |
| `--mode <mode>` | `solo/small-team/mid-team/org` |
| `--stack <stack>` | `java-spring/node-typescript/python/go/other` |
| `--type <type>` | `backend-service/library/cli/frontend-spa` |
| `--name <name>` | 项目名 |
| `--dry-run` | 仅打印，不写盘 |

### `harness check [...]`

| flag | 说明 |
|---|---|
| `-C, --cwd <path>` | 项目根 |
| `--categories <list>` | `config,structure,tests,secrets,baseline,docs,all`（逗号分隔）|
| `--strict` | WARN 升 FAIL |
| `--json` | 输出 JSON |
| `--run-tests` | 真实跑 `mvn/npm/pytest`，并把结果计入 `tests.exec` |
| `--test-timeout-ms <ms>` | 单次测试命令超时（默认 600000 = 10 分钟）|

### `harness route <task> [...]`

| flag | 说明 |
|---|---|
| 第一个位置参数 | 一句话需求 |
| `--scope <fe/be/full>` | 强制指定开发范围 |
| `--has-prd` | 标记带 PRD |
| `--has-prototype` | 标记带原型项目 |

### `harness upgrade --to <mode>`

| flag | 说明 |
|---|---|
| `--from <mode>` | 起点 mode，不填则从 `harness.config.json` 读取 |
| `--to <mode>` | 目标 mode（**必填**）|

### `harness list <category>`

| 子命令 | 说明 |
|---|---|
| `harness list skills` | 列出所有内置 skill |
| `harness list spec` | 列出 spec 文件 |
| `harness list rules` | 列出 .cursor/rules |

### `harness mcp`

启动 MCP server（stdio）。IDE 自动调起，一般无需手工运行。

---

## 7. `harness.config.json` 配置

完整 JSON Schema 见：

- 文件：`assets/spec/harness.config.schema.json`
- MCP 资源：`harness://config/schema`
- TS 类型：`src/types/harness.ts: HarnessConfig`

**最小骨架**

```json
{
  "version": "0.1",
  "project": {
    "name": "my-project",
    "type": "backend-service",
    "stack": "java-spring",
    "mode": "solo"
  },
  "modules": {
    "people":   { "branch_strategy": "trunk", "pr_max_lines": 600 },
    "process":  { "gate_review_enabled": true },
    "quality":  { "coverage_baseline": 0.6 },
    "release":  { "semver": true, "changelog": true },
    "security": { "secret_scan": true },
    "knowledge":{ "feature_board": true }
  }
}
```

各模块开关随 `mode` 升档而自动增加，不需要手工逐个开。

---

## 8. IDE 接入

### 8.1 Cursor

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "harness-engineering": { "command": "harness-mcp" }
  }
}
```

详细测试清单见 `docs/M3_CURSOR_INTEGRATION.md`。

### 8.2 Claude Code

```json
// ~/.config/claude-code/mcp.json
{
  "mcpServers": {
    "harness-engineering": {
      "type": "stdio",
      "command": "harness-mcp"
    }
  }
}
```

### 8.3 Codex CLI

```toml
# ~/.codex/config.toml
[[mcp_servers]]
name = "harness-engineering"
command = "harness-mcp"
```

三 IDE 完整兼容性矩阵 + 联调脚本：`docs/M4_MULTI_IDE_INTEGRATION.md §3-5`。

---

## 9. 常见场景

### 9.1 给老项目接入 Harness

```bash
cd legacy-api
harness init                   # 走交互；扫描器会建议合理的 mode/stack
harness check                  # 看首次门禁结果
harness check --run-tests      # 加上真实测试看是否绿
```

### 9.2 接到一句话需求

AI / IDE 内部链路：

```text
1. harness_route_task task="..." → 拿到 skill + modifiers + forced_upgrade
2. harness_load_skill name=<skill> → 读 SKILL.md
3. 按 SKILL.md 流程产出 docs/features/<name>/01_..06_*.md
4. harness_gate_review action=check feature_name=<name> → 出 blocker
5. harness_check --run-tests → 最终绿灯后再提交
```

### 9.3 团队扩张升档

```bash
# solo → small-team
harness upgrade --to=small-team

# small-team → mid-team
harness upgrade --to=mid-team
```

### 9.4 CI 集成

```yaml
# .github/workflows/harness.yml
- name: Harness Engineering check
  run: |
    npx -y harness-engineering-mcp check --strict --run-tests --json > harness-report.json
- name: Upload report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: harness-report
    path: harness-report.json
```

---

## 10. AI 高效执行 & 省 Token

> 与「能不能做」的边界规则（`AI_AGENT_CONTRACT`）互补，这里规定「同一件事用多少 token 做完」。

`harness_route_task` 的返回值新增字段 **`efficiency_hints`**，会按 skill / modifiers / forced_upgrade 给出 3-6 条立即可照做的建议：

```jsonc
{
  "skill": "dev-flow-oneliner-be",
  "modifiers": ["M4"],
  "forced_upgrade": { "to": "dev-flow-doc-be", "reason": "涉及数据库 schema 变更" },
  "efficiency_hints": [
    "spec/rule 走 harness:// URI 引用，不要复制粘贴到 prompt 里（保持 prompt cache 命中）",
    "DB schema 变更：先出迁移脚本 + 回滚 SQL，再写代码，禁止跳过 ADR",
    "强制升级到 dev-flow-doc-be：保留完整 PRD + 阶段文档，禁止偷工省略",
    "回复 < 2000 字符，表格优于散文，独立工具调用一次性批发"
  ]
}
```

### 10.1 完整契约 / Skill / 硬规则三件套

| 文件 | 角色 |
|---|---|
| [`assets/spec/AI_EFFICIENCY.md`](assets/spec/AI_EFFICIENCY.md) | 设计契约：核心铁律 6 条 + 三层缓存策略 + 量化 KPI 6 项 |
| [`assets/skills/ai-efficiency/SKILL.md`](assets/skills/ai-efficiency/SKILL.md) | 执行 skill：6 阶段（入场自检 → 检索 → 阅读 → 修改 → 验证 → 输出 → 卡住时切模式）每阶段的清单 |
| [`assets/rules/16-ai-efficiency.mdc`](assets/rules/16-ai-efficiency.mdc) | Cursor 直接消费的 10 条不可违反硬规则 |

通过 MCP 资源 URI 即可访问：

```
harness://spec/file/AI_EFFICIENCY.md
harness://skills/ai-efficiency
harness://rules/16-ai-efficiency.mdc
```

### 10.2 6 条核心铁律（速查）

1. **先窄后宽**：先 `Grep` 精确字符串，再 `Read` offset/limit 切片，禁止上来读整个大文件
2. **切片不全读**：单次 Read ≤ 500 行；> 500 行先 Grep 定位
3. **并行批发**：同一轮里 ≥ 2 个独立工具调用必须一次性发出
4. **Subagent 隔离**：检索 ≥ 3 文件 → 委派 subagent，主会话只保留摘要
5. **短输出 + 结构化**：每段回复 ≤ 2000 字符，表格优于散文
6. **计划与执行分离**：> 3 步任务先 `writing-plans` 出明文计划再 `executing-plans`

### 10.3 三层缓存策略

| 层 | 内容 | 加载方式 |
|---|---|---|
| L0 · System / Spec | Harness spec / rules 全集 | MCP 资源 URI 一次挂载，永不抄进 prompt |
| L1 · Project | `harness.config.json` + SSOT + baseline | MCP 工具按需读，跨任务复用 |
| L2 · Task | 当前 feature 的 01-06 文档 + 本轮文件 + 本轮日志 | 一次性，结束即丢 |

让 L0 / L1 在 prompt cache 中常驻，每轮只让 L2 承担新增 token → cache 命中率 ≥ 60% 是合理基线。

### 10.4 量化 KPI

| 指标 | 期望 |
|---|---|
| 单次回复 ≤ 2000 字符 | ≥ 95% |
| 工具并行率 | ≥ 60% |
| Grep+Glob vs Read 比 | ≥ 2:1 |
| Plan-then-execute 命中率（> 3 步任务）| ≥ 80% |
| Prompt cache 命中率 | ≥ 60% |
| Subagent 委派率（> 3 文件检索）| ≥ 80% |

mid-team+ 项目建议把这些指标接进 `docs/DORA.md` 旁的「AI Efficiency Board」每月跟进。

---

## 11. 开发与贡献

### 10.1 本地开发

```bash
git clone https://github.com/movebrickschi/harness-engineering-mcp.git
cd harness-engineering-mcp
npm install
npm run typecheck && npm run lint && npm test && npm run build
```

### 10.2 项目脚本

| 脚本 | 作用 |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | vitest（60+ 用例，约 1.6 秒）|
| `npm run test:coverage` | 含覆盖率 |
| `npm run build` | tsup 打包 dist/ |
| `npm pack --dry-run` | 预览 npm 发布包 |

### 10.3 目录速查

```
src/
  cli/        CLI 命令（init/check/route/upgrade/list/mcp）
  core/       业务核心（scanner / renderer / checker / router / config）
  mcp/        MCP server + tools/ + resources/
  types/      共享 TS 类型
assets/
  spec/       Engineering Harness Spec（含 schema）
  skills/     内置 skills（dev-flow 全套 + 通用 18 个）
  rules/      .cursor/rules 模板
  templates/  init / features / pr / adr 模板
  stack-adapters/  Java Spring · Node TS · Python 适配指南
test/         12 个测试文件，57 用例
docs/         PROPOSAL / M2-M4 各阶段联调文档
```

### 10.4 发布

完整流程见 `docs/M4_MULTI_IDE_INTEGRATION.md §6`。简版：

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm pack --dry-run                     # 检查包内容
npm publish --access public            # 需先 npm login
git tag v0.1.0 && git push origin v0.1.0
```

---

## 12. 更多文档索引

| 文档 | 用途 |
|---|---|
| [`docs/USAGE.md`](docs/USAGE.md) | **新手必读** · 5 个端到端场景走通（新项目接入 / AI 路由 / 强制升级 / 团队升档 / CI 集成）|
| [`docs/PROPOSAL.md`](docs/PROPOSAL.md) | v0.1 设计草案（API 契约 / 时序图 / 4 周 milestone）|
| [`docs/M2_PS1_COMPATIBILITY.md`](docs/M2_PS1_COMPATIBILITY.md) | 与原 `engineering-check.ps1` 的等价对照表 + CI 迁移指南 |
| [`docs/M3_CURSOR_INTEGRATION.md`](docs/M3_CURSOR_INTEGRATION.md) | Cursor MCP 接入步骤 + URI 测试清单 |
| [`docs/M4_MULTI_IDE_INTEGRATION.md`](docs/M4_MULTI_IDE_INTEGRATION.md) | Cursor / Claude Code / Codex CLI 兼容性矩阵 + npm 发布流程 |
| [`CHANGELOG.md`](CHANGELOG.md) | 版本变更记录 |
| [`assets/spec/README.md`](assets/spec/README.md) | Engineering Harness Spec 总览 |

---

## License

MIT
