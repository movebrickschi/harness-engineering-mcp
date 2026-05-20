import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerInitTool } from "../src/mcp/tools/init.js";
import { runChecks } from "../src/core/checker/runner.js";

describe("runChecks", () => {
  it("passes basic checks after harness_init", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-check-"));
    try {
      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "tmp-project",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({ cwd, categories: ["all"] });
      expect(result.status).not.toBe("FAIL");
      expect(result.summary.pass).toBeGreaterThan(0);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("reports test command and test directory signals", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-check-tests-"));
    try {
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({ scripts: { test: "vitest run" } }, null, 2),
      );
      mkdirSync(join(cwd, "test"));

      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "tested-project",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({ cwd, categories: ["tests"] });

      expect(result.status).toBe("PASS");
      expect(result.results.map((r) => r.check_id)).toEqual(
        expect.arrayContaining(["tests.directory", "tests.command"]),
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("fails invalid verification baselines", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-check-baseline-"));
    try {
      mkdirSync(join(cwd, ".harness"), { recursive: true });
      writeFileSync(join(cwd, ".harness/baseline.json"), "{ invalid");

      const result = await runChecks({ cwd, categories: ["baseline"] });

      expect(result.status).toBe("FAIL");
      expect(result.results.some((r) => r.check_id === "baseline.valid" && r.status === "FAIL")).toBe(
        true,
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
