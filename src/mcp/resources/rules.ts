import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { assetsRoot } from "../../core/assets.js";
import type { ResourceContent, ResourceListItem } from "../../types/mcp.js";
import type { ResourceProvider } from "./spec.js";

export function registerRulesResources(): ResourceProvider {
  const rulesRoot = join(assetsRoot, "rules");

  return {
    list(): ResourceListItem[] {
      const items: ResourceListItem[] = [
        {
          uri: "harness://rules/index",
          name: "Cursor Rules Index",
          mimeType: "application/json",
        },
      ];
      if (!existsSync(rulesRoot)) return items;
      readdirSync(rulesRoot)
        .filter((f) => f.endsWith(".mdc") || f.endsWith(".md"))
        .forEach((name) => {
          items.push({
            uri: `harness://rules/${name}`,
            name: `rule: ${name}`,
            mimeType: "text/markdown",
          });
        });
      return items;
    },
    canRead(uri) {
      return uri.startsWith("harness://rules/");
    },
    async read(uri): Promise<ResourceContent> {
      if (uri === "harness://rules/index") {
        const list = existsSync(rulesRoot)
          ? readdirSync(rulesRoot).filter((f) => f.endsWith(".mdc") || f.endsWith(".md"))
          : [];
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ rules: list }, null, 2),
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
