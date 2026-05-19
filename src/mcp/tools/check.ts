import type { CheckToolInput, CheckToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { runChecks } from "../../core/checker/runner.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string" },
    categories: {
      type: "array",
      items: {
        enum: ["config", "structure", "tests", "secrets", "baseline", "docs", "all"],
      },
      default: ["all"],
    },
    strict: { type: "boolean", default: false },
    output_format: { type: "string", enum: ["summary", "detailed", "json"], default: "summary" },
  },
  required: ["cwd"],
} as const;

export function registerCheckTool(): ToolDefinition<CheckToolInput, CheckToolOutput> {
  return {
    name: "harness_check",
    description:
      "Run Engineering Harness checks based on harness.config.json. Cross-platform replacement for engineering-check.ps1/sh. Returns structured PASS/WARN/FAIL summary plus per-check details.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => runChecks(input),
  };
}
