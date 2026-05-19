import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { assetsRoot } from "../../core/assets.js";
import type { ResourceContent, ResourceListItem } from "../../types/mcp.js";
import type { ResourceProvider } from "./spec.js";

interface RuleMeta {
  filename: string;
  appliesTo: string[];
}

export function registerRulesResources(): ResourceProvider {
  const rulesRoot = join(assetsRoot, "rules");

  return {
    list(): ResourceListItem[] {
      const items: ResourceListItem[] = [
        {
          uri: "harness://rules/index",
          name: "Cursor Rules Index",
          mimeType: "application/json",
          description: "Index of all rules with applies_to metadata",
        },
      ];
      if (!existsSync(rulesRoot)) return items;
      for (const meta of listRules(rulesRoot)) {
        items.push({
          uri: `harness://rules/${meta.filename}`,
          name: `rule: ${meta.filename}`,
          mimeType: "text/markdown",
          description: `applies_to: ${meta.appliesTo.join(", ")}`,
        });
      }
      return items;
    },
    canRead(uri) {
      return uri.startsWith("harness://rules/");
    },
    async read(uri): Promise<ResourceContent> {
      if (uri === "harness://rules/index") {
        const rules = listRules(rulesRoot);
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ rules }, null, 2),
        };
      }
      const name = uri.replace(/^harness:\/\/rules\//, "");
      const file = join(rulesRoot, name);
      if (!existsSync(file)) throw new Error(`Rule not found: ${name}`);
      return {
        uri,
        mimeType: "text/markdown",
        text: readFileSync(file, "utf-8"),
      };
    },
  };
}

/**
 * Filter rules whose `applies_to` frontmatter covers the requested stack.
 * Rules tagged `[all]` (or missing frontmatter) are always included.
 */
export function listRulesForStack(stack: string | null | undefined): RuleMeta[] {
  const rulesRoot = join(assetsRoot, "rules");
  if (!existsSync(rulesRoot)) return [];
  return listRules(rulesRoot).filter((r) => {
    if (r.appliesTo.length === 0) return true;
    if (r.appliesTo.includes("all")) return true;
    if (!stack) return true;
    return r.appliesTo.includes(stack);
  });
}

function listRules(rulesRoot: string): RuleMeta[] {
  return readdirSync(rulesRoot)
    .filter((f) => f.endsWith(".mdc") || f.endsWith(".md"))
    .sort()
    .map((filename) => {
      const text = readFileSync(join(rulesRoot, filename), "utf-8");
      return { filename, appliesTo: extractAppliesTo(text) };
    });
}

function extractAppliesTo(text: string): string[] {
  const match = text.match(/^---\s*([\s\S]*?)---/);
  if (!match) return [];
  const fm = match[1] ?? "";
  const line = fm.split(/\r?\n/).find((l) => l.trim().startsWith("applies_to"));
  if (!line) return [];
  const rhs = line.split(":")[1] ?? "";
  return rhs
    .replace(/^\s*\[?/, "")
    .replace(/]?\s*$/, "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}
