import { Command } from "commander";
import pc from "picocolors";
import { registerInitCommand } from "./commands/init.js";
import { registerCheckCommand } from "./commands/check.js";
import { registerUpgradeCommand } from "./commands/upgrade.js";
import { registerListCommand } from "./commands/list.js";
import { registerMcpCommand } from "./commands/mcp.js";
import { registerRouteCommand } from "./commands/route.js";
import { registerUninstallCommand } from "./commands/uninstall.js";

const VERSION = "0.2.1";

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();
  program
    .name("harness")
    .description(
      `${pc.bold("Engineering Harness")} — MCP server + CLI for AI-driven engineering governance.\n` +
        `Built for Cursor / Claude Code / Codex.`,
    )
    .version(VERSION);

  registerInitCommand(program);
  registerCheckCommand(program);
  registerUpgradeCommand(program);
  registerListCommand(program);
  registerMcpCommand(program);
  registerRouteCommand(program);
  registerUninstallCommand(program);

  await program.parseAsync(argv);
}

if (process.argv[1] && /(?:^|[\\/])(?:cli\.js|index\.ts)$/.test(process.argv[1])) {
  runCli().catch((err: unknown) => {
    console.error(pc.red(`harness failed: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  });
}
