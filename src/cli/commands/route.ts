import type { Command } from "commander";
import { routeTask } from "../../core/router/index.js";

export function registerRouteCommand(program: Command): void {
  program
    .command("route <task>")
    .description("Route a task description to a Harness skill workflow")
    .option("-C, --cwd <path>", "project root", process.cwd())
    .option("--scope <scope>", "frontend | backend | full-stack")
    .option("--prd", "task has a PRD", false)
    .option("--prototype", "task has a runnable prototype project", false)
    .action(
      async (
        task: string,
        options: {
          cwd: string;
          scope?: "frontend" | "backend" | "full-stack";
          prd: boolean;
          prototype: boolean;
        },
      ) => {
        const result = await routeTask({
          task,
          cwd: options.cwd,
          context: {
            scope: options.scope,
            has_prd: options.prd,
            has_prototype: options.prototype,
          },
        });
        console.log(JSON.stringify(result, null, 2));
      },
    );
}
