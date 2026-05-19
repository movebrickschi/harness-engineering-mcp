# Changelog

## [Unreleased]

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
