import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../src/core/checker/runner.js";
import { registerInitTool } from "../src/mcp/tools/init.js";

describe("tests.exec runner (real test command)", () => {
  it("is skipped entirely when run_tests is not set", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-exec-skip-"));
    try {
      mkdirSync(join(cwd, "test"));
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({ name: "no-exec", scripts: { test: "node -e \"console.log('ok')\"" } }),
      );

      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "no-exec",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({ cwd, categories: ["tests"] });
      const execResult = result.results.find((r) => r.check_id === "tests.exec");
      expect(execResult).toBeUndefined();
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("PASS when run_tests=true and the spawned npm test exits 0", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-exec-pass-"));
    try {
      mkdirSync(join(cwd, "test"));
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({
          name: "exec-pass",
          scripts: { test: "node -e \"process.exit(0)\"" },
        }),
      );

      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "exec-pass",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({
        cwd,
        categories: ["tests"],
        run_tests: true,
        test_timeout_ms: 60_000,
      });
      const execResult = result.results.find((r) => r.check_id === "tests.exec");
      expect(execResult?.status).toBe("PASS");
      expect(execResult?.message).toContain("exit=0");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }, 90_000);

  it("FAIL when run_tests=true and the spawned npm test exits non-zero", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-exec-fail-"));
    try {
      mkdirSync(join(cwd, "test"));
      writeFileSync(
        join(cwd, "package.json"),
        JSON.stringify({
          name: "exec-fail",
          scripts: { test: "node -e \"console.error('boom'); process.exit(2)\"" },
        }),
      );

      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "node-typescript",
          project_type: "library",
          project_name: "exec-fail",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({
        cwd,
        categories: ["tests"],
        run_tests: true,
        test_timeout_ms: 60_000,
      });
      const execResult = result.results.find((r) => r.check_id === "tests.exec");
      expect(execResult?.status).toBe("FAIL");
      expect(execResult?.message).toMatch(/exit=2/);
      expect(result.status).toBe("FAIL");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }, 90_000);

  it("WARN when run_tests=true but no runner is available for the stack", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-exec-warn-"));
    try {
      const init = registerInitTool();
      await init.handler(
        {
          cwd,
          mode: "solo",
          stack: "other",
          project_type: "library",
          project_name: "no-runner",
        },
        { toolName: "harness_init", cwd, startedAt: Date.now() },
      );

      const result = await runChecks({
        cwd,
        categories: ["tests"],
        run_tests: true,
      });
      const execResult = result.results.find((r) => r.check_id === "tests.exec");
      expect(execResult?.status).toBe("WARN");
      expect(execResult?.message).toContain("无法为 stack");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
