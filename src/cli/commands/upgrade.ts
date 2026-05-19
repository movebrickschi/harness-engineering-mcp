import type { Command } from "commander";
import pc from "picocolors";
import { registerUpgradeTool } from "../../mcp/tools/upgrade.js";
import type { HarnessMode } from "../../types/harness.js";

export function registerUpgradeCommand(program: Command): void {
  program
    .command("upgrade")
    .description("Upgrade Harness mode (solo -> small-team -> mid-team -> org)")
    .requiredOption("--to <mode>", "target mode")
    .option("-C, --cwd <path>", "project root", process.cwd())
    .option("--from <mode>", "current mode")
    .action(async (options: { cwd: string; from?: HarnessMode; to: HarnessMode }) => {
      const tool = registerUpgradeTool();
      const result = await tool.handler(
        { cwd: options.cwd, from: options.from, to: options.to },
        { toolName: "harness_upgrade_mode", cwd: options.cwd, startedAt: Date.now() },
      );

      console.log(pc.green(`Upgraded ${result.from} -> ${result.to}`));
      for (const f of result.generated_files) {
        console.log(`- ${f.action} ${f.path} (${f.bytes} bytes)`);
      }
      console.log(pc.bold("Next steps:"));
      for (const step of result.next_steps) console.log(`- ${step}`);
    });
}
