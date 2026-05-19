import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LoadSkillToolInput, LoadSkillToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { assetsRoot } from "../../core/assets.js";

const inputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Skill name (e.g. 'dev-flow', 'bugfix-flow', 'brainstorming')",
    },
  },
  required: ["name"],
} as const;

export function registerLoadSkillTool(): ToolDefinition<LoadSkillToolInput, LoadSkillToolOutput> {
  return {
    name: "harness_load_skill",
    description:
      "Load the full markdown content of a built-in skill. AI should follow the skill instructions after loading. Returns the SKILL.md body plus dependency / related skill names.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const skillDir = join(assetsRoot, "skills", input.name);
      const skillFile = join(skillDir, "SKILL.md");
      if (!existsSync(skillFile)) {
        throw new Error(
          `Skill not found: ${input.name}. Run harness_list_skills to see available skills.`,
        );
      }
      const content = readFileSync(skillFile, "utf-8");
      return {
        name: input.name,
        version: "0.1.0",
        content,
        depends_on: extractMentioned(content, "depends_on"),
        related: extractMentioned(content, "related"),
      };
    },
  };
}

function extractMentioned(content: string, key: string): string[] {
  const re = new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, "i");
  const m = content.match(re);
  if (!m || !m[1]) return [];
  return m[1]
    .split(/,/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}
