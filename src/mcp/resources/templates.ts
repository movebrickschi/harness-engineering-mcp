import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { assetsRoot } from "../../core/assets.js";
import type { ResourceContent, ResourceListItem } from "../../types/mcp.js";
import type { ResourceProvider } from "./spec.js";

export function registerTemplatesResources(): ResourceProvider {
  const templatesRoot = join(assetsRoot, "templates");

  return {
    list(): ResourceListItem[] {
      const items: ResourceListItem[] = [
        {
          uri: "harness://templates/index",
          name: "Templates Index",
          mimeType: "application/json",
        },
        {
          uri: "harness://config/schema",
          name: "harness.config.schema.json",
          mimeType: "application/json",
        },
      ];
      if (!existsSync(templatesRoot)) return items;
      walk(templatesRoot, "").forEach((rel) => {
        items.push({
          uri: `harness://templates/${rel.replace(/\\/g, "/")}`,
          name: `template: ${rel}`,
          mimeType: rel.endsWith(".json") ? "application/json" : "text/markdown",
        });
      });

      const stackRoot = join(assetsRoot, "stack-adapters");
      if (existsSync(stackRoot)) {
        for (const f of readdirSync(stackRoot)) {
          if (f.endsWith(".md")) {
            items.push({
              uri: `harness://stack-adapters/${f.replace(/\.md$/, "")}`,
              name: `stack-adapter: ${f}`,
              mimeType: "text/markdown",
            });
          }
        }
      }
      return items;
    },
    canRead(uri) {
      return (
        uri.startsWith("harness://templates/") ||
        uri.startsWith("harness://stack-adapters/") ||
        uri === "harness://config/schema"
      );
    },
    async read(uri): Promise<ResourceContent> {
      if (uri === "harness://config/schema") {
        const schemaPath = join(assetsRoot, "spec", "harness.config.schema.json");
        if (!existsSync(schemaPath)) {
          throw new Error("Schema file not found in assets/spec/");
        }
        return {
          uri,
          mimeType: "application/json",
          text: readFileSync(schemaPath, "utf-8"),
        };
      }
      if (uri.startsWith("harness://stack-adapters/")) {
        const name = uri.replace(/^harness:\/\/stack-adapters\//, "");
        const file = join(assetsRoot, "stack-adapters", `${name}.md`);
        if (!existsSync(file)) throw new Error(`Stack adapter not found: ${name}`);
        return { uri, mimeType: "text/markdown", text: readFileSync(file, "utf-8") };
      }
      if (uri === "harness://templates/index") {
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ templates: walk(templatesRoot, "") }, null, 2),
        };
      }
      const rel = uri.replace(/^harness:\/\/templates\//, "");
      const file = join(templatesRoot, rel);
      if (!existsSync(file)) throw new Error(`Template not found: ${rel}`);
      return {
        uri,
        mimeType: rel.endsWith(".json") ? "application/json" : "text/markdown",
        text: readFileSync(file, "utf-8"),
      };
    },
  };
}

function walk(root: string, prefix: string): string[] {
  if (!existsSync(root)) return [];
  const acc: string[] = [];
  for (const entry of readdirSync(root)) {
    if (entry.startsWith(".")) continue;
    const abs = join(root, entry);
    const rel = prefix ? join(prefix, entry) : entry;
    if (statSync(abs).isDirectory()) {
      acc.push(...walk(abs, rel));
    } else {
      acc.push(rel);
    }
  }
  return acc;
}
