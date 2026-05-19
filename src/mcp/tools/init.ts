import { mkdirSync, writeFileSync } from "node:fs";
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
  dry_run: boolean;
}): Promise<GeneratedFile[]> {
  const config = defaultConfigForMode(args.mode, {
    name: args.project_name,
    type: args.project_type,
    stack: args.stack,
    mode: args.mode,
  });

  const files: GeneratedFile[] = [];

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
          created_at: new Date().toISOString(),
          mode: args.mode,
          stack: args.stack,
          tests: { class_count: 0, method_count: 0 },
          coverage: { baseline: 0.0, hard_gate: false },
          checks: { count: 7 },
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
      "docs/engineering-harness.md",
      renderSsotMd(args),
      args.dry_run,
    ),
  );
  files.push(
    writeOrPlan(
      args.cwd,
      "docs/adr/0001-engineering-harness-baseline.md",
      renderAdrBaseline(args),
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
  return files;
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
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf-8");
  return { path: rel, action: "created", bytes };
}

function renderSsotMd(args: {
  project_name: string;
  mode: HarnessMode;
  stack: string;
}): string {
  return `# Engineering Harness · ${args.project_name}

> 项目内 SSOT 入口。完整规范见 MCP 资源 \`harness://spec/${args.mode}\`。
>
> Mode: \`${args.mode}\` · Stack: \`${args.stack}\` · Harness Version: \`0.1.0\`

## 1. 任务路由
任何新任务先调用 MCP 工具 \`harness_route_task({task: "..."})\`，按返回的 skill 执行。

## 2. 本地门禁
提交前调用 \`harness_check\`，必须 PASS（strict 模式 WARN 也算 FAIL）。

## 3. 任务记忆
所有需求与 Bug 进入 \`docs/features/INDEX.md\` 并建立对应阶段文档目录。

## 4. ADR
架构变更、DB 表设计、第三方依赖引入必须配 ADR，存放在 \`docs/adr/\`。

## 5. 升档零迁移
团队规模成长后运行 \`harness_upgrade_mode({to: "small-team" | "mid-team" | "org"})\`，自动补齐增量文件。
`;
}

function renderAdrBaseline(args: { project_name: string; mode: HarnessMode }): string {
  return `# ADR 0001 · Engineering Harness Baseline

- **Date**: ${new Date().toISOString().slice(0, 10)}
- **Status**: Accepted

## Context
项目 \`${args.project_name}\` 接入 Engineering Harness（mode=${args.mode}）以建立从需求到发布的工程治理基线。

## Decision
- 采用 Harness Engineering MCP 作为工程治理基座
- 配置文件 \`harness.config.json\` 作为机器可读契约
- 任务通过 \`harness_route_task\` 路由到对应 skill
- 提交前必须 \`harness_check\` PASS

## Consequences
- 所有规范、skill、模板通过 MCP 资源实时供给，无需复制
- 升档（solo→small-team→mid-team→org）零迁移成本
- 与现有 IDE（Cursor / Claude Code / Codex）互不冲突
`;
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
