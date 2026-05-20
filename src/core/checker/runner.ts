import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from "node:timers";
import { join } from "node:path";
import type {
  CheckResult,
  CheckStatus,
  CheckToolInput,
  CheckToolOutput,
} from "../../types/harness.js";
import { loadHarnessConfig } from "../config/loader.js";
import { HARNESS_PATHS } from "../paths.js";

type Category = NonNullable<CheckToolInput["categories"]>[number];

interface CheckRunner {
  category: Exclude<Category, "all">;
  id: string;
  /** When defined, runner is only executed if predicate returns true. */
  when?: (input: CheckToolInput) => boolean;
  run: (cwd: string, input: CheckToolInput) => CheckResult | Promise<CheckResult>;
}

const CHECKS: CheckRunner[] = [
  {
    category: "config",
    id: "config.exists",
    run: (cwd) =>
      existsSync(join(cwd, HARNESS_PATHS.config))
        ? ok("config", "config.exists", `${HARNESS_PATHS.config} 存在`)
        : fail(
            "config",
            "config.exists",
            `缺少 ${HARNESS_PATHS.config}，请运行 harness init`,
          ),
  },
  {
    category: "config",
    id: "config.valid",
    run: (cwd) => {
      const cfg = safeLoadConfig(cwd);
      if (!cfg) return warn("config", "config.valid", `${HARNESS_PATHS.config} 缺失，跳过解析`);
      if (!cfg.project?.mode) return fail("config", "config.valid", "config.project.mode 缺失");
      return ok("config", "config.valid", `mode=${cfg.project.mode} stack=${cfg.project.stack}`);
    },
  },
  {
    category: "structure",
    id: "structure.ssot",
    run: (cwd) =>
      existsSync(join(cwd, HARNESS_PATHS.ssot))
        ? ok("structure", "structure.ssot", `SSOT ${HARNESS_PATHS.ssot} 存在`)
        : warn(
            "structure",
            "structure.ssot",
            `缺少 ${HARNESS_PATHS.ssot}，建议 harness init 重生成`,
          ),
  },
  {
    category: "structure",
    id: "structure.adr",
    run: (cwd) => {
      const adrDir = join(cwd, HARNESS_PATHS.adrDir);
      if (!existsSync(adrDir)) return warn("structure", "structure.adr", `缺少 ${HARNESS_PATHS.adrDir}/ 目录`);
      const adrs = readdirSync(adrDir).filter((f) => f.endsWith(".md"));
      return adrs.length > 0
        ? ok("structure", "structure.adr", `${adrs.length} 条 ADR`)
        : warn("structure", "structure.adr", `${HARNESS_PATHS.adrDir}/ 下尚无 ADR 记录`);
    },
  },
  {
    category: "structure",
    id: "structure.features",
    run: (cwd) =>
      existsSync(join(cwd, HARNESS_PATHS.featuresIndex))
        ? ok("structure", "structure.features", "features 任务看板存在")
        : warn(
            "structure",
            "structure.features",
            `缺少 ${HARNESS_PATHS.featuresIndex}（任务记忆入口）`,
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
    category: "tests",
    id: "tests.exec",
    when: (input) => input.run_tests === true,
    run: async (cwd, input) => {
      const cfg = safeLoadConfig(cwd);
      const stack = cfg?.project.stack ?? "other";
      const cmd = resolveTestCommand(cwd, stack);
      if (!cmd) {
        return warn(
          "tests",
          "tests.exec",
          `无法为 stack=${stack} 推断可执行的测试命令`,
        );
      }
      const exec = await runCommand(cmd.command, cmd.args, cwd, input.test_timeout_ms ?? 600_000);
      if (exec.timedOut) {
        return fail(
          "tests",
          "tests.exec",
          `${cmd.label} 超时 (${input.test_timeout_ms ?? 600_000}ms)`,
        );
      }
      if (exec.spawnError) {
        return warn(
          "tests",
          "tests.exec",
          `${cmd.label} 无法启动: ${exec.spawnError}（可能未安装或不在 PATH）`,
        );
      }
      const tail = (exec.stdout + exec.stderr).slice(-512).replace(/\s+$/g, "");
      if (exec.exitCode === 0) {
        return ok(
          "tests",
          "tests.exec",
          `${cmd.label} 成功 (exit=0) · 末尾: ${tail.slice(-160)}`,
        );
      }
      return fail(
        "tests",
        "tests.exec",
        `${cmd.label} 失败 (exit=${exec.exitCode}) · 末尾: ${tail.slice(-160)}`,
      );
    },
  },
  {
    category: "baseline",
    id: "baseline.exists",
    run: (cwd) =>
      existsSync(join(cwd, HARNESS_PATHS.baseline))
        ? ok("baseline", "baseline.exists", `${HARNESS_PATHS.baseline} 存在`)
        : warn(
            "baseline",
            "baseline.exists",
            `缺少 ${HARNESS_PATHS.baseline}，建议 harness init 重生成`,
          ),
  },
  {
    category: "baseline",
    id: "baseline.valid",
    run: (cwd) => {
      const baselinePath = join(cwd, HARNESS_PATHS.baseline);
      if (!existsSync(baselinePath)) {
        return warn("baseline", "baseline.valid", `${HARNESS_PATHS.baseline} 缺失，跳过解析`);
      }
      const baseline = safeReadJson<Record<string, unknown>>(baselinePath);
      if (!baseline) {
        return fail("baseline", "baseline.valid", `${HARNESS_PATHS.baseline} 不是合法 JSON`);
      }
      if (typeof baseline.version !== "string") {
        return fail("baseline", "baseline.valid", `${HARNESS_PATHS.baseline} version 字段缺失`);
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
  {
    category: "structure",
    id: "structure.feature_completeness",
    run: (cwd) => {
      const featuresDir = join(cwd, HARNESS_PATHS.featuresDir);
      if (!existsSync(featuresDir)) return ok("structure", "structure.feature_completeness", "尚无 feature 目录");
      const cfg = safeLoadConfig(cwd);
      const gateRequired = cfg?.modules?.process?.gate_review_enabled === true;
      const expectedPrefixes = ["01_", "02_", "04_", "05_", "06_"];
      if (gateRequired) expectedPrefixes.splice(2, 0, "03_");
      const entries = readdirSync(featuresDir).filter(
        (d) => d !== "_template" && d !== "INDEX.md" && statSync(join(featuresDir, d)).isDirectory(),
      );
      if (entries.length === 0)
        return ok("structure", "structure.feature_completeness", "尚无 feature 子目录");
      const warnings: string[] = [];
      for (const feat of entries) {
        const files = readdirSync(join(featuresDir, feat));
        const hasStaged = files.some((f) => /^0\d_/.test(f));
        if (!hasStaged) continue;
        const missing = expectedPrefixes.filter((p) => !files.some((f) => f.startsWith(p)));
        if (missing.length > 0)
          warnings.push(`feature '${feat}' 缺少阶段文档: ${missing.map((p) => p.replace(/_$/, "")).join(", ")}`);
      }
      if (warnings.length > 0)
        return warn("structure", "structure.feature_completeness", warnings.join("; "));
      return ok("structure", "structure.feature_completeness", `${entries.length} 个 feature 文档完整`);
    },
  },
  {
    category: "secrets",
    id: "secrets.gitignore",
    run: (cwd) => {
      const giPath = join(cwd, ".gitignore");
      if (!existsSync(giPath))
        return warn("secrets", "secrets.gitignore", "缺少 .gitignore，建议创建并添加 node_modules/dist/.env");
      const gi = readFileSync(giPath, "utf-8");
      const required = ["node_modules", "dist", ".env"];
      const missing = required.filter((r) => !gi.split(/\r?\n/).some((l) => l.trim() === r || l.trim().startsWith(r + "/")));
      if (missing.length > 0)
        return warn("secrets", "secrets.gitignore", `.gitignore 缺少以下排除项: ${missing.join(", ")}`);
      return ok("secrets", "secrets.gitignore", ".gitignore 包含关键排除项");
    },
  },
  {
    category: "tests",
    id: "quality.coverage",
    when: () => true,
    run: (cwd) => {
      const cfg = safeLoadConfig(cwd);
      const threshold = cfg?.modules?.quality?.coverage_baseline;
      if (typeof threshold !== "number" || threshold <= 0)
        return ok("tests", "quality.coverage", "未设置覆盖率基线，跳过");
      const baseline = safeReadJson<{ coverage?: { baseline?: number } }>(join(cwd, HARNESS_PATHS.baseline));
      if (!baseline?.coverage || typeof baseline.coverage.baseline !== "number")
        return warn("tests", "quality.coverage", `${HARNESS_PATHS.baseline} 缺少 coverage.baseline 字段`);
      const actual = baseline.coverage.baseline;
      if (actual < threshold)
        return warn("tests", "quality.coverage", `覆盖率基线 ${(actual * 100).toFixed(0)}% 低于配置门槛 ${(threshold * 100).toFixed(0)}%`);
      return ok("tests", "quality.coverage", `覆盖率基线 ${(actual * 100).toFixed(0)}% ≥ 配置门槛 ${(threshold * 100).toFixed(0)}%`);
    },
  },
  {
    category: "structure",
    id: "quality.pr_size",
    run: async (cwd) => {
      const cfg = safeLoadConfig(cwd);
      const maxLines = cfg?.modules?.people?.pr_max_lines;
      const maxFiles = cfg?.modules?.people?.pr_max_files;
      if (!maxLines && !maxFiles)
        return ok("structure", "quality.pr_size", "未设置 PR 大小限制，跳过");
      const gitDir = join(cwd, ".git");
      if (!existsSync(gitDir))
        return warn("structure", "quality.pr_size", "非 git 仓库，跳过 PR 大小检查");
      const diff = await runCommand("git", ["diff", "--stat", "HEAD"], cwd, 10_000);
      if (diff.spawnError || diff.exitCode !== 0)
        return warn("structure", "quality.pr_size", "无法执行 git diff，跳过");
      const statLines = (diff.stdout + diff.stderr).split(/\r?\n/).filter(Boolean);
      const summaryLine = statLines[statLines.length - 1] ?? "";
      const filesMatch = summaryLine.match(/(\d+)\s+files?\s+changed/);
      const insertMatch = summaryLine.match(/(\d+)\s+insertions?/);
      const deleteMatch = summaryLine.match(/(\d+)\s+deletions?/);
      const changedFiles = parseInt(filesMatch?.[1] ?? "0", 10);
      const totalLines = parseInt(insertMatch?.[1] ?? "0", 10) + parseInt(deleteMatch?.[1] ?? "0", 10);
      const issues: string[] = [];
      if (maxLines && totalLines > maxLines) issues.push(`${totalLines} 行 > 限制 ${maxLines} 行`);
      if (maxFiles && changedFiles > maxFiles) issues.push(`${changedFiles} 文件 > 限制 ${maxFiles} 文件`);
      if (issues.length > 0)
        return warn("structure", "quality.pr_size", `当前变更超限: ${issues.join(", ")}，建议拆分`);
      return ok("structure", "quality.pr_size", `变更 ${totalLines} 行 / ${changedFiles} 文件，在限制内`);
    },
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
    if (runner.when && !runner.when(input)) continue;
    try {
      const out = await runner.run(input.cwd, input);
      results.push(out);
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

interface ResolvedCommand {
  command: string;
  args: string[];
  label: string;
}

function resolveTestCommand(cwd: string, stack: string): ResolvedCommand | null {
  if (stack === "node-typescript" || existsSync(join(cwd, "package.json"))) {
    const pkg = safeReadJson<{ scripts?: Record<string, string> }>(join(cwd, "package.json"));
    if (pkg?.scripts?.test) {
      return { command: "npm", args: ["test", "--silent"], label: "npm test" };
    }
  }
  if (stack === "java-spring" || existsSync(join(cwd, "pom.xml"))) {
    if (existsSync(join(cwd, "pom.xml"))) {
      return { command: "mvn", args: ["test", "-B"], label: "mvn test" };
    }
    if (existsSync(join(cwd, "build.gradle")) || existsSync(join(cwd, "build.gradle.kts"))) {
      return { command: "gradle", args: ["test"], label: "gradle test" };
    }
  }
  if (stack === "python" || existsSync(join(cwd, "pyproject.toml")) || existsSync(join(cwd, "requirements.txt"))) {
    return { command: "pytest", args: ["-q"], label: "pytest -q" };
  }
  return null;
}

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  spawnError: string | null;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(command, args, {
      cwd,
      shell: process.platform === "win32",
      env: process.env,
    });

    const timer = nodeSetTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > 64_000) stdout = stdout.slice(-32_000);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 64_000) stderr = stderr.slice(-32_000);
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      nodeClearTimeout(timer);
      resolve({
        exitCode: -1,
        stdout,
        stderr,
        timedOut: false,
        spawnError: err instanceof Error ? err.message : String(err),
      });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      nodeClearTimeout(timer);
      resolve({
        exitCode: typeof code === "number" ? code : -1,
        stdout,
        stderr,
        timedOut,
        spawnError: null,
      });
    });
  });
}

