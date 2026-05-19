import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../src/core/checker/runner.js";
import { registerInitTool } from "../src/mcp/tools/init.js";

/**
 * PS1 → harness check compatibility surface.
 *
 * The original engineering-check.ps1 emitted PASS/WARN/FAIL lines per check id.
 * The TS port preserves the same id space so downstream parsers (CI / docs)
 * can read both interchangeably. This file snapshots that id space so any
 * future drift surfaces as an explicit test failure.
 */
const PS1_COMPAT_CHECK_IDS = [
  "config.exists",
  "config.valid",
  "structure.ssot",
  "structure.adr",
  "structure.features",
  "secrets.envfile",
  "tests.directory",
  "tests.command",
  "baseline.exists",
  "baseline.valid",
  "docs.readme",
] as const;

const PS1_STATUS_TOKENS = new Set<string>(["PASS", "WARN", "FAIL"]);

describe("PS1 ↔ harness check compatibility", () => {
  it("emits the canonical check_id set in stable order", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-ps1-compat-"));
    try {
      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "ps1-compat",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({ cwd, categories: ["all"] });
      const ids = result.results.map((r) => r.check_id);
      for (const id of PS1_COMPAT_CHECK_IDS) {
        expect(ids).toContain(id);
      }
      const expectedOrder = PS1_COMPAT_CHECK_IDS.filter((id) => ids.includes(id));
      const filtered = ids.filter((id) => (expectedOrder as readonly string[]).includes(id));
      expect(filtered).toEqual(expectedOrder);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("each result uses one of the three ps1 status tokens", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-ps1-status-"));
    try {
      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "ps1-status",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({ cwd, categories: ["all"] });
      for (const r of result.results) {
        expect(PS1_STATUS_TOKENS.has(r.status)).toBe(true);
        expect(r.message.length).toBeGreaterThan(0);
      }
      expect(["PASS", "WARN", "FAIL"]).toContain(result.status);
      expect(result.summary.pass + result.summary.warn + result.summary.fail).toBe(
        result.summary.total,
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("strict mode escalates WARN summary to FAIL just like ps1 -Strict", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-ps1-strict-"));
    try {
      const baseline = await runChecks({ cwd, categories: ["all"] });
      expect(baseline.status).toBe("FAIL");

      const strict = await runChecks({ cwd, categories: ["all"], strict: true });
      expect(strict.status).toBe("FAIL");

      const onlyWarnCategories = await runChecks({
        cwd,
        categories: ["structure", "baseline", "docs"],
      });
      expect(onlyWarnCategories.status).toBe("WARN");

      const onlyWarnStrict = await runChecks({
        cwd,
        categories: ["structure", "baseline", "docs"],
        strict: true,
      });
      expect(onlyWarnStrict.status).toBe("FAIL");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
