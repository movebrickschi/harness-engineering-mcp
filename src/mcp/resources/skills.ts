import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assetsRoot, listAssetSkills } from "../../core/assets.js";
import type { ResourceContent, ResourceListItem } from "../../types/mcp.js";
import type { ResourceProvider } from "./spec.js";

export function registerSkillsResources(): ResourceProvider {
  const skillsRoot = join(assetsRoot, "skills");

  return {
    list(): ResourceListItem[] {
      const items: ResourceListItem[] = [
        {
          uri: "harness://skills/index",
          name: "Skills Index",
          mimeType: "application/json",
          description: "All built-in skills with metadata",
        },
      ];
      for (const s of listAssetSkills()) {
        items.push({
          uri: `harness://skills/${s.name}`,
          name: `skill: ${s.name}`,
          mimeType: "text/markdown",
        });
      }
      return items;
    },
    canRead(uri) {
      return uri.startsWith("harness://skills/");
    },
    async read(uri): Promise<ResourceContent> {
      if (uri === "harness://skills/index") {
        return {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ skills: listAssetSkills() }, null, 2),
        };
      }
      const name = uri.replace(/^harness:\/\/skills\//, "");
      const file = join(skillsRoot, name, "SKILL.md");
      if (!existsSync(file)) throw new Error(`Skill not found: ${name}`);
      return {
        uri,
        mimeType: "text/markdown",
        text: readFileSync(file, "utf-8"),
      };
    },
  };
}
