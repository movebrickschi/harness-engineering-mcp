import { existsSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { UninstallToolInput, UninstallToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { HARNESS_DIR } from "../../core/paths.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string", description: "Absolute project root path" },
    dry_run: {
      type: "boolean",
      default: false,
      description: "Only list what would be deleted, do not actually delete",
    },
    keep_root_dir: {
      type: "boolean",
      default: false,
      description: "Empty .harness/ contents but keep the directory itself",
    },
  },
  required: ["cwd"],
} as const;

/**
 * harness_uninstall · 从项目里清除 Engineering Harness 产物
 *
 * 删除范围：项目根的 `.harness/` 目录及其全部内容。
 * 保留范围：
 *   - 根 `CHANGELOG.md`（npm/Release 工具约定）
 *   - `.github/CODEOWNERS` / `.github/pull_request_template.md`（GitHub 约定）
 *   - 其它非 .harness/ 文件（用户自有产物）
 *
 * 安全门：必须显式传 cwd；MCP server 不接受裸 cwd=. 调用避免误删。
 */
export function registerUninstallTool(): ToolDefinition<UninstallToolInput, UninstallToolOutput> {
  return {
    name: "harness_uninstall",
    description:
      "Remove Engineering Harness artifacts from the project. Deletes the .harness/ directory recursively. CHANGELOG.md and .github/* are intentionally preserved (external tool conventions). Set dry_run=true to preview the file list without deleting.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const harnessAbs = join(input.cwd, HARNESS_DIR);
      const keptArtifacts: string[] = [];
      // 列出根/.github 下与 harness 相关但因外部约定保留的文件
      for (const candidate of [
        "CHANGELOG.md",
        ".github/CODEOWNERS",
        ".github/pull_request_template.md",
      ]) {
        if (existsSync(join(input.cwd, candidate))) keptArtifacts.push(candidate);
      }

      if (!existsSync(harnessAbs)) {
        return {
          status: "not_found",
          removed: [],
          kept: keptArtifacts,
          next_steps: [
            `项目 ${input.cwd} 下未发现 ${HARNESS_DIR}/ 目录，无需 uninstall`,
            keptArtifacts.length > 0
              ? `注：以下文件因外部工具约定不在 uninstall 范围内：${keptArtifacts.join(", ")}`
              : "项目根下也无 CHANGELOG.md / .github/* 等 harness 相关产物",
          ],
        };
      }

      const removable = listRecursive(harnessAbs).map((abs) =>
        toPortableRel(input.cwd, abs),
      );
      // 把根 .harness/ 本身也加进列表（除非 keep_root_dir=true）
      if (input.keep_root_dir !== true) removable.push(HARNESS_DIR);

      if (input.dry_run === true) {
        return {
          status: "dry_run",
          removed: removable,
          kept: keptArtifacts,
          next_steps: [
            `dry_run：上述 ${removable.length} 项将被删除，未实际写盘`,
            "确认无误后去掉 dry_run=true 再调用一次完成清除",
          ],
        };
      }

      if (input.keep_root_dir === true) {
        for (const entry of readdirSync(harnessAbs)) {
          rmSync(join(harnessAbs, entry), { recursive: true, force: true });
        }
      } else {
        rmSync(harnessAbs, { recursive: true, force: true });
      }

      return {
        status: "completed",
        removed: removable,
        kept: keptArtifacts,
        next_steps: [
          `已从 ${input.cwd} 移除 Engineering Harness 全部产物`,
          keptArtifacts.length > 0
            ? `以下文件因外部约定保留，如需手工删除：${keptArtifacts.join(", ")}`
            : "项目根下无残留",
          "如未来想重新启用 harness：直接运行 harness init",
        ],
      };
    },
  };
}

function listRecursive(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    const abs = join(root, entry);
    if (statSync(abs).isDirectory()) {
      out.push(...listRecursive(abs));
      out.push(abs);
    } else {
      out.push(abs);
    }
  }
  return out;
}

function toPortableRel(cwd: string, abs: string): string {
  const rel = relative(cwd, abs) || abs;
  return rel.split(sep).join("/");
}
