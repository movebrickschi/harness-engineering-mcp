import type { Command } from "commander";
import prompts from "prompts";
import pc from "picocolors";
import { registerInitTool } from "../../mcp/tools/init.js";
import type { InitToolInput } from "../../types/harness.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Engineering Harness in a project")
    .option("-C, --cwd <path>", "project root", process.cwd())
    .option("--mode <mode>", "solo | small-team | mid-team | org")
    .option("--stack <stack>", "java-spring | node-typescript | python | go | other")
    .option("--type <type>", "backend-service | library | cli | frontend-spa")
    .option("--name <name>", "project name")
    .option("--dry-run", "show generated files without writing", false)
    .action(async (options: Record<string, string | boolean>) => {
      const tool = registerInitTool();
      let input: InitToolInput = {
        cwd: String(options.cwd),
        mode: options.mode as InitToolInput["mode"],
        stack: options.stack as InitToolInput["stack"],
        project_type: options.type as InitToolInput["project_type"],
        project_name: options.name as string | undefined,
        dry_run: Boolean(options.dryRun),
      };

      let result = await tool.handler(input, {
        toolName: "harness_init",
        cwd: input.cwd,
        startedAt: Date.now(),
      });

      if (result.status === "needs_input") {
        console.log(pc.cyan("Detected project signals:"));
        for (const e of result.detected.evidence) {
          console.log(`- ${e.source}: ${e.signal} (+${e.weight})`);
        }

        const answers = await prompts(
          result.ask_user.map((q) => ({
            name: q.field,
            type: q.options ? "select" : "text",
            message: q.question,
            choices: q.options?.map((o) => ({ title: o, value: o })),
            initial: q.default,
          })),
        );

        input = { ...input, ...answers } as InitToolInput;
        result = await tool.handler(input, {
          toolName: "harness_init",
          cwd: input.cwd,
          startedAt: Date.now(),
        });
      }

      console.log(pc.green(`harness_init: ${result.status}`));
      for (const f of result.generated_files) {
        console.log(`- ${f.action} ${f.path} (${f.bytes} bytes)`);
      }
      if (result.next_steps.length > 0) {
        console.log(pc.bold("Next steps:"));
        for (const step of result.next_steps) console.log(`- ${step}`);
      }
    });
}
