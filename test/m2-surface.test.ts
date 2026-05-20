import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAsset, listAssetDirectory, listAssetSkills } from "../src/core/assets.js";
import { defaultConfigForMode, loadHarnessConfig } from "../src/core/config/loader.js";
import { renderTemplate } from "../src/core/renderer/handlebars.js";
import { registerCheckTool } from "../src/mcp/tools/check.js";
import { registerInitTool } from "../src/mcp/tools/init.js";

describe("M2 support surface", () => {
  it("loads bundled templates and renders handlebars helpers", async () => {
    expect(await readAsset("templates/entry/engineering-harness.md.hbs")).toContain(
      "{{project_name}}",
    );
    expect(listAssetDirectory("templates/entry")).toContain("engineering-check.sh.hbs");
    expect(listAssetSkills().some((skill) => skill.name === "dev-flow")).toBe(true);
    expect(renderTemplate("{{upper name}} {{json meta}}", { name: "m2", meta: { ok: true } })).toContain(
      "M2",
    );
  });

  it("builds mode-specific configs and loads valid project config", () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-config-"));
    try {
      const org = defaultConfigForMode("org", {
        name: "org-project",
        type: "backend-service",
        stack: "java-spring",
        mode: "org",
      });
      expect(org.dora?.track).toBe(true);
      expect(org.modules.security?.audit_log_required).toBe(true);

      mkdirSync(join(cwd, ".harness"), { recursive: true });
      writeFileSync(join(cwd, ".harness/config.json"), JSON.stringify(org));
      expect(loadHarnessConfig(cwd)?.project.name).toBe("org-project");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("exposes init and check through MCP tool definitions", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-mcp-tools-"));
    try {
      mkdirSync(join(cwd, "test"));
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({ name: "surface", scripts: { test: "vitest run" } }),
      );

      const init = registerInitTool();
      const check = registerCheckTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "surface",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await check.handler(
        { cwd, categories: ["tests"] },
        { toolName: "harness_check", cwd, startedAt: Date.now() },
      );
      expect(result.status).toBe("PASS");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
