import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerCheckTool } from "../src/mcp/tools/check.js";
import { registerGateReviewTool } from "../src/mcp/tools/gate-review.js";
import { registerInitTool } from "../src/mcp/tools/init.js";
import { registerLoadSkillTool } from "../src/mcp/tools/load-skill.js";
import { registerRouteTool } from "../src/mcp/tools/route.js";
import { registerUpgradeTool } from "../src/mcp/tools/upgrade.js";

const ctx = (cwd: string, toolName: string) => ({ toolName, cwd, startedAt: Date.now() });

/**
 * Cross-tool integration test — exercises the full M0→M4 chain end to end:
 *   init → route → load_skill → check → gate_review → upgrade_mode → check (strict)
 * to make sure tools compose without state corruption.
 */
describe("E2E · full harness lifecycle", () => {
  it("init → route → load_skill → check → gate_review → upgrade → strict check", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-e2e-"));
    try {
      // Step 1: bootstrap node-typescript project bits init relies on
      mkdirSync(join(cwd, "test"));
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({ name: "e2e-fixture", scripts: { test: "node -e \"process.exit(0)\"" } }),
      );
      writeFileSync(join(cwd, "test/sanity.test.ts"), "// placeholder\n");

      // Step 2: harness_init
      const initTool = registerInitTool();
      const initResult = await initTool.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "e2e-fixture",
        },
        ctx(cwd, "harness_init"),
      );
      expect(initResult.status).toBe("completed");
      expect(existsSync(join(cwd, "harness.config.json"))).toBe(true);
      expect(existsSync(join(cwd, "docs/engineering-harness.md"))).toBe(true);

      // Step 3: harness_route_task
      const routeTool = registerRouteTool();
      const routeResult = await routeTool.handler(
        { task: "列表加一个状态筛选" },
        ctx(cwd, "harness_route_task"),
      );
      expect(routeResult.skill).toBe("dev-flow-oneliner-fe");
      expect(routeResult.modifiers).toContain("M2");
      expect(routeResult.efficiency_hints.length).toBeGreaterThanOrEqual(3);

      // Step 4: harness_load_skill
      const loadTool = registerLoadSkillTool();
      const loadResult = await loadTool.handler(
        { name: routeResult.skill },
        ctx(cwd, "harness_load_skill"),
      );
      expect(loadResult.content).toContain("一句话前端需求");

      // Step 5: harness_check (no run_tests; should be WARN/PASS but not FAIL)
      const checkTool = registerCheckTool();
      const checkResult = await checkTool.handler(
        { cwd, categories: ["all"] },
        ctx(cwd, "harness_check"),
      );
      expect(checkResult.status).not.toBe("FAIL");
      const checkIds = checkResult.results.map((r) => r.check_id);
      expect(checkIds).toContain("config.exists");
      expect(checkIds).toContain("docs.readme");

      // Step 6: harness_gate_review (generate)
      const gateTool = registerGateReviewTool();
      const gateGen = await gateTool.handler(
        { cwd, feature_name: "status-filter", action: "generate" },
        ctx(cwd, "harness_gate_review"),
      );
      expect(gateGen.status).toBe("generated");
      expect(gateGen.file_path).toContain("docs/features/status-filter/03_GATE_REVIEW.md");

      // Step 7: gate_review check on the freshly generated file (has 示例 BLOCKER, no 通过)
      const gateCheck = await gateTool.handler(
        { cwd, feature_name: "status-filter", action: "check" },
        ctx(cwd, "harness_gate_review"),
      );
      expect(gateCheck.status).toBe("blocked");

      // Step 8: harness_upgrade_mode (solo → small-team)
      const upgradeTool = registerUpgradeTool();
      const upgradeResult = await upgradeTool.handler(
        { cwd, to: "small-team" },
        ctx(cwd, "harness_upgrade_mode"),
      );
      expect(upgradeResult.from).toBe("solo");
      expect(upgradeResult.to).toBe("small-team");
      const upgradePaths = upgradeResult.generated_files.map((f) => f.path);
      expect(upgradePaths).toContain("CHANGELOG.md");
      expect(existsSync(join(cwd, "CHANGELOG.md"))).toBe(true);

      // Step 9: strict harness_check after upgrade
      const finalCheck = await checkTool.handler(
        { cwd, categories: ["all"], strict: false },
        ctx(cwd, "harness_check"),
      );
      expect(["PASS", "WARN"]).toContain(finalCheck.status);

      // Step 10: confirm harness.config.json now reflects small-team mode
      const cfg = JSON.parse(readFileSync(join(cwd, "harness.config.json"), "utf-8")) as {
        project: { mode: string };
      };
      expect(cfg.project.mode).toBe("small-team");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }, 60_000);
});
