import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { registerInitTool } from "../src/mcp/tools/init.js";
import { registerUninstallTool } from "../src/mcp/tools/uninstall.js";

const ctx = (cwd: string) => ({ toolName: "harness_uninstall", cwd, startedAt: Date.now() });

async function bootstrap(cwd: string): Promise<void> {
  const init = registerInitTool();
  await init.handler(
    {
      cwd,
      mode: "solo",
      stack: "node-typescript",
      project_type: "library",
      project_name: "uninstall-fixture",
    },
    { toolName: "harness_init", cwd, startedAt: Date.now() },
  );
}

function writeAt(cwd: string, rel: string, body: string): void {
  const abs = join(cwd, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf-8");
}

describe("harness_uninstall", () => {
  it("returns not_found when .harness/ does not exist", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-missing-"));
    try {
      const tool = registerUninstallTool();
      const result = await tool.handler({ cwd }, ctx(cwd));
      expect(result.status).toBe("not_found");
      expect(result.removed).toEqual([]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("dry_run reports what would be deleted without writing", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-dry-"));
    try {
      await bootstrap(cwd);
      const tool = registerUninstallTool();
      const result = await tool.handler({ cwd, dry_run: true }, ctx(cwd));
      expect(result.status).toBe("dry_run");
      expect(result.removed.length).toBeGreaterThan(5);
      expect(result.removed).toContain(".harness");
      expect(result.removed).toContain(".harness/config.json");
      // dry_run 必须不动盘
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("removes the entire .harness/ directory tree", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-real-"));
    try {
      await bootstrap(cwd);
      writeAt(cwd, ".harness/features/order-create/01_REQUIREMENT_ANALYSIS.md", "# feature\n");
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(true);
      expect(existsSync(join(cwd, ".harness/features/order-create/01_REQUIREMENT_ANALYSIS.md"))).toBe(true);

      const tool = registerUninstallTool();
      const result = await tool.handler({ cwd }, ctx(cwd));

      expect(result.status).toBe("completed");
      expect(existsSync(join(cwd, ".harness"))).toBe(false);
      // .harness 自身 + 一堆嵌套文件都进 removed
      expect(result.removed).toContain(".harness");
      expect(result.removed).toContain(".harness/config.json");
      expect(result.removed).toContain(
        ".harness/features/order-create/01_REQUIREMENT_ANALYSIS.md",
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("preserves CHANGELOG.md and .github/* as external conventions", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-keep-ext-"));
    try {
      await bootstrap(cwd);
      writeAt(cwd, "CHANGELOG.md", "# Changelog\n\n- baseline\n");
      writeAt(cwd, ".github/CODEOWNERS", "* @me\n");

      const tool = registerUninstallTool();
      const result = await tool.handler({ cwd }, ctx(cwd));

      expect(result.status).toBe("completed");
      expect(result.kept).toContain("CHANGELOG.md");
      expect(result.kept).toContain(".github/CODEOWNERS");
      // CHANGELOG / .github 必须留着
      expect(readFileSync(join(cwd, "CHANGELOG.md"), "utf-8")).toContain("baseline");
      expect(existsSync(join(cwd, ".github/CODEOWNERS"))).toBe(true);
      // .harness 必须没了
      expect(existsSync(join(cwd, ".harness"))).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("keep_root_dir empties contents but preserves .harness/ directory itself", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-keep-root-"));
    try {
      await bootstrap(cwd);
      const tool = registerUninstallTool();
      const result = await tool.handler({ cwd, keep_root_dir: true }, ctx(cwd));

      expect(result.status).toBe("completed");
      expect(existsSync(join(cwd, ".harness"))).toBe(true);
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(false);
      expect(existsSync(join(cwd, ".harness/features"))).toBe(false);
      // 不应把 .harness 自身写进 removed（keep_root_dir=true）
      expect(result.removed).not.toContain(".harness");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("can re-init after uninstall (full lifecycle)", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-uninstall-reinit-"));
    try {
      await bootstrap(cwd);
      const uninstall = registerUninstallTool();
      await uninstall.handler({ cwd }, ctx(cwd));
      expect(existsSync(join(cwd, ".harness"))).toBe(false);

      // uninstall 之后 init 应能从零开始重新生成
      await bootstrap(cwd);
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(true);
      expect(existsSync(join(cwd, ".harness/features/INDEX.md"))).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
