# Changelog

## [Unreleased]

（暂无）

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
