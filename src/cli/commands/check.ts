import type { Command } from "commander";
import pc from "picocolors";
import { runChecks } from "../../core/checker/runner.js";

export function registerCheckCommand(program: Command): void {
  program
    .command("check")
    .description("Run Engineering Harness checks for the current project")
    .option("-C, --cwd <path>", "project root", process.cwd())
    .option(
      "--categories <list>",
      "comma-separated categories: config,structure,tests,secrets,baseline,docs,all",
      "all",
    )
    .option("--strict", "treat WARN as FAIL", false)
    .option("--json", "print JSON output", false)
    .action(async (options: { cwd: string; categories: string; strict: boolean; json: boolean }) => {
      const result = await runChecks({
        cwd: options.cwd,
        categories: options.categories.split(",").map((s) => s.trim()) as Array<
          "config" | "structure" | "tests" | "secrets" | "baseline" | "docs" | "all"
        >,
        strict: options.strict,
        output_format: options.json ? "json" : "summary",
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const color =
          result.status === "PASS" ? pc.green : result.status === "WARN" ? pc.yellow : pc.red;
        console.log(color(`Harness Check: ${result.status}`));
        console.log(
          `PASS ${result.summary.pass} · WARN ${result.summary.warn} · FAIL ${result.summary.fail} · ${result.elapsed_ms}ms`,
        );
        for (const r of result.results) {
          const marker =
            r.status === "PASS" ? pc.green("PASS") : r.status === "WARN" ? pc.yellow("WARN") : pc.red("FAIL");
          console.log(`${marker} ${r.check_id}: ${r.message}`);
        }
      }

      if (result.status === "FAIL") process.exitCode = 1;
    });
}
