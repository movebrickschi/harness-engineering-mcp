import type { RouteTaskToolInput, RouteTaskToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { routeTask } from "../../core/router/index.js";

const inputSchema = {
  type: "object",
  properties: {
    task: { type: "string", description: "One-line user request" },
    cwd: { type: "string" },
    context: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["frontend", "backend", "full-stack"] },
        has_prd: { type: "boolean" },
        has_prototype: { type: "boolean" },
      },
    },
  },
  required: ["task"],
} as const;

export function registerRouteTool(): ToolDefinition<RouteTaskToolInput, RouteTaskToolOutput> {
  return {
    name: "harness_route_task",
    description:
      "Route a user task description to the appropriate skill workflow. Returns skill name, deliverable checklist, and whether a forced upgrade is needed (>8h estimated, DB change, etc).",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => routeTask(input),
  };
}
