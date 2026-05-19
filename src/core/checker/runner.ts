import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type {
  CheckResult,
  CheckStatus,
  CheckToolInput,
  CheckToolOutput,
} from "../../types/harness.js";
import { loadHarnessConfig } from "../config/loader.js";

type Category = NonNullable<CheckToolInput["categories"]>[number];

interface CheckRunner {
  category: Exclude<Category, "all">;
  id: string;
  run: (cwd: string) => CheckResult;
}

const CHECKS: CheckRunner[] = [
  {
    category: "config",
    id: "config.exists",
    run: (cwd) =>
      existsSync(join(cwd, "harness.config.json"))
        ? ok("config", "config.exists", "harness.config.json 存在")
        : fail(
            "config",
            "config.exists",
            "缺少 harness.config.json，请运行 harness init",
          ),
  },
  {
    category: "config",
    id: "config.valid",
    run: (cwd) => {
      const cfg = safeLoadConfig(cwd);
      if (!cfg) return warn("config", "config.valid", "harness.config.json 缺失，跳过解析");
      if (!cfg.project?.mode) return fail("config", "config.valid", "config.project.mode 缺失");
      return ok("config", "config.valid", `mode=${cfg.project.mode} stack=${cfg.project.stack}`);
    },
  },
  {
    category: "structure",
    id: "structure.ssot",
    run: (cwd) =>
      existsSync(join(cwd, "docs/engineering-harness.md"))
        ? ok("structure", "structure.ssot", "SSOT docs/engineering-harness.md 存在")
        : warn(
            "structure",
            "structure.ssot",
            "缺少 docs/engineering-harness.md，建议 harness init 重生成",
          ),
  },
  {
    category: "structure",
    id: "structure.adr",
    run: (cwd) => {
      const adrDir = join(cwd, "docs/adr");
      if (!existsSync(adrDir)) return warn("structure", "structure.adr", "缺少 docs/adr/ 目录");
      const adrs = readdirSync(adrDir).filter((f) => f.endsWith(".md"));
      return adrs.length > 0
        ? ok("structure", "structure.adr", `${adrs.length} 条 ADR`)
        : warn("structure", "structure.adr", "docs/adr/ 下尚无 ADR 记录");
    },
  },
  {
    category: "structure",
    id: "structure.features",
    run: (cwd) =>
      existsSync(join(cwd, "docs/features/INDEX.md"))
        ? ok("structure", "structure.features", "features 任务看板存在")
        : warn(
            "structure",
            "structure.features",
            "缺少 docs/features/INDEX.md（任务记忆入口）",
          ),
  },
  {
    category: "secrets",
    id: "secrets.envfile",
    run: (cwd) => {
      const envFiles = walk(cwd, 3).filter((p) =>
        /\.(env|env\.local|env\.production)$/i.test(p) && !p.includes("node_modules"),
      );
      return envFiles.length === 0
        ? ok("secrets", "secrets.envfile", "未在仓库中发现 .env 文件")
        : fail(
            "secrets",
            "secrets.envfile",
            `检测到 ${envFiles.length} 个 .env 文件，应加入 .gitignore`,
          );
    },
  },
  {
    category: "tests",
    id: "tests.directory",
    run: (cwd) => {
      const candidates = ["test", "tests", "src/test"];
      const found = candidates.find((rel) => existsSync(join(cwd, rel)));
      return found
        ? ok("tests", "tests.directory", `测试目录 ${found} 存在`)
        : warn("tests", "tests.directory", "未发现 test/tests/src/test 目录");
    },
  },
  {
    category: "tests",
    id: "tests.command",
    run: (cwd) => {
      const cfg = safeLoadConfig(cwd);
      if (cfg?.project.stack === "node-typescript") {
        const pkg = safeReadJson<{ scripts?: Record<string, string> }>(join(cwd, "package.json"));
        return pkg?.scripts?.test
          ? ok("tests", "tests.command", `npm test 已配置: ${pkg.scripts.test}`)
          : warn("tests", "tests.command", "package.json 未配置 scripts.test");
      }
      if (cfg?.project.stack === "java-spring") {
        return existsSync(join(cwd, "pom.xml")) ||
          existsSync(join(cwd, "build.gradle")) ||
          existsSync(join(cwd, "build.gradle.kts"))
          ? ok("tests", "tests.command", "Java 构建文件存在，可执行 Maven/Gradle 测试")
          : warn("tests", "tests.command", "未发现 Maven/Gradle 构建文件");
      }
      if (cfg?.project.stack === "python") {
        return existsSync(join(cwd, "pyproject.toml")) || existsSync(join(cwd, "requirements.txt"))
          ? ok("tests", "tests.command", "Python 项目清单存在，可接入 pytest")
          : warn("tests", "tests.command", "未发现 Python 项目清单");
      }
      return warn("tests", "tests.command", "无法根据当前 stack 推断测试命令");
    },
  },
  {
    category: "baseline",
    id: "baseline.exists",
    run: (cwd) =>
      existsSync(join(cwd, "verification_baseline.json"))
        ? ok("baseline", "baseline.exists", "verification_baseline.json 存在")
        : warn(
            "baseline",
            "baseline.exists",
            "缺少 verification_baseline.json，建议 harness init 重生成",
          ),
  },
  {
    category: "baseline",
    id: "baseline.valid",
    run: (cwd) => {
      const baselinePath = join(cwd, "verification_baseline.json");
      if (!existsSync(baselinePath)) {
        return warn("baseline", "baseline.valid", "verification_baseline.json 缺失，跳过解析");
      }
      const baseline = safeReadJson<Record<string, unknown>>(baselinePath);
      if (!baseline) {
        return fail("baseline", "baseline.valid", "verification_baseline.json 不是合法 JSON");
      }
      if (typeof baseline.version !== "string") {
        return fail("baseline", "baseline.valid", "verification_baseline.version 缺失");
      }
      return ok("baseline", "baseline.valid", `baseline version=${baseline.version}`);
    },
  },
  {
    category: "docs",
    id: "docs.readme",
    run: (cwd) =>
      existsSync(join(cwd, "README.md"))
        ? ok("docs", "docs.readme", "README.md 存在")
        : warn("docs", "docs.readme", "缺少 README.md"),
  },
];

export async function runChecks(input: CheckToolInput): Promise<CheckToolOutput> {
  const start = Date.now();
  const categories = (input.categories ?? ["all"]).flatMap((c) =>
    c === "all"
      ? (["config", "structure", "tests", "secrets", "baseline", "docs"] as Exclude<
          Category,
          "all"
        >[])
      : [c as Exclude<Category, "all">],
  );

  const results: CheckResult[] = [];
  for (const runner of CHECKS) {
    if (!categories.includes(runner.category)) continue;
    try {
      results.push(runner.run(input.cwd));
    } catch (err) {
      results.push(
        fail(
          runner.category,
          runner.id,
          `check crashed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  const summary = { pass: 0, warn: 0, fail: 0, total: results.length };
  for (const r of results) {
    if (r.status === "PASS") summary.pass++;
    else if (r.status === "WARN") summary.warn++;
    else summary.fail++;
  }

  const status: CheckStatus =
    summary.fail > 0
      ? "FAIL"
      : input.strict && summary.warn > 0
        ? "FAIL"
        : summary.warn > 0
          ? "WARN"
          : "PASS";

  return {
    status,
    summary,
    results,
    elapsed_ms: Date.now() - start,
  };
}

function ok(category: string, id: string, message: string): CheckResult {
  return { category, check_id: id, status: "PASS", message };
}
function warn(category: string, id: string, message: string, suggestion?: string): CheckResult {
  return { category, check_id: id, status: "WARN", message, suggestion };
}
function fail(category: string, id: string, message: string, suggestion?: string): CheckResult {
  return { category, check_id: id, status: "FAIL", message, suggestion };
}

function safeLoadConfig(cwd: string) {
  try {
    return loadHarnessConfig(cwd);
  } catch {
    return null;
  }
}

function safeReadJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

function walk(root: string, maxDepth: number, depth = 0, acc: string[] = []): string[] {
  if (depth > maxDepth) return acc;
  try {
    for (const entry of readdirSync(root)) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
      const full = join(root, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, maxDepth, depth + 1, acc);
      else acc.push(full);
    }
  } catch {
    /* ignore */
  }
  return acc;
}

