import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
          ".harness/config.json",
          ".harness/baseline.json",
          ".harness/scripts/engineering-check.ps1",
          ".harness/scripts/engineering-check.sh",
          ".harness/engineering-harness.md",
          ".harness/adr/0001-engineering-harness-baseline.md",
          ".harness/features/INDEX.md",
          ".harness/features/_template/01_REQUIREMENT_ANALYSIS.md",
          ".github/pull_request_template.md",
        ]),
      );

      const config = JSON.parse(readFileSync(join(cwd, ".harness/config.json"), "utf-8")) as {
        $schema?: string;
        project: { maturity_target?: string };
        modules: { security?: { compliance?: string[] } };
      };
      expect(config.$schema).toBe("harness://config/schema");
      expect(config.project.maturity_target).toBe("L2");
      expect(config.modules.security?.compliance).toEqual(["pipl"]);
      expect(readFileSync(join(cwd, ".harness/engineering-harness.md"), "utf-8")).toContain(
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
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(false);
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

  it("keeps user-customized files by default (no overwrite without force)", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-init-keep-"));
    try {
      const init = registerInitTool();
      const input = {
        cwd,
        mode: "solo" as const,
        stack: "node-typescript" as const,
        project_type: "library" as const,
        project_name: "keep-project",
      };
      await init.handler(input, { toolName: "harness_init", cwd, startedAt: Date.now() });

      const customIndex = "# 我的真实任务索引\n\n- T-001 加状态筛选 · in-progress\n";
      writeFileSync(join(cwd, ".harness/features/INDEX.md"), customIndex, "utf-8");

      const second = await init.handler(input, { toolName: "harness_init", cwd, startedAt: Date.now() });
      const indexEntry = second.generated_files.find((f) => f.path === ".harness/features/INDEX.md");
      expect(indexEntry?.action).toBe("skipped");
      expect(indexEntry?.reason).toBe("kept_existing");
      expect(readFileSync(join(cwd, ".harness/features/INDEX.md"), "utf-8")).toBe(customIndex);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("overwrites customized files when force=true is set", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-init-force-"));
    try {
      const init = registerInitTool();
      const input = {
        cwd,
        mode: "solo" as const,
        stack: "node-typescript" as const,
        project_type: "library" as const,
        project_name: "force-project",
      };
      await init.handler(input, { toolName: "harness_init", cwd, startedAt: Date.now() });

      const customIndex = "# 我会被覆盖\n";
      writeFileSync(join(cwd, ".harness/features/INDEX.md"), customIndex, "utf-8");

      const second = await init.handler(
        { ...input, force: true },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );
      const indexEntry = second.generated_files.find((f) => f.path === ".harness/features/INDEX.md");
      expect(indexEntry?.action).toBe("updated");
      const restored = readFileSync(join(cwd, ".harness/features/INDEX.md"), "utf-8");
      expect(restored).not.toBe(customIndex);
      expect(restored).toContain("Features Index");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
