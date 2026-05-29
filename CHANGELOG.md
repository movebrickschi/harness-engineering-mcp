# Changelog

## [Unreleased]

### Fixed

- **版本号收拢为单一真理源，消除「server 上报旧版本」隐患**：新增 `src/core/version.ts`，运行时从 `package.json` 回溯读取版本（开发态 / tsup bundle 两态一致）；`src/mcp/server.ts` 与 `src/cli/index.ts` 不再各自硬编码版本字符串。此前 0.3.1 发布时漏改了 `server.ts` 的 fallback，导致 MCP `initialize` 与 stdio banner 仍上报 `v0.3.0`。新增 `test/version.test.ts` 断言上报版本严格等于 `package.json.version`，防止再次漂移。今后发版只改 `package.json`（`npm version` 自动维护）即可。
- **修复 CLI 在 ESM 产物下一启动即崩溃**：`tsup.config.ts` 用 `noExternal` 把 `commander`（CJS）打进 ESM bundle 后，其内部 `require("events")` 触发 esbuild 的 `Dynamic require of "events" is not supported`，导致 `dist/cli.js`（即发布版 `npx harness-engineering-mcp <cmd>` 的全部 CLI 命令）自 0.3.0 起一运行就崩。给三个入口的 banner 注入 `createRequire(import.meta.url)`，让 ESM 产物拥有可用的 `require`。MCP server（stdio）不受此 bug 影响，本次一并加固。已验证 `cli --version` 输出 0.3.1、`cli --help` 正常列命令、mcp-server banner 正常。

## 0.3.1 — 2026-05-26

### Fixed

- **MCP server 入口自启检测兼容 npx symlink**（commit `cacc198`）：`isDirectRun()`（`src/mcp/server.ts`）的入口正则此前只匹配 `mcp-server.js` / `server.ts`。当通过 `npx -p harness-engineering-mcp@latest harness-mcp` 启动时，进程入口是 npm 在 macOS/Linux 下创建的软链 `harness-mcp`（无 `.js` 后缀），正则不匹配 → `startMcpServer()` 不触发 → Cursor / Claude Code 报 `MCP error -32000: Connection closed`。正则新增 `harness-mcp(?:-server)?` 分支，npx 软链入口现在能正确自启。Windows 下走 `.js` 路径，本就不受影响。

## 0.3.0 — 2026-05-25

### 背景

0.2.1 通过排除 source map 把首装时间从 ~20s 砍到 ~10s，但 Cursor / Claude Code 的 MCP 握手默认超时是 5-10s，仍然在临界点，新机器首启依旧会随机踩坑 `Connection failed: MCP error -32000: Connection closed`，README §8 不得不要求用户先在终端跑一次预热。

0.3.0 彻底根治这个问题：**「全依赖打包 + 清零运行时依赖」**，让 npm 这边没有任何传递依赖可解，发布包就是 1 个自包含 tarball。新机器实测 `npm install` 2.2s + 启动 0.3s ≈ 总 2.5s，远低于握手超时，**真正免预热**。

### Changed (BREAKING None · 行为完全等价 · 仅安装体验改变)

- **`package.json` 的 `dependencies` 由 9 个 → 0 个**：
  - 删除 5 个 src/test 里**完全未使用**的死代码依赖：`ajv` / `globby` / `simple-git` / `yaml` / `zod`（grep 全仓库 0 引用，PROPOSAL.md 里曾经规划但实际未实现的能力）；
  - 剩余 5 个真实使用的依赖（`@modelcontextprotocol/sdk` / `commander` / `handlebars` / `picocolors` / `prompts`）移入 `devDependencies`，由 tsup 在构建期直接打进 dist；
  - 发布包对消费者来说**零运行时依赖**，npm 不需要解析传递依赖树。

- **`tsup.config.ts` 启用 `noExternal`**：三个入口（`index.ts` / `cli.ts` / `mcp-server.ts`）都把 5 个真实依赖一起打进 bundle。
  - 副作用：`dist/mcp-server.js` 84 KB → 799 KB，`dist/cli.js` 95 KB → 1.05 MB（自包含，无需 `node_modules`）；
  - 发布 tarball 由 371 KB → 897 KB，**单文件下载，0 网络往返解依赖**，net win。

- **版本号同步**：`src/cli/index.ts` 与 `src/mcp/server.ts` 的硬编码 `VERSION` 由 `0.2.1` → `0.3.0`。

### Docs

- **README §1**「一句话记忆」下方的 ⚠️ 预热警告改为 💡 `0.3.0 起已彻底打包零依赖`，告诉用户「不再需要预热」。
- **README §8 IDE 接入**「⚡ 首次接入前必读：冷启动可能超时」整段重写为「⚡ 0.3.0 起：零依赖、免预热、配置即跑」，附带本机实测数据与升级老用户的提示。
- **README §8.1 新增「🍎 Mac + nvm 用户必读：3 种修复（普适问题）」**：交代清楚 Mac + nvm + GUI 应用 launchd PATH 问题是 npm-based MCP 生态层面的普适问题（不只我们这个包），给出 A 写绝对路径 / B 软链到 `/usr/local/bin` / C 改用 Homebrew node 三种标准绕开法及验证命令。原 §8.1 Cursor 顺延为 §8.2，§8.2 Claude Code 顺延为 §8.3，§8.3 Codex CLI 顺延为 §8.4。

### Verified

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅ 69/69 通过
- **真实 MCP 协议 E2E**：bundled `dist/mcp-server.js` 经 stdio 完成 `initialize` → `tools/list` → `resources/list` 全流程，返回 7 tools + 107 resources，确认 `@modelcontextprotocol/sdk` 内部 ajv 验证器在 bundle 后仍正常工作（无动态 `require` 失败）。
- **冷启动实测**（Windows 本机 `npm install ./harness-engineering-mcp-0.3.0.tgz --no-save`）：install 2165 ms，node 启动到 banner 输出 258 ms，**总 2.4s**。

## 0.2.1 — 2026-05-22

### 背景

0.2.0 发布后陆续在三台机器（Windows / Mac × 2）上验证 Cursor 接入，发现 npm 用户在「初装」环节有两个独立的高频踩坑：
1. 包名 ≠ bin 名，凭直觉写 `npx <包名>` 必报 `could not determine executable to run`。
2. npx 冷启动 5-30 秒，超过 Cursor MCP 启动默认超时（~5-10 秒），被 SIGKILL，看到 `Connection closed`，零 npm 输出。

0.2.1 是一个**无破坏性变更的「初装体验补丁版」**：发布包瘦身 50%+、bin 名加 2 个同义别名、文档明确告知冷启动问题。无运行时行为变化，无 API 变化，0.2.0 用户直接升级即可。

### Fixed

- **`bin` 字段新增 2 个同义别名**，根治「包名 / bin 名不匹配 → npx 找不到可执行文件」的踩坑：
  - `harness-engineering-mcp` → `dist/cli.js`（即 `harness` 的别名，让 `npx harness-engineering-mcp@latest init` 这种凭直觉的写法也能 work）
  - `harness-mcp-server` → `dist/mcp-server.js`（即 `harness-mcp` 的别名，兼容 `@modelcontextprotocol/server-*` 命名习惯，对应 0.2.0 文档里曾经有人猜到的写法）
- 老用户用 `harness` / `harness-mcp` 不受影响。新增别名是**纯向后兼容的添加**。

### Changed

- **发布包瘦身 ~506 KB / -50%+**：`.npmignore` 显式排除 `dist/**/*.map`、`dist/**/*.d.ts.map`。source map 仍由 `tsup.config.ts` 在本地构建时生成（开发调试用），只是不再随 npm 包发布。配合上面的 bin 别名，把新用户的 npx 冷启动从典型 ~20s 砍到 ~10-12s，间接缓解 Cursor MCP 启动超时问题。
- 默认 server name banner / CLI `--version` 从 `0.2.0` 改为 `0.2.1`（同步版本号到 `src/cli/index.ts` 和 `src/mcp/server.ts`）。

### Docs

- **README §1「安装」更新**：展示 4 个 bin 表格（新增 `harness-engineering-mcp` / `harness-mcp-server` 两个别名说明），补一句「不全局安装就用 npx」的双写法提示。
- **README §8「IDE 接入」新增「冷启动可能超时」开篇警告**：解释为什么新机器 npx 首启 5-30s + Cursor MCP 默认超时是 5-10s 的组合会触发 `Connection failed: MCP error -32000: Connection closed`，给出三种解法（终端预热 → 全局安装 → Mac nvm 用户用绝对路径）。
- **修正所有 `npx` 调用写法**（从 0.2.0 的 `[Unreleased]` 整理而来）。由于本包名与 bin 名不同名，原 README / docs 多处 `npx -y harness-engineering-mcp ...` / `npx harness-engineering-mcp ...` 隐式调起示例会报 `could not determine executable to run`。统一改为：
  - 调 CLI：`npx -y -p harness-engineering-mcp@latest harness <subcmd>` 或 0.2.1 起的简写 `npx -y harness-engineering-mcp@latest <subcmd>`
  - 起 MCP server：`npx -y -p harness-engineering-mcp@latest harness-mcp`
- 涉及文件：`README.md`、`docs/M3_CURSOR_INTEGRATION.md`、`docs/M4_MULTI_IDE_INTEGRATION.md`、`docs/IDE_DAILY_USAGE.md`、`docs/PROPOSAL.md`、`docs/releases/v0.2.0.md`。
- `M3` / `M4` / `releases/v0.2.0` 中的 Cursor / Claude Code / Codex CLI 配置示例改为「npx 推荐 + 全局安装最简写法 + 本地源码联调备选」三段式。

### Deferred — 推到 0.3.0

> 0.2.1 本来还想做 **assets 网络化懒加载**（把 1.4 MB 的 skills / spec / templates 移出 npm 包，运行时从 GitHub raw 按需拉取 + 本地缓存）。但在评估后认定它**不适合作为 patch 版做**：
>
> 1. **引入网络依赖**：用户首次 `harness_load_skill` 时如果断网 / 内网墙 / GitHub 被屏蔽 → 直接失败。当前的本地 bundle 是离线 100% 可用。
> 2. **缓存失效语义复杂**：assets 版本要不要绑包版本？老缓存怎么清？npm registry 镜像与 GitHub raw 一致性？这些都是 minor 版才能引入的破坏性折腾。
> 3. **0.2.1 走 patch 的承诺**：只做无破坏性变更，不动构建系统、不动 IO 行为、不动 API。
>
> 0.3.0 将正式做这件事，预计能把发布包砍到 ~150 KB，冷启动 <3 秒。详细方案见即将创建的 `docs/proposals/0.3.0-asset-lazyload.md`。

## 0.2.0 — 2026-05-20

### ⚠️ Breaking Changes

- **目录布局收拢**：所有 harness 自身产物从根 / `docs/` / `scripts/` 三处统一收拢到 `.harness/`。`CHANGELOG.md` 和 `.github/*` 因外部工具约定保留在原位。本次为**硬切换**，没有 fallback。
  - `harness.config.json` → `.harness/config.json`
  - `verification_baseline.json` → `.harness/baseline.json`
  - `docs/engineering-harness.md` → `.harness/engineering-harness.md`
  - `docs/adr/*` → `.harness/adr/*`
  - `docs/features/*` → `.harness/features/*`
  - `engineering-check.{ps1,sh}` → `.harness/scripts/engineering-check.{ps1,sh}`
  - `docs/oncall.md` · `docs/SLO.md` · `docs/DORA.md` · `docs/SBOM.md` · `docs/rfc/*` · `compliance/.gitkeep` → 全部进 `.harness/`
- **`harness_init` 默认行为改为安全保留**：已存在且内容与模板不同的文件不再被默默覆盖，标记为 `action: skipped, reason: kept_existing`。如需强制按模板重生成，显式传 `force: true` / 命令行加 `--force`。

### Added

- **`harness_uninstall`** · 第 7 个 MCP 工具 + 同名 CLI 命令。递归删除 `.harness/`，`CHANGELOG.md` 和 `.github/*` 自动保留并列在 `kept[]`。支持 `--dry-run` / `--keep-root-dir` / `-y`。
- **`harness init --force`** · 显式重新生成开关，配合上面安全保留默认行为使用。
- `src/core/paths.ts` · 路径常量唯一真理源，所有硬编码 `"harness.config.json"` / `"docs/features"` 等裸字符串集中替换为常量。
- `featureDirPath()` / `gateReviewPath()` helper：避免在 `gate-review.ts` 等模块重复拼接 feature 路径。

### Changed

- `src/core/checker/runner.ts` / `src/mcp/tools/init.ts` / `gate-review.ts` / `upgrade.ts` / `loader.ts` / `check.ts` 全部从 `HARNESS_PATHS` 取路径。
- `engineering-harness.md.hbs` / `README.md.hbs` / `0001-...md.hbs` 等模板文本同步更新到 `.harness/*`。
- 27 个 markdown 文档（README / docs/ / assets/spec/ / assets/templates/ / assets/rules/）中的路径引用全部更新。

### Migration Guide

如从 0.1.x 升级，推荐 `git mv` 保留 customizations：

```powershell
git mv harness.config.json     .harness/config.json
git mv verification_baseline.json .harness/baseline.json
git mv docs/engineering-harness.md .harness/engineering-harness.md
git mv docs/adr                .harness/adr
git mv docs/features           .harness/features
mkdir .harness/scripts
git mv engineering-check.ps1   .harness/scripts/
git mv engineering-check.sh    .harness/scripts/
harness check     # 应当立刻全绿
```

如果 mid-team / org 升档过，还需要 `git mv docs/oncall.md .harness/oncall.md` 等。

### Tests

- 69 用例 / 14 测试文件，比 0.1.x 的 61/13 增 8 例 1 个文件：
  - `init.test.ts` 新增 keep 默认 + force 覆盖两条用例
  - `uninstall.test.ts` 6 条用例（not_found / dry_run / 实际清除 / 保留外部约定 / keep_root_dir / 重装）

## [Unreleased — pre-0.2.0 cumulative changes from 0.1.x line]

### Added (docs)
- `docs/IDE_DAILY_USAGE.md` — post-install day-to-day guide for Cursor / Claude Code: 5 real conversation scenarios (onboarding / one-liner / bugfix / mode upgrade / CI), AI opening prompt template, 6-tool natural-language mapping, resource URI cheatsheet, 3-step smoke verification, top efficiency rules, and a troubleshooting matrix.

### Added (post-audit optimizations · batch 1-3)
- Rules now carry an `applies_to: [stack]` frontmatter so `harness://rules/index` returns RuleMeta `{filename, appliesTo}` objects. Java/Spring-only rules (03/04/06/08/13/14/15) are tagged `[java-spring]`; cross-stack rules (02/05/07/09/10/11/12/16) are tagged `[all]`. A new `listRulesForStack(stack)` helper filters rules for non-Java projects.
- `assets/skills/INDEX.md` — full skill decision tree with mermaid, P0/P1/P2 buckets, daily/weekly/monthly frequency, dependency graph; exposed via the new `harness://skills/_decision-tree` URI.
- `assets/spec/PRIORITY_HIERARCHY.md` — meta-rule that defines L0→L4 precedence (compliance → rules → spec → skill → local), conflict resolution flow, and the project-level override path. Auto-discovered as `harness://spec/file/PRIORITY_HIERARCHY.md`.
- High-frequency skills (`brainstorming`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `dev-flow`, `bugfix-flow`, `refactor-flow`, `perf-flow`, `ai-efficiency`) gained complete frontmatter: `version` / `applies_to` / `priority` (P0/P1) / `usage_frequency` (daily/weekly) / `depends_on` / `related`, plus an end-of-file `## 反例` section calling out top anti-patterns.
- `dev-flow` SKILL.md now embeds a mermaid decision tree mirroring the `harness_route_task` routing logic.
- `test/e2e-full-flow.test.ts` — cross-tool integration test that exercises init → route → load_skill → check → gate_review → upgrade_mode → check in a single tmp project to lock the M0→M4 chain.
- Post-audit batch 4-6: skill section-filtering via `harness_load_skill { sections }`, three new checker runners (`.gitignore` integrity / `quality.coverage` baseline gate / `quality.pr_size`), `feature_completeness` runner, router intent expansion (docs/brainstorm/non-feature), gate-review BLOCKER detection hardening, project-aware efficiency_hints.

### Added
- `harness_check`: `run_tests` flag that actually spawns `mvn test` / `npm test` / `pytest` and reports exit code via the new `tests.exec` check id. CLI gains `--run-tests` and `--test-timeout-ms`.
- `harness_route_task`: `modifiers` field tagging the task with `M1`–`M5` (design / UI / auth / DB / integration), plus a new `efficiency_hints` field that returns 3-6 actionable token-saving / LLM-efficiency tips derived from `assets/spec/AI_EFFICIENCY.md`.
- New first-class AI efficiency surface:
  - `assets/spec/AI_EFFICIENCY.md` (6 core rules + three-layer cache strategy + 6 KPI metrics)
  - `assets/skills/ai-efficiency/SKILL.md` (6-phase actionable checklist: entry triage → search → read → modify → verify → output → mode-switch)
  - `assets/rules/16-ai-efficiency.mdc` (10 non-negotiable hard rules for Cursor / Claude Code)
- `harness_gate_review`: now renders the full 8-dimension Gate Review template bundled in `assets/templates/features/_template/03_GATE_REVIEW.md`, parses both BLOCKER bullets and the `B-N` table, and only reports `passed` when the 通过 box is explicitly checked.
- `harness_upgrade_mode`: actually creates increment files per tier (CHANGELOG / PR template for small-team; CODEOWNERS / on-call / SLO for mid-team; DORA / RFC / SBOM / compliance for org). Pre-existing files are kept and reported as `skipped`.
- Docs: `M2_PS1_COMPATIBILITY.md`, `M3_CURSOR_INTEGRATION.md`, `M4_MULTI_IDE_INTEGRATION.md`, `USAGE.md` covering ps1 equivalence, Cursor URI test plan, Cursor / Claude Code / Codex CLI matrix + npm publish flow, and 5 end-to-end scenarios.

### Tests
- 58 cases across 12 files; new suites: `check-exec.test.ts` (4) spawns real node test subprocesses, `check-ps1-compat.test.ts` (3) snapshots the canonical `check_id` namespace, `resources.test.ts` (19) covers all 4 resource providers including the new AI efficiency spec / skill / rule URIs, `gate-review.test.ts` (5) and `upgrade.test.ts` (5) lock the new template / increment behaviours; `router.test.ts` (6) now also asserts the `efficiency_hints` heuristics.

## 0.1.0

- Initial MCP server + CLI skeleton.
- Six MCP tools: `harness_init`, `harness_check`, `harness_route_task`, `harness_load_skill`, `harness_gate_review`, `harness_upgrade_mode`.
- Engineering Harness spec, rules, skills, stack adapters, templates imported from the reference project.
