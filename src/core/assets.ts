import { readFile } from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve the assets/ root regardless of whether we are running from src
 * (tsx dev mode), dist (built mode), or installed as a global npm package.
 *
 * Lookup order:
 *   1. Same directory as this file (built or dev)
 *   2. ../assets (typical: dist/core/assets.js → ../../assets)
 *   3. Walk up to find package.json with name === "harness-engineering-mcp"
 */
export const assetsRoot: string = (() => {
  const candidates = [
    resolve(__dirname, "../../assets"),
    resolve(__dirname, "../assets"),
    resolve(__dirname, "./assets"),
    resolve(process.cwd(), "assets"),
  ];

  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isDirectory()) {
      return c;
    }
  }
  return candidates[0]!;
})();

export async function readAsset(relativePath: string): Promise<string> {
  const abs = join(assetsRoot, relativePath);
  return readFile(abs, "utf-8");
}

export function listAssetDirectory(relativePath: string): string[] {
  const abs = join(assetsRoot, relativePath);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).filter((name) => !name.startsWith("."));
}

export interface SkillSummary {
  name: string;
  hasSkillMd: boolean;
  extraFiles: string[];
}

export function listAssetSkills(): SkillSummary[] {
  const skillsDir = join(assetsRoot, "skills");
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir)
    .filter((name) => statSync(join(skillsDir, name)).isDirectory())
    .map((name) => {
      const dir = join(skillsDir, name);
      const files = readdirSync(dir);
      return {
        name,
        hasSkillMd: files.includes("SKILL.md"),
        extraFiles: files.filter((f) => f !== "SKILL.md"),
      };
    });
}
