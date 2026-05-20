import type { Command } from "commander";
import prompts from "prompts";
import pc from "picocolors";
import { registerUninstallTool } from "../../mcp/tools/uninstall.js";

export function registerUninstallCommand(program: Command): void {
  program
    .command("uninstall")
    .description(
      "Remove all Engineering Harness artifacts from the project (delete .harness/). CHANGELOG.md and .github/* are preserved.",
    )
    .option("-C, --cwd <path>", "project root", process.cwd())
    .option(
      "--dry-run",
      "preview which files would be deleted without actually removing them",
      false,
    )
    .option(
      "--keep-root-dir",
      "empty .harness/ contents but keep the directory itself (useful for git tracking)",
      false,
    )
    .option("-y, --yes", "skip the confirmation prompt", false)
    .action(async (options: Record<string, string | boolean>) => {
      const cwd = String(options.cwd);
      const dryRun = Boolean(options.dryRun);
      const skipConfirm = Boolean(options.yes);

      if (!dryRun && !skipConfirm) {
        console.log(
          pc.yellow(
            `即将清除 ${cwd} 下的 .harness/ 目录。CHANGELOG.md / .github/* 保留不动。`,
          ),
        );
        const { confirm } = (await prompts({
          type: "confirm",
          name: "confirm",
          message: "确认继续吗？",
          initial: false,
        })) as { confirm?: boolean };
        if (!confirm) {
          console.log(pc.cyan("已取消，未做任何修改。"));
          return;
        }
      }

      const tool = registerUninstallTool();
      const result = await tool.handler(
        { cwd, dry_run: dryRun, keep_root_dir: Boolean(options.keepRootDir) },
        { toolName: "harness_uninstall", cwd, startedAt: Date.now() },
      );

      const tag =
        result.status === "completed"
          ? pc.green("[uninstall: completed]")
          : result.status === "dry_run"
            ? pc.cyan("[uninstall: dry-run]")
            : pc.yellow("[uninstall: not-found]");
      console.log(tag);

      for (const path of result.removed) {
        const prefix = result.status === "dry_run" ? "  - would remove " : "  - removed ";
        console.log(prefix + path);
      }
      if (result.kept.length > 0) {
        console.log(pc.dim("保留（外部约定，不在 uninstall 范围）：" + result.kept.join(", ")));
      }
      if (result.next_steps.length > 0) {
        console.log(pc.bold("Next steps:"));
        for (const s of result.next_steps) console.log("- " + s);
      }
    });
}
