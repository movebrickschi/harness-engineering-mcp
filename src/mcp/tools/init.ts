import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  InitToolInput,
  InitToolOutput,
  AskUserItem,
  GeneratedFile,
  HarnessMode,
} from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { scanProject } from "../../core/scanner/index.js";
import { defaultConfigForMode } from "../../core/config/loader.js";
import { readAsset } from "../../core/assets.js";
import { renderTemplate } from "../../core/renderer/handlebars.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string", description: "Absolute project root path" },
    mode: { type: "string", enum: ["solo", "small-team", "mid-team", "org"] },
    stack: {
      type: "string",
      enum: ["java-spring", "node-typescript", "python", "go", "other"],
    },
    project_type: {
      type: "string",
      enum: ["backend-service", "library", "cli", "frontend-spa"],
    },
    project_name: { type: "string" },
    ide: {
      type: "string",
      enum: ["cursor", "claude-code", "codex", "windsurf", "cline", "auto"],
      default: "auto",
    },
    maturity_target: { type: "string", enum: ["L1", "L2", "L3", "L4"], default: "L1" },
    compliance: {
      type: "array",
      items: { enum: ["gdpr", "pipl", "iso27001", "soc2", "hipaa"] },
    },
    dry_run: { type: "boolean", default: false },
  },
  required: ["cwd"],
} as const;

export function registerInitTool(): ToolDefinition<InitToolInput, InitToolOutput> {
  return {
    name: "harness_init",
    description:
      "Initialize Engineering Harness in a project. Scans project files (pom.xml, package.json, requirements.txt, Cargo.toml, go.mod) and git history to pre-fill stack/type/mode. Missing fields are returned via ask_user list so the AI can question the user before re-invoking with full args.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const detected = await scanProject({ cwd: input.cwd });

      const ask: AskUserItem[] = [];
      const stack = input.stack ?? detected.stack ?? undefined;
      const projectType = input.project_type ?? detected.project_type ?? undefined;
      const projectName = input.project_name ?? detected.project_name ?? undefined;
      const mode = input.mode ?? detected.mode_suggestion;

      if (!stack)
        ask.push({
          field: "stack",
          question: "项目使用的技术栈？",
          options: ["java-spring", "node-typescript", "python", "go", "other"],
        });
      if (!projectType)
        ask.push({
          field: "project_type",
          question: "项目类型？",
          options: ["backend-service", "library", "cli", "frontend-spa"],
        });
      if (!projectName)
        ask.push({ field: "project_name", question: "项目名称（建议英文短横线连写）？" });
      if (!input.mode)
        ask.push({
          field: "mode",
          question: `团队规模？（扫描建议: ${detected.mode_suggestion}）`,
          options: ["solo", "small-team", "mid-team", "org"],
          default: detected.mode_suggestion,
        });

      if (ask.length > 0) {
        return {
          status: "needs_input",
          detected,
          ask_user: ask,
          generated_files: [],
          next_steps: ["将 ask_user 中的字段补齐后重新调用 harness_init"],
        };
      }

      const generated = await generateProjectFiles({
        cwd: input.cwd,
        mode: mode as HarnessMode,
        stack: stack!,
        project_type: projectType!,
        project_name: projectName!,
        maturity_target: input.maturity_target ?? "L1",
        compliance: input.compliance ?? [],
        dry_run: input.dry_run === true,
      });

      return {
        status: input.dry_run ? "dry_run" : "completed",
        detected,
        ask_user: [],
        generated_files: generated,
        next_steps: [
          "运行 harness_check 跑首次门禁",
          "查看 docs/engineering-harness.md 熟悉项目 SSOT",
          "如团队规模发生变化可运行 harness_upgrade_mode 升档",
        ],
      };
    },
  };
}

async function generateProjectFiles(args: {
  cwd: string;
  mode: HarnessMode;
  stack: NonNullable<InitToolInput["stack"]>;
  project_type: NonNullable<InitToolInput["project_type"]>;
  project_name: string;
  maturity_target: NonNullable<InitToolInput["maturity_target"]>;
  compliance: NonNullable<InitToolInput["compliance"]>;
  dry_run: boolean;
}): Promise<GeneratedFile[]> {
  const config = defaultConfigForMode(args.mode, {
    name: args.project_name,
    type: args.project_type,
    stack: args.stack,
    mode: args.mode,
    maturity_target: args.maturity_target,
  });
  config.$schema = "harness://config/schema";
  if (args.compliance.length > 0) {
    config.modules.security = {
      ...config.modules.security,
      compliance: args.compliance,
    };
  }

  const files: GeneratedFile[] = [];
  const templateData = {
    ...args,
    date: new Date().toISOString().slice(0, 10),
  };

  files.push(
    writeOrPlan(
      args.cwd,
      "harness.config.json",
      JSON.stringify(config, null, 2) + "\n",
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "verification_baseline.json",
      JSON.stringify(
        {
          version: "1.0",
          created_at: existingBaselineCreatedAt(args.cwd) ?? new Date().toISOString(),
          mode: args.mode,
          stack: args.stack,
          tests: { class_count: 0, method_count: 0 },
          coverage: { baseline: 0.0, hard_gate: false },
          checks: { count: 11 },
        },
        null,
        2,
      ) + "\n",
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "engineering-check.ps1",
      await renderAssetTemplate("templates/entry/engineering-check.ps1.hbs", templateData),
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "engineering-check.sh",
      await renderAssetTemplate("templates/entry/engineering-check.sh.hbs", templateData),
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "docs/engineering-harness.md",
      await renderAssetTemplate("templates/entry/engineering-harness.md.hbs", templateData),
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "docs/adr/0001-engineering-harness-baseline.md",
      await renderAssetTemplate("templates/adr/0001-engineering-harness-baseline.md.hbs", templateData),
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "docs/features/INDEX.md",
      renderFeaturesIndex(args),
      args.dry_run,
    ),
  );

  for (const rel of [
    "README.md",
    "01_REQUIREMENT_ANALYSIS.md",
    "02_SOLUTION_DESIGN.md",
    "03_GATE_REVIEW.md",
    "04_DEVELOPMENT.md",
    "05_CODE_REVIEW.md",
    "06_TEST_REPORT.md",
  ]) {
    files.push(
      writeOrPlan(
        args.cwd,
        `docs/features/_template/${rel}`,
        await readAsset(`templates/features/_template/${rel}`),
        args.dry_run,
      ),
    );
  }

  files.push(
    writeOrPlan(
      args.cwd,
      ".github/pull_request_template.md",
      await readAsset("templates/pr/pull_request_template.md"),
      args.dry_run,
    ),
  );
  return files;
}

function existingBaselineCreatedAt(cwd: string): string | null {
  const baselinePath = join(cwd, "verification_baseline.json");
  if (!existsSync(baselinePath)) return null;
  try {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf-8")) as { created_at?: unknown };
    return typeof baseline.created_at === "string" ? baseline.created_at : null;
  } catch {
    return null;
  }
}

async function renderAssetTemplate(
  assetPath: string,
  data: Record<string, unknown>,
): Promise<string> {
  return renderTemplate(await readAsset(assetPath), data);
}

function writeOrPlan(
  cwd: string,
  rel: string,
  content: string,
  dryRun: boolean,
): GeneratedFile {
  const abs = join(cwd, rel);
  const bytes = Buffer.byteLength(content, "utf-8");
  if (dryRun) {
    return { path: rel, action: "skipped", bytes, reason: "dry_run" };
  }
  if (existsSync(abs)) {
    const current = readFileSync(abs, "utf-8");
    if (current === content) {
      return { path: rel, action: "skipped", bytes, reason: "unchanged" };
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, "utf-8");
    return { path: rel, action: "updated", bytes };
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf-8");
  return { path: rel, action: "created", bytes };
}

function renderFeaturesIndex(args: { project_name: string }): string {
  return `# Features Index · ${args.project_name}

> 项目任务看板（按时间倒序）。每条任务对应 \`docs/features/<feature>/\` 子目录。

| 时间 | Feature | 类型 | 状态 | 负责人 | 路径 |
|---|---|---|---|---|---|
| - | - | - | - | - | - |

## 阶段文档模板
- \`01_REQUIREMENT_ANALYSIS.md\` 需求分析
- \`02_SOLUTION_DESIGN.md\` 方案设计
- \`03_GATE_REVIEW.md\` 开发前闸门评估（仅中大型需求）
- \`04_DEVELOPMENT.md\` 实现记录
- \`05_CODE_REVIEW.md\` 审查结论
- \`06_TEST_REPORT.md\` 测试报告

通过 \`harness_gate_review\` 自动生成 Gate Review 入口。
`;
}
