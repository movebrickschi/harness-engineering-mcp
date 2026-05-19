import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerInitTool } from "../src/mcp/tools/init.js";

describe("harness_init", () => {
  it("renders the M2 project harness from bundled templates", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-init-"));
    try {
      const init = registerInitTool();
      const result = await init.handler(
        {
          cwd,
          mode: "small-team",
          stack: "node-typescript",
          project_type: "library",
          project_name: "demo-lib",
          maturity_target: "L2",
          compliance: ["pipl"],
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      expect(result.status).toBe("completed");
      expect(result.generated_files.map((f) => f.path)).toEqual(
        expect.arrayContaining([
          "harness.config.json",
          "verification_baseline.json",
          "engineering-check.ps1",
          "engineering-check.sh",
          "docs/engineering-harness.md",
          "docs/adr/0001-engineering-harness-baseline.md",
          "docs/features/INDEX.md",
          "docs/features/_template/01_REQUIREMENT_ANALYSIS.md",
          ".github/pull_request_template.md",
        ]),
      );

      const config = JSON.parse(readFileSync(join(cwd, "harness.config.json"), "utf-8")) as {
        $schema?: string;
        project: { maturity_target?: string };
        modules: { security?: { compliance?: string[] } };
      };
      expect(config.$schema).toBe("harness://config/schema");
      expect(config.project.maturity_target).toBe("L2");
      expect(config.modules.security?.compliance).toEqual(["pipl"]);
      expect(readFileSync(join(cwd, "docs/engineering-harness.md"), "utf-8")).toContain(
        "Mode: `small-team`",
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("does not write files in dry-run mode", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-init-dry-"));
    try {
      const init = registerInitTool();
      const result = await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "python",
          project_type: "library",
          project_name: "dry-project",
          dry_run: true,
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      expect(result.status).toBe("dry_run");
      expect(result.generated_files.every((f) => f.action === "skipped")).toBe(true);
      expect(existsSync(join(cwd, "harness.config.json"))).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("skips unchanged generated files on repeated init", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-init-repeat-"));
    try {
      const init = registerInitTool();
      const input = {
        cwd,
        mode: "solo" as const,
        stack: "node-typescript" as const,
        project_type: "cli" as const,
        project_name: "repeat-project",
      };

      await init.handler(input, { toolName: "harness_init", cwd, startedAt: Date.now() });
      const second = await init.handler(input, { toolName: "harness_init", cwd, startedAt: Date.now() });

      expect(second.generated_files.every((f) => f.action === "skipped")).toBe(true);
      expect(second.generated_files.map((f) => f.reason)).toContain("unchanged");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
