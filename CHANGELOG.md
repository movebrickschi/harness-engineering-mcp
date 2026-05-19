# Changelog

## [Unreleased]

### Added
- `harness_check`: `run_tests` flag that actually spawns `mvn test` / `npm test` / `pytest` and reports exit code via the new `tests.exec` check id. CLI gains `--run-tests` and `--test-timeout-ms`.
- `harness_route_task`: `modifiers` field tagging the task with `M1`–`M5` (design / UI / auth / DB / integration).
- `harness_gate_review`: now renders the full 8-dimension Gate Review template bundled in `assets/templates/features/_template/03_GATE_REVIEW.md`, parses both BLOCKER bullets and the `B-N` table, and only reports `passed` when the 通过 box is explicitly checked.
- `harness_upgrade_mode`: actually creates increment files per tier (CHANGELOG / PR template for small-team; CODEOWNERS / on-call / SLO for mid-team; DORA / RFC / SBOM / compliance for org). Pre-existing files are kept and reported as `skipped`.
- Docs: `M2_PS1_COMPATIBILITY.md`, `M3_CURSOR_INTEGRATION.md`, `M4_MULTI_IDE_INTEGRATION.md` covering ps1 equivalence, Cursor URI test plan, and Cursor / Claude Code / Codex CLI matrix + npm publish flow.

### Tests
- 57 cases across 12 files; new suites: `check-exec.test.ts` (4) spawns real node test subprocesses, `check-ps1-compat.test.ts` (3) snapshots the canonical `check_id` namespace, `resources.test.ts` (19) covers all 4 resource providers, `gate-review.test.ts` (5) and `upgrade.test.ts` (5) lock the new template / increment behaviours.

## 0.1.0

- Initial MCP server + CLI skeleton.
- Six MCP tools: `harness_init`, `harness_check`, `harness_route_task`, `harness_load_skill`, `harness_gate_review`, `harness_upgrade_mode`.
- Engineering Harness spec, rules, skills, stack adapters, templates imported from the reference project.
