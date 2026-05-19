import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { assetsRoot, listAssetSkills } from "../../core/assets.js";

export function registerListCommand(program: Command): void {
  const list = program.command("list").description("List built-in Harness assets");

  list
    .command("skills")
    .description("List built-in skills")
    .action(() => {
      for (const s of listAssetSkills()) {
        console.log(`${s.name}${s.hasSkillMd ? "" : " (missing SKILL.md)"}`);
      }
    });

  list
    .command("spec")
    .description("List spec files")
    .action(() => {
      printFiles(join(assetsRoot, "spec"));
    });

  list
    .command("rules")
    .description("List rule templates")
    .action(() => {
      printFiles(join(assetsRoot, "rules"));
    });
}

function printFiles(root: string, prefix = ""): void {
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root)) {
    const abs = join(root, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(abs).isDirectory()) printFiles(abs, rel);
    else console.log(rel);
  }
}
