# Harness Engineering MCP

> Engineering Harness as an MCP server + CLI · Cross-IDE engineering governance · TypeScript / Node 20+

`harness-engineering-mcp` 把一套**工程治理基线**（项目骨架 + 文档 + 门禁脚本 + 任务路由 + Gate Review + 升档剧本）包成一个可被任何 AI IDE 共用的 MCP server。

- **7 个 MCP 工具**：`harness_init` · `harness_check` · `harness_route_task` · `harness_load_skill` · `harness_gate_review` · `harness_upgrade_mode` · `harness_uninstall`
- **4 类 MCP 资源**：`harness://spec/*` · `harness://skills/*` · `harness://rules/*` · `harness://templates/*`（外加 `harness://config/schema` 与 `harness://stack-adapters/*`）
- **跨平台 CLI**：`harness init` · `harness check` · `harness route` · `harness upgrade` · `harness list` · `harness mcp` · `harness uninstall`
- 一份配置即可同时挂载到 **Cursor / Claude Code / Codex CLI** 三家 IDE

---

## 目录

1. [安装](#1-安装)
2. [5 分钟上手](#2-5-分钟上手)
3. [核心概念](#3-核心概念)
4. [MCP 工具详解](#4-mcp-工具详解)
5. [MCP 资源详解](#5-mcp-资源详解)
6. [CLI 命令参考](#6-cli-命令参考)
7. [`.harness/config.json` 配置](#7-harnessconfigjson-配置)
8. [IDE 接入](#8-ide-接入)
9. [常见场景](#9-常见场景)
10. [AI 高效执行 & 省 Token](#10-ai-高效执行--省-token)
11. [开发与贡献](#11-开发与贡献)
12. [更多文档索引](#12-更多文档索引)

---

## 1. 安装

```bash
# 全局安装（推荐：装一次到处用、IDE 接入零超时）
npm install -g harness-engineering-mcp

# 或在项目里直接调用，不全局安装（≥ 0.2.1 起 npx 包名直调也能用）
npx -y harness-engineering-mcp@latest init                  # CLI 简写
npx -y -p harness-engineering-mcp@latest harness init       # CLI 标准写法
npx -y -p harness-engineering-mcp@latest harness-mcp        # 起 MCP server
```

安装后同时提供 4 个 bin（后两个是 0.2.1 起新增的同义别名，方便记忆/避免凭直觉踩坑）：

| 二进制 | 作用 |
|---|---|
| `harness` | CLI 主入口（init/check/route/upgrade/list/mcp/uninstall）|
| `harness-mcp` | 启动 MCP server（IDE 自动调起，一般无需手工运行）|
| `harness-engineering-mcp` | `harness` 的别名（=「包名直调」，兼容 `npx <包名>` 习惯）|
| `harness-mcp-server` | `harness-mcp` 的别名（兼容 `@modelcontextprotocol/server-*` 命名习惯）|

> Node 版本要求：`>= 20`。
>
> 一句话记忆：**全局安装后用裸命令 `harness` / `harness-mcp`；不全局安装就用 `npx -y -p harness-engineering-mcp@latest <bin>` 或 0.2.1 起的 `npx -y harness-engineering-mcp@latest <subcmd>`**。
>
> 💡 **0.3.0 起已彻底打包零依赖**：发布包是单个自包含 tarball，无任何运行时依赖。npx 首次冷启动 < 3 秒，**不再需要预热**，配置一次即可直接接入 IDE。

---

## 2. 5 分钟上手（复制粘贴即跑通）

下面这一整段 **从空仓库到 harness 全绿** 一气呵成。每条命令下方用 `↳` 标的是预期输出片段——能对上就是装对了。

### Step 1 · 准备一个空 demo 项目

```bash
mkdir hello-harness && cd hello-harness
git init
npm init -y
npm pkg set scripts.test='node -e "process.exit(0)"'
mkdir test && echo "// placeholder" > test/sanity.test.js
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
```

预期：当前目录下有 `package.json` + `test/sanity.test.js` + `.gitignore`。

### Step 2 · 接入 Harness（生成 `.harness/` 所有产物）

```bash
harness init --mode=solo --stack=node-typescript --type=library --name=hello-harness
```

预期输出 ↳

```
harness_init: completed
- created .harness/config.json (1234 bytes)
- created .harness/baseline.json (412 bytes)
- created .harness/scripts/engineering-check.ps1 (123 bytes)
- created .harness/scripts/engineering-check.sh (98 bytes)
- created .harness/engineering-harness.md (567 bytes)
- created .harness/adr/0001-engineering-harness-baseline.md (...)
- created .harness/features/INDEX.md (...)
- created .harness/features/_template/01_REQUIREMENT_ANALYSIS.md (...)
  ... 7 个阶段模板 ...
- created .github/pull_request_template.md (...)
Next steps:
- 运行 harness_check 跑首次门禁
- 查看 .harness/engineering-harness.md 熟悉项目 SSOT
- 如团队规模发生变化可运行 harness_upgrade_mode 升档
```

文件树这时候是：

```
hello-harness/
├── .harness/
│   ├── config.json
│   ├── baseline.json
│   ├── engineering-harness.md         ← 项目 SSOT
│   ├── adr/0001-engineering-harness-baseline.md
│   ├── features/INDEX.md + _template/
│   └── scripts/engineering-check.{ps1,sh}
├── .github/pull_request_template.md
├── .gitignore
├── package.json
└── test/sanity.test.js
```

### Step 3 · 跑首次门禁

```bash
harness check
```

预期输出 ↳

```
Harness Check: PASS
PASS 13 · WARN 1 · FAIL 0 · 178ms

  ✓ config.exists          .harness/config.json 存在
  ✓ config.valid           mode=solo stack=node-typescript
  ✓ structure.ssot         SSOT .harness/engineering-harness.md 存在
  ⚠ structure.adr          .harness/adr/ 下 1 条 ADR（baseline）
  ✓ structure.features     features 任务看板存在
  ✓ secrets.envfile        未在仓库中发现 .env 文件
  ✓ secrets.gitignore      .gitignore 包含关键排除项
  ✓ tests.directory        测试目录 test 存在
  ✓ tests.command          npm test 已配置
  ✓ baseline.exists        .harness/baseline.json 存在
  ✓ baseline.valid         baseline version=1.0
  ✓ docs.readme            README.md 存在
  ✓ quality.coverage       未设置覆盖率基线，跳过
  ✓ quality.pr_size        变更 0 行 / 0 文件，在限制内
```

（README.md 没生成所以 `docs.readme` 会 WARN？实际是 `npm init -y` 默认不生成 README——如果你的 npm 版本生成了就是 PASS。WARN 也算上线。）

### Step 4 · 路由一句话需求

```bash
harness route "用户列表加一个按状态筛选的下拉框"
```

预期输出 ↳

```
[route] task = "用户列表加一个按状态筛选的下拉框"
skill: dev-flow-oneliner-fe
skill_uri: harness://skills/dev-flow-oneliner-fe
weight: 一句话需求
modifiers: [M2]
forced_upgrade: null
suggested_next_tools: [harness_load_skill, harness_check]
efficiency_hints:
  - 「列表 / 筛选」识别为 UI 范畴，可直接用 dev-flow-oneliner-fe 切片实现
  - 提交前必跑 harness check --strict
  - skill / spec 走 harness:// URI 引用，不要复制粘贴到 prompt 里
  - 短回复 + 表格优于散文
```

### Step 5 · 强制升档检测（可选验证）

```bash
harness route "后端加张订单表"
```

预期输出 ↳

```
skill: dev-flow-oneliner-be
modifiers: [M4]
forced_upgrade:
  to: dev-flow-doc-be
  reason: 涉及数据库 schema 变更，须走完整 PRD + 迁移脚本 + 回滚 SQL 流程
```

→ "加张表" 命中 M4 modifier，**自动从轻量 oneliner 升级到 doc-be 完整流程**，这是 harness 防止"周五顺手加表周一线上回不来"的核心机制。

### Step 6 · （可选）真实跑测试 + commit

```bash
harness check --strict --run-tests
git add -A && git commit -m "chore: harness baseline"
```

预期输出 ↳

```
Harness Check: PASS
PASS 14 · WARN 0 · FAIL 0 · 1240ms
  ✓ tests.exec             npm test 成功 (exit=0)

[main (root-commit) abc1234] chore: harness baseline
 N files changed, ... insertions(+)
```

✅ **5 分钟全跑通 = harness 装好可用**。

> - 完整真实场景（新项目接入 / AI 路由 / DB 升级触发 / 团队升档 / CI 集成）→ [`docs/USAGE.md`](docs/USAGE.md)
> - **MCP 装好后日常怎么用**（自然语言对话模板 / 开场白 / 7 工具不需记忆映射 / 资源 URI 速查）→ [`docs/IDE_DAILY_USAGE.md`](docs/IDE_DAILY_USAGE.md)
> - **不再想用 harness 了怎么完整清除** → `harness uninstall --dry-run` 预览，再 `harness uninstall` 执行。`CHANGELOG.md` 和 `.github/*` 因外部约定保留

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
| `force` | boolean | | 默认 false。设 true 时强制按模板重新生成已存在文件（**会覆盖你手写的 INDEX.md / ADR / config 自定义内容**）|

**输出**

```jsonc
{
  "status": "completed",            // ready | needs_input | completed | dry_run
  "detected": { "stack": "...", "project_type": "...", "evidence": [...] },
  "ask_user": [],                    // status=needs_input 时告诉 AI 还要问什么
  "generated_files": [
    { "path": ".harness/config.json", "action": "created", "bytes": 1024 }
  ],
  "next_steps": ["运行 harness check 校验首次门禁"]
}
```

**示例**

```bash
harness init --mode=small-team --stack=java-spring --type=backend-service --name=order-api
```

生成 6 个核心文件：`.harness/config.json` · `.harness/engineering-harness.md` · `.harness/scripts/engineering-check.{ps1,sh}` · `.harness/adr/0001-engineering-harness-baseline.md` · `.harness/baseline.json` · `.harness/features/INDEX.md`。

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
  "message": ".harness/config.json 存在",
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

生成或检查 `.harness/features/<name>/03_GATE_REVIEW.md`。

**输入**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cwd` | string | ✅ | |
| `feature_name` | string | ✅ | 在 `.harness/features/<name>/` 下落盘 |
| `action` | `generate/check` | | 默认 `generate` |

**输出**

```jsonc
{
  "status": "generated" | "passed" | "blocked",
  "file_path": ".harness/features/search-v2/03_GATE_REVIEW.md",
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

### 4.6 `harness_uninstall` · 清除 Harness 产物

从项目里清除 Engineering Harness 全部产物（递归删除 `.harness/` 目录）。

**输入**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `cwd` | string | ✅ | 项目绝对路径 |
| `dry_run` | boolean | | 仅列出将删除的文件，不动盘 |
| `keep_root_dir` | boolean | | 清空 `.harness/` 内部但保留目录本身 |

**输出**

```jsonc
{
  "status": "completed" | "dry_run" | "not_found",
  "removed": [".harness/config.json", ".harness/features/INDEX.md", ...],
  "kept": ["CHANGELOG.md", ".github/CODEOWNERS"],
  "next_steps": ["..."]
}
```

`kept` 列出因外部工具约定（npm/GitHub）保留的 harness 相关文件，需要手工删除。

---

### 4.7 `harness_upgrade_mode` · 模式升档

零成本从 `solo → small-team → mid-team → org` 累积升档。

**生成文件清单（累积）**

| 目标 mode | 新增文件 |
|---|---|
| `small-team` | `CHANGELOG.md` · `.github/pull_request_template.md`（init 已建则跳过）|
| `mid-team` | `.github/CODEOWNERS` · `.harness/oncall.md` · `.harness/SLO.md` |
| `org` | `.harness/DORA.md` · `.harness/rfc/0000-template.md` · `.harness/SBOM.md` · `.harness/compliance/.gitkeep` |

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
| `harness://config/schema` | `.harness/config.json` 的 JSON Schema |
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
| `--force` | 强制按模板重新生成所有 harness 文件（覆盖已有自定义内容；不指定时默认安全保留）|

> ⚠️ `--force` 会覆盖 `.harness/features/INDEX.md` 等可能含用户填入任务的文件。重新生成前务必 git commit 一次。

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
| `--from <mode>` | 起点 mode，不填则从 `.harness/config.json` 读取 |
| `--to <mode>` | 目标 mode（**必填**）|

### `harness list <category>`

| 子命令 | 说明 |
|---|---|
| `harness list skills` | 列出所有内置 skill |
| `harness list spec` | 列出 spec 文件 |
| `harness list rules` | 列出 .cursor/rules |

### `harness mcp`

启动 MCP server（stdio）。IDE 自动调起，一般无需手工运行。

### `harness uninstall [...]`

从项目里清除 Engineering Harness 全部产物（递归删除 `.harness/` 目录）。`CHANGELOG.md` 和 `.github/*` 因外部工具约定保留不动。

| flag | 说明 |
|---|---|
| `-C, --cwd <path>` | 项目根 |
| `--dry-run` | 仅列出将被删除的文件，不实际删除 |
| `--keep-root-dir` | 清空 `.harness/` 内部内容但保留目录本身（便于 git 追踪） |
| `-y, --yes` | 跳过交互式确认（CI / 脚本场景使用） |

示例：

```bash
harness uninstall --dry-run             # 先看要删什么
harness uninstall                       # 交互确认后删除
harness uninstall -y                    # 一键删除，不确认（脚本里用）
harness uninstall --keep-root-dir -y    # 清空内容、保留 .harness/ 占位
```

---

## 7. `.harness/config.json` 配置

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

> ### ⚡ 0.3.0 起：零依赖、免预热、配置即跑
>
> 从 **0.3.0** 开始，发布包做了「全依赖打包」：`dependencies` 字段为空，`dist/` 是自包含 bundle。新机器 `npx` 首次只下载一个 ~900 KB 的 tarball，**全程无传递依赖解析**，本机实测 **install 2.2s + 启动 0.3s ≈ 总 2.5s**（网络好时），稳低于 Cursor / Claude Code 的 MCP 握手超时（~10s）。
>
> **你不再需要预热**：直接把下面的 §8.2 / §8.3 / §8.4 配置粘进 IDE 即可。
>
> 老用户从 0.2.x 升级注意：`dependencies` 已清空，如果你之前用 `npm i -g` 全局装过，建议 `npm i -g harness-engineering-mcp@latest` 刷一次，去掉那 5 个用不到的间接依赖（ajv / globby / simple-git / yaml / zod）。
>
> **团队 / 生产环境**仍然推荐全局安装一次，让 IDE 配置最干净：
>
> ```bash
> npm i -g harness-engineering-mcp@latest
> # 之后所有 IDE 的 mcp.json 都写：{ "command": "harness-mcp" }
> ```
>
> Mac 用户额外注意：如果你用 nvm 装的 node，GUI 启动的 IDE 拿不到 nvm 路径，需要按下面 §8.1 的 3 种方案任选一个绕开（**不只我们这个 MCP，所有 npm-based MCP 在 Mac + nvm 环境下都有这个问题**）。

### 8.1 🍎 Mac + nvm 用户必读：3 种修复（普适问题）

**问题描述**：在 Mac 上，如果你用 nvm 管理 node，从 Dock / Spotlight 启动的 Cursor / Claude Code 等 GUI 应用，由 `launchd` 拉起，**`launchd` 不会读你的 `~/.zshrc`**，所以拿不到 nvm 注入的 PATH。结果就是 mcp.json 里写 `"command": "npx"` 时，IDE 找不到 `npx` 可执行，MCP server 起不来。

**这是 npm-based MCP 生态的普适问题**，跟我们这个包零关系。`@modelcontextprotocol/server-filesystem` / `server-github` / `server-puppeteer` 等官方 demo 也都受同样影响。Anthropic / Cursor 官方文档对此也有专门说明。

**3 种修复（任选其一）**：

#### 方案 A · 写绝对路径（最简单，1 分钟）

```bash
# 先在终端查出你当前 node / npx 的绝对路径
which node
which npx
# 例如可能输出：/Users/你/.nvm/versions/node/v22.13.0/bin/npx
```

然后把 mcp.json 改为绝对路径：

```json
{
  "mcpServers": {
    "harness-engineering": {
      "command": "/Users/你/.nvm/versions/node/v22.13.0/bin/npx",
      "args": ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
    }
  }
}
```

> 缺点：用 `nvm use` 换了 node 版本后这条路径会失效，需要再改一次。

#### 方案 B · 软链到 `/usr/local/bin`（一劳永逸，但要 sudo）

```bash
sudo ln -sf $(which node) /usr/local/bin/node
sudo ln -sf $(which npx)  /usr/local/bin/npx
```

`/usr/local/bin` 在 launchd 的**默认 PATH** 里，软链好之后 mcp.json 写 `"command": "npx"` 即可正常工作。

> 缺点：换 nvm 版本后要重 ln 一次。

#### 方案 C · 改用 Homebrew node（最干净，推荐给重度使用 MCP 的用户）

```bash
# 如果你不重度使用 nvm 切版本，可以直接卸了换 Homebrew
brew install node
# 然后从 .zshrc / .bashrc 删除 nvm 的 export 行
# 最后重启终端 + 重启 Cursor
```

Homebrew 把 node 装在 `/opt/homebrew/bin`（Apple Silicon）或 `/usr/local/bin`（Intel），**这两个目录都在 launchd 默认 PATH 里**，所有 GUI 应用都能直接找到 `node` / `npx`，再也不会撞 PATH 问题。

> 缺点：失去 nvm 多版本切换能力。如果你日常要在多个 node 版本之间切，请走方案 A 或 B。

#### 我们的建议

| 你的情况 | 推荐方案 |
|---|---|
| 平时不切 node 版本 | **方案 C**（最干净） |
| 偶尔切版本，但不嫌每次重 ln | **方案 B** |
| 经常切版本 | **方案 A**（绝对路径写死，每次切版本同步改 mcp.json） |

#### 验证修复

修完之后，从 Dock 重启 Cursor，在 MCP 面板里看到 `harness-engineering` 变绿即可。命令行可以这样独立验证 GUI 启动器能否找到 npx：

```bash
# 模拟 GUI 应用的 launchd 启动环境，看 npx 在不在 PATH
launchctl getenv PATH | tr ':' '\n' | grep -E "(nvm|node|local/bin|homebrew)"
# 然后试试 launchd 能不能直接执行 npx：
osascript -e 'do shell script "which npx"'
```

如果 `osascript` 这一行能输出路径，说明 launchd 环境下 npx 可达，Cursor 一定能调起来。

### 8.2 Cursor

```json
// ~/.cursor/mcp.json
// 推荐：不依赖全局安装，npx 自动从 npm 拉取
{
  "mcpServers": {
    "harness-engineering": {
      "command": "npx",
      "args": ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
    }
  }
}
```

已全局安装（`npm i -g harness-engineering-mcp`）后可简化为：

```json
{
  "mcpServers": {
    "harness-engineering": { "command": "harness-mcp" }
  }
}
```

详细测试清单见 `docs/M3_CURSOR_INTEGRATION.md`。

### 8.3 Claude Code

```json
// ~/.config/claude-code/mcp.json
{
  "mcpServers": {
    "harness-engineering": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
    }
  }
}
```

> 已全局安装可简化为 `"command": "harness-mcp"`。Windows 上若 PATH 中找不到 `harness-mcp`，请用上面的 npx 写法。

### 8.4 Codex CLI

```toml
# ~/.codex/config.toml
[[mcp_servers]]
name = "harness-engineering"
command = "npx"
args = ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
```

> 已全局安装可简化为 `command = "harness-mcp"`、删除 `args`。

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
3. 按 SKILL.md 流程产出 .harness/features/<name>/01_..06_*.md
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
    npx -y -p harness-engineering-mcp@latest harness check --strict --run-tests --json > harness-report.json
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
| L1 · Project | `.harness/config.json` + SSOT + baseline | MCP 工具按需读，跨任务复用 |
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

mid-team+ 项目建议把这些指标接进 `.harness/DORA.md` 旁的「AI Efficiency Board」每月跟进。

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
| [`docs/IDE_DAILY_USAGE.md`](docs/IDE_DAILY_USAGE.md) | **MCP 装好后每天怎么用** · 自然语言对话模板 · 开场白 · 7 工具不需记忆映射 · 资源 URI 速查 · 故障排查 |
| [`docs/COMPARISON.md`](docs/COMPARISON.md) | **vs Cursor rules / Claude memories / Aider** 等同类工具对比 · 共存方案 · 决策树 |
| [`docs/EXECUTION_FLOW.md`](docs/EXECUTION_FLOW.md) | **9 个 mermaid 流程时序图** · 涵盖全部 7 个 MCP 工具 + Modifier 检测 + 端到端链路 |
| [`docs/PROPOSAL.md`](docs/PROPOSAL.md) | v0.1 设计草案（API 契约 / 时序图 / 4 周 milestone）|
| [`docs/M2_PS1_COMPATIBILITY.md`](docs/M2_PS1_COMPATIBILITY.md) | 与原 `engineering-check.ps1` 的等价对照表 + CI 迁移指南 |
| [`docs/M3_CURSOR_INTEGRATION.md`](docs/M3_CURSOR_INTEGRATION.md) | Cursor MCP 接入步骤 + URI 测试清单 |
| [`docs/M4_MULTI_IDE_INTEGRATION.md`](docs/M4_MULTI_IDE_INTEGRATION.md) | Cursor / Claude Code / Codex CLI 兼容性矩阵 + npm 发布流程 |
| [`assets/spec/AI_EFFICIENCY.md`](assets/spec/AI_EFFICIENCY.md) | LLM 高效执行 & 省 token 契约（6 铁律 / 三层缓存 / 6 KPI） |
| [`assets/spec/PRIORITY_HIERARCHY.md`](assets/spec/PRIORITY_HIERARCHY.md) | L0–L4 规范优先级元规则与冲突裁决 |
| [`assets/skills/INDEX.md`](assets/skills/INDEX.md) | 40 个 skill 的决策树 + 频率分布（资源 URI `harness://skills/_decision-tree`）|
| [`CHANGELOG.md`](CHANGELOG.md) | 版本变更记录 |
| [`assets/spec/README.md`](assets/spec/README.md) | Engineering Harness Spec 总览 |

---

## License

MIT
