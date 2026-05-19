import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
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
});
