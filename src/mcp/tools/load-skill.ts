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
    sections: {
      type: "array",
      items: { type: "string" },
      description:
        "Optional list of ## section names to return (case-insensitive partial match). Omit to get full content.",
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
      const fullContent = readFileSync(skillFile, "utf-8");
      const content =
        input.sections && input.sections.length > 0
          ? filterSections(fullContent, input.sections)
          : fullContent;
      return {
        name: input.name,
        version: "0.1.0",
        content,
        depends_on: extractMentioned(fullContent, "depends_on"),
        related: extractMentioned(fullContent, "related"),
      };
    },
  };
}

/** 按 ## 标题切片，只返回 sections 列表中匹配的段落（大小写不敏感、部分匹配） */
function filterSections(fullContent: string, sections: string[]): string {
  const lines = fullContent.split(/\r?\n/);
  const titleLine = lines[0] ?? "";

  const chunks: Array<{ heading: string; body: string }> = [];
  let curHeading = "";
  let curLines: string[] = [];
  for (const line of lines.slice(1)) {
    if (/^##\s+/.test(line)) {
      if (curHeading) chunks.push({ heading: curHeading, body: curLines.join("\n") });
      curHeading = line;
      curLines = [];
    } else {
      curLines.push(line);
    }
  }
  if (curHeading) chunks.push({ heading: curHeading, body: curLines.join("\n") });

  const lowerSections = sections.map((s) => s.toLowerCase());
  const matched = chunks.filter((c) => {
    const h = c.heading.toLowerCase();
    return lowerSections.some((s) => h.includes(s));
  });

  if (matched.length === 0) return fullContent;
  return [titleLine, ...matched.map((m) => m.heading + "\n" + m.body)].join("\n---\n");
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
