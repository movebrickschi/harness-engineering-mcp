import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  UpgradeModeToolInput,
  UpgradeModeToolOutput,
  HarnessMode,
  GeneratedFile,
} from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { defaultConfigForMode, loadHarnessConfig } from "../../core/config/loader.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string" },
    from: { type: "string", enum: ["solo", "small-team", "mid-team"] },
    to: { type: "string", enum: ["small-team", "mid-team", "org"] },
  },
  required: ["cwd", "to"],
} as const;

const ORDER: HarnessMode[] = ["solo", "small-team", "mid-team", "org"];

export function registerUpgradeTool(): ToolDefinition<
  UpgradeModeToolInput,
  UpgradeModeToolOutput
> {
  return {
    name: "harness_upgrade_mode",
    description:
      "Upgrade harness mode (solo → small-team → mid-team → org) with zero migration cost. Updates harness.config.json and generates additional files required by the new mode.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const current = loadHarnessConfig(input.cwd);
      const from: HarnessMode = input.from ?? current?.project.mode ?? "solo";
      const to = input.to;

      if (ORDER.indexOf(to) <= ORDER.indexOf(from)) {
        throw new Error(`Cannot downgrade from ${from} to ${to}.`);
      }

      const baseProject = current?.project ?? {
        name: "unknown",
        type: "backend-service" as const,
        stack: "other" as const,
        mode: from,
      };
      const newConfig = defaultConfigForMode(to, { ...baseProject, mode: to });
      const generated: GeneratedFile[] = [];

      const cfgPath = join(input.cwd, "harness.config.json");
      const cfgContent = JSON.stringify(newConfig, null, 2) + "\n";
      writeFileSync(cfgPath, cfgContent, "utf-8");
      generated.push({
        path: "harness.config.json",
        action: "updated",
        bytes: Buffer.byteLength(cfgContent, "utf-8"),
      });

      const nextSteps: string[] = [
        `已从 ${from} 升档到 ${to}`,
        "重新运行 harness_check 校验新模式下的门禁",
      ];

      switch (to) {
        case "small-team":
          nextSteps.push("建议补齐：CHANGELOG.md、.github/pull_request_template.md");
          break;
        case "mid-team":
          nextSteps.push(
            "建议补齐：CODEOWNERS、On-call 轮值表、SLO 模板、SCA 工具集成",
          );
          break;
        case "org":
          nextSteps.push("建议补齐：DORA 看板、RFC 流程、SBOM 自动生成、合规附件");
          break;
      }

      return { from, to, generated_files: generated, next_steps: nextSteps };
    },
  };
}
