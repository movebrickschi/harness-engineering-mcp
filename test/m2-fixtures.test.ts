import { describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { registerInitTool } from "../src/mcp/tools/init.js";
import { runChecks } from "../src/core/checker/runner.js";

const fixtureRoot = resolve(process.cwd(), "test/fixtures");

describe("M2 fixture onboarding", () => {
  for (const fixture of ["java-spring", "node-typescript", "python"] as const) {
    it(`runs init and check for ${fixture}`, async () => {
      const cwd = mkdtempSync(join(tmpdir(), `harness-${fixture}-`));
      try {
        cpSync(resolve(fixtureRoot, fixture), cwd, { recursive: true });

        const init = registerInitTool();
        const initResult = await init.handler(
          { cwd, mode: "solo" },
          { toolName: "harness_init", cwd, startedAt: Date.now() },
        );
        expect(initResult.status).toBe("completed");
        expect(initResult.detected.stack).toBe(fixture);

        const check = await runChecks({ cwd, categories: ["all"] });
        expect(check.status).not.toBe("FAIL");
        expect(check.results.map((r) => r.status)).toEqual(expect.arrayContaining(["PASS"]));
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    });
  }
});
