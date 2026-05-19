# Harness Engineering MCP

Engineering Harness as an MCP server + CLI.

It packages reusable engineering governance into one installable tool for AI coding environments such as Cursor, Claude Code, and Codex:

- **MCP tools**: `harness_init`, `harness_check`, `harness_route_task`, `harness_load_skill`, `harness_gate_review`, `harness_upgrade_mode`
- **MCP resources**: `harness://spec/*`, `harness://skills/*`, `harness://rules/*`, `harness://templates/*`
- **CLI**: `harness init`, `harness check`, `harness route`, `harness upgrade`, `harness mcp`

## Install

```bash
npm install -g harness-engineering-mcp
```

Or run without installing:

```bash
npx harness-engineering-mcp init
```

## MCP Configuration

Cursor example:

```json
{
  "mcpServers": {
    "harness-engineering": {
      "command": "harness-mcp"
    }
  }
}
```

## Quick Start

```bash
harness init
harness check
harness route "列表加一个状态筛选"
```

## Design

See `docs/PROPOSAL.md`.

## IDE Integration

- Cursor: see `docs/M3_CURSOR_INTEGRATION.md` for the verified MCP wiring and per-URI manual test plan.
- Claude Code / Codex CLI: see `docs/M4_MULTI_IDE_INTEGRATION.md` for the compatibility matrix and minimal repro scripts.

## PS1 Compatibility

`harness check` is a cross-platform port of `engineering-check.ps1`. The
PASS/WARN/FAIL token set and `check_id` namespace are stable; see
`docs/M2_PS1_COMPATIBILITY.md` for the equivalence table and the
`--run-tests` flag that turns the static checker into a real test runner.

## Release

See `docs/M4_MULTI_IDE_INTEGRATION.md` §6 for the `v0.1.0` npm publish
checklist and post-publish smoke steps. The actual `npm publish` command
must be executed by an authenticated maintainer.
