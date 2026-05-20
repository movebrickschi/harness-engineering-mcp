import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { registerInitTool } from "../src/mcp/tools/init.js";
import { registerUpgradeTool } from "../src/mcp/tools/upgrade.js";

const initCtx = (cwd: string) => ({ toolName: "harness_init", cwd, startedAt: Date.now() });
const upgradeCtx = (cwd: string) => ({ toolName: "harness_upgrade_mode", cwd, startedAt: Date.now() });

async function bootstrap(cwd: string): Promise<void> {
  const init = registerInitTool();
  await init.handler(
    {
      cwd,
      mode: "solo",
      stack: "node-typescript",
      project_type: "library",
      project_name: "upgrade-fixture",
    },
    initCtx(cwd),
  );
}

describe("harness_upgrade_mode", () => {
  it("solo → small-team generates CHANGELOG and PR template", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-upgrade-st-"));
    try {
      await bootstrap(cwd);
      const tool = registerUpgradeTool();
      const result = await tool.handler({ cwd, to: "small-team" }, upgradeCtx(cwd));

      expect(result.from).toBe("solo");
      expect(result.to).toBe("small-team");
      const paths = result.generated_files.map((f) => f.path);
      expect(paths).toContain("CHANGELOG.md");
      const changelog = result.generated_files.find((f) => f.path === "CHANGELOG.md");
      expect(changelog?.action).toBe("created");
      expect(existsSync(join(cwd, "CHANGELOG.md"))).toBe(true);
      expect(readFileSync(join(cwd, "CHANGELOG.md"), "utf-8")).toContain(
        "harness upgrade → small-team",
      );
      // init already provides .github/pull_request_template.md → must be skipped
      const prEntry = result.generated_files.find(
        (f) => f.path === ".github/pull_request_template.md",
      );
      expect(prEntry?.action).toBe("skipped");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("solo → mid-team also generates CODEOWNERS / oncall / SLO", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-upgrade-mt-"));
    try {
      await bootstrap(cwd);
      const tool = registerUpgradeTool();
      const result = await tool.handler({ cwd, to: "mid-team" }, upgradeCtx(cwd));

      const paths = result.generated_files.map((f) => f.path);
      expect(paths).toContain("CHANGELOG.md");
      expect(paths).toContain(".github/pull_request_template.md");
      expect(paths).toContain(".github/CODEOWNERS");
      expect(paths).toContain(".harness/oncall.md");
      expect(paths).toContain(".harness/SLO.md");
      expect(readFileSync(join(cwd, ".github/CODEOWNERS"), "utf-8")).toContain(
        "@platform-team",
      );
      expect(readFileSync(join(cwd, ".harness/SLO.md"), "utf-8")).toMatch(/p95/i);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("solo → org cumulatively generates DORA / RFC / SBOM", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-upgrade-org-"));
    try {
      await bootstrap(cwd);
      const tool = registerUpgradeTool();
      const result = await tool.handler({ cwd, to: "org" }, upgradeCtx(cwd));

      const paths = result.generated_files.map((f) => f.path);
      expect(paths).toContain(".harness/DORA.md");
      expect(paths).toContain(".harness/rfc/0000-template.md");
      expect(paths).toContain(".harness/SBOM.md");
      expect(paths).toContain(".harness/compliance/.gitkeep");
      expect(paths).toContain(".github/CODEOWNERS");

      const dora = readFileSync(join(cwd, ".harness/DORA.md"), "utf-8");
      expect(dora).toMatch(/Deployment frequency/);
      expect(dora).toMatch(/MTTR/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("preserves pre-existing files instead of overwriting", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-upgrade-keep-"));
    try {
      await bootstrap(cwd);
      // Pre-create CHANGELOG with custom content
      const customChangelog = "# my custom changelog\n";
      writeFileMaybe(cwd, "CHANGELOG.md", customChangelog);

      const tool = registerUpgradeTool();
      const result = await tool.handler({ cwd, to: "small-team" }, upgradeCtx(cwd));

      const changelogEntry = result.generated_files.find((f) => f.path === "CHANGELOG.md");
      expect(changelogEntry?.action).toBe("skipped");
      expect(readFileSync(join(cwd, "CHANGELOG.md"), "utf-8")).toBe(customChangelog);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("refuses to downgrade", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-upgrade-down-"));
    try {
      await bootstrap(cwd);
      const tool = registerUpgradeTool();
      await tool.handler({ cwd, to: "mid-team" }, upgradeCtx(cwd));

      await expect(
        tool.handler({ cwd, to: "small-team" }, upgradeCtx(cwd)),
      ).rejects.toThrow(/Cannot downgrade/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

function writeFileMaybe(cwd: string, rel: string, body: string): void {
  mkdirSync(join(cwd, dirname(rel)), { recursive: true });
  writeFileSync(join(cwd, rel), body, "utf-8");
}
