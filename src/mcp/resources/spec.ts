import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { assetsRoot } from "../../core/assets.js";
import type { ResourceContent, ResourceListItem } from "../../types/mcp.js";

export interface ResourceProvider {
  list(): ResourceListItem[];
  canRead(uri: string): boolean;
  read(uri: string): Promise<ResourceContent>;
}

export function registerSpecResources(): ResourceProvider {
  const specRoot = join(assetsRoot, "spec");

  return {
    list(): ResourceListItem[] {
      const items: ResourceListItem[] = [
        {
          uri: "harness://spec/index",
          name: "Engineering Harness Spec Index",
          mimeType: "text/markdown",
          description: "All spec files with frontmatter mode tags",
        },
      ];
      if (!existsSync(specRoot)) return items;
      walkSpec(specRoot, "").forEach((rel) => {
        items.push({
          uri: `harness://spec/file/${rel.replace(/\\/g, "/")}`,
          name: `spec: ${rel}`,
          mimeType: "text/markdown",
        });
      });
      return items;
    },
    canRead(uri) {
      return uri.startsWith("harness://spec/");
    },
    async read(uri): Promise<ResourceContent> {
      if (uri === "harness://spec/index") {
        return {
          uri,
          mimeType: "text/markdown",
          text: buildSpecIndex(specRoot),
        };
      }
      const filePart = uri.replace(/^harness:\/\/spec\/file\//, "");
      const abs = join(specRoot, filePart);
      if (!existsSync(abs)) throw new Error(`Spec file not found: ${filePart}`);
      return {
        uri,
        mimeType: abs.endsWith(".json") ? "application/json" : "text/markdown",
        text: readFileSync(abs, "utf-8"),
      };
    },
  };
}

function walkSpec(root: string, prefix: string): string[] {
  if (!existsSync(root)) return [];
  const acc: string[] = [];
  for (const entry of readdirSync(root)) {
    if (entry.startsWith(".")) continue;
    const abs = join(root, entry);
    const rel = prefix ? join(prefix, entry) : entry;
    if (statSync(abs).isDirectory()) {
      acc.push(...walkSpec(abs, rel));
    } else if (entry.endsWith(".md") || entry.endsWith(".json")) {
      acc.push(rel);
    }
  }
  return acc;
}

function buildSpecIndex(specRoot: string): string {
  const files = walkSpec(specRoot, "");
  const lines = ["# Engineering Harness Spec Index", ""];
  files.sort().forEach((rel) => {
    lines.push(`- \`${rel.replace(/\\/g, "/")}\``);
  });
  return lines.join("\n");
}
