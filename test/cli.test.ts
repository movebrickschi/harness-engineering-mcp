import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli/index.js";

describe("CLI M2 wrappers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("runs init and check through the CLI", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "harness-cli-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await runCli([
        "node",
        "harness",
        "init",
        "-C",
        cwd,
        "--mode",
        "solo",
        "--stack",
        "node-typescript",
        "--type",
        "library",
        "--name",
        "cli-project",
      ]);
      expect(existsSync(join(cwd, ".harness/config.json"))).toBe(true);

      await runCli(["node", "harness", "check", "-C", cwd, "--json"]);
      const output = log.mock.calls.map((call) => String(call[0])).join("\n");
      expect(output).toContain('"status": "WARN"');
      expect(process.exitCode).toBeUndefined();
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
