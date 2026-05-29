/**
 * 包版本号 · 唯一真理源（Single Source of Truth）
 *
 * 历史问题：版本号曾散落在 `src/cli/index.ts` 与 `src/mcp/server.ts` 多处硬编码，
 * 每次发版要手改 2-3 处，0.3.1 即漏改了 server.ts 的 fallback（运行时仍上报 0.3.0）。
 *
 * 现统一从 `package.json` 运行时读取，杜绝再次漂移：
 *   - 开发态（tsx 跑 src/）：从 src/core/ 向上回溯到仓库根的 package.json
 *   - 构建态（tsup 把本文件 inline 进 dist/）：从 dist/ 向上回溯到包根的 package.json
 * 发版只改 package.json（`npm version` 自动维护）即可。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PACKAGE_NAME = "harness-engineering-mcp";

function resolveVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === PACKAGE_NAME && typeof pkg.version === "string") {
        return pkg.version;
      }
    } catch {
      // 该层无 package.json 或解析失败 → 继续向上回溯
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "0.0.0";
}

/** 当前包版本，来源于 package.json（开发 / 构建两态一致）。 */
export const VERSION: string = resolveVersion();
