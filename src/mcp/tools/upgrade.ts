import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  UpgradeModeToolInput,
  UpgradeModeToolOutput,
  HarnessMode,
  GeneratedFile,
} from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { defaultConfigForMode, loadHarnessConfig } from "../../core/config/loader.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string" },
    from: { type: "string", enum: ["solo", "small-team", "mid-team"] },
    to: { type: "string", enum: ["small-team", "mid-team", "org"] },
  },
  required: ["cwd", "to"],
} as const;

const ORDER: HarnessMode[] = ["solo", "small-team", "mid-team", "org"];

export function registerUpgradeTool(): ToolDefinition<
  UpgradeModeToolInput,
  UpgradeModeToolOutput
> {
  return {
    name: "harness_upgrade_mode",
    description:
      "Upgrade harness mode (solo → small-team → mid-team → org) with zero migration cost. Updates harness.config.json and generates additional files required by the new mode.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const current = loadHarnessConfig(input.cwd);
      const from: HarnessMode = input.from ?? current?.project.mode ?? "solo";
      const to = input.to;

      if (ORDER.indexOf(to) <= ORDER.indexOf(from)) {
        throw new Error(`Cannot downgrade from ${from} to ${to}.`);
      }

      const baseProject = current?.project ?? {
        name: "unknown",
        type: "backend-service" as const,
        stack: "other" as const,
        mode: from,
      };
      const newConfig = defaultConfigForMode(to, { ...baseProject, mode: to });
      const generated: GeneratedFile[] = [];

      const cfgPath = join(input.cwd, "harness.config.json");
      const cfgContent = JSON.stringify(newConfig, null, 2) + "\n";
      writeFileSync(cfgPath, cfgContent, "utf-8");
      generated.push({
        path: "harness.config.json",
        action: "updated",
        bytes: Buffer.byteLength(cfgContent, "utf-8"),
      });

      const tiers: HarnessMode[] = collectTiersBetween(from, to);
      for (const tier of tiers) {
        for (const f of incrementsForTier(tier, baseProject.name)) {
          const generatedFile = createIncrement(input.cwd, f);
          if (generatedFile) generated.push(generatedFile);
        }
      }

      const nextSteps: string[] = [
        `已从 ${from} 升档到 ${to}`,
        "重新运行 harness_check 校验新模式下的门禁",
      ];

      switch (to) {
        case "small-team":
          nextSteps.push(
            "已新增/确认 CHANGELOG.md 与 PR 模板；如已存在则保留原内容",
          );
          break;
        case "mid-team":
          nextSteps.push(
            "已新增 CODEOWNERS / oncall.md / SLO.md 骨架，请根据团队补全负责人和指标",
          );
          break;
        case "org":
          nextSteps.push(
            "已新增 DORA.md / RFC 流程占位 / SBOM 自动化说明；compliance/ 子目录留作合规附件",
          );
          break;
      }

      return { from, to, generated_files: generated, next_steps: nextSteps };
    },
  };
}

interface IncrementFile {
  path: string;
  body: string;
}

function collectTiersBetween(from: HarnessMode, to: HarnessMode): HarnessMode[] {
  const start = ORDER.indexOf(from);
  const end = ORDER.indexOf(to);
  return ORDER.slice(start + 1, end + 1);
}

function incrementsForTier(tier: HarnessMode, projectName: string): IncrementFile[] {
  switch (tier) {
    case "small-team":
      return [
        {
          path: "CHANGELOG.md",
          body: `# Changelog\n\n## [Unreleased]\n- ${new Date().toISOString().slice(0, 10)}: harness upgrade → small-team\n`,
        },
        {
          path: ".github/pull_request_template.md",
          body:
            "## 变更摘要\n\n## 影响范围\n\n## 测试证据\n\n## 风险与回滚\n\n## 检查清单\n- [ ] 单元测试通过\n- [ ] harness check 通过\n",
        },
      ];
    case "mid-team":
      return [
        {
          path: ".github/CODEOWNERS",
          body: `# CODEOWNERS for ${projectName}\n# 形如 \`path  @owner\`，行级覆盖。\n*       @platform-team\n/docs/  @docs-team\n`,
        },
        {
          path: "docs/oncall.md",
          body: `# On-call 轮值\n\n| 周次 | 主班 | 副班 | 备注 |\n|---|---|---|---|\n| W${currentIsoWeek()} |  |  | 升档自动生成 |\n`,
        },
        {
          path: "docs/SLO.md",
          body: `# Service Level Objectives · ${projectName}\n\n| 指标 | SLO 目标 | 错误预算 | 测量来源 |\n|---|---|---|---|\n| 可用率 | 99.5% | 0.5% | uptime monitor |\n| p95 延迟 | 200ms | — | tracing |\n`,
        },
      ];
    case "org":
      return [
        {
          path: "docs/DORA.md",
          body:
            "# DORA Metrics\n\n- Deployment frequency: weekly\n- Lead time for changes: < 1 day\n- Change failure rate: < 15%\n- MTTR: < 1 hour\n\n收集来源：CI/CD pipeline + incident tracker。\n",
        },
        {
          path: "docs/rfc/0000-template.md",
          body:
            "# RFC-XXXX: Title\n\n- Status: Draft\n- Author:\n- Reviewer:\n- Date:\n\n## Context\n\n## Proposal\n\n## Alternatives\n\n## Decision\n\n## Consequences\n",
        },
        {
          path: "docs/SBOM.md",
          body:
            "# Software Bill of Materials\n\n生成方式（任选其一）：\n\n- `npx @cyclonedx/cyclonedx-npm --output-file sbom.json`\n- `syft packages dir:. -o cyclonedx-json > sbom.json`\n\n建议在 release pipeline 中自动生成并归档到 release artifact。\n",
        },
        {
          path: "compliance/.gitkeep",
          body: "",
        },
      ];
    default:
      return [];
  }
}

function createIncrement(cwd: string, file: IncrementFile): GeneratedFile | null {
  const abs = join(cwd, file.path);
  if (existsSync(abs)) {
    return { path: file.path, action: "skipped", bytes: 0, reason: "already exists" };
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, file.body, "utf-8");
  return { path: file.path, action: "created", bytes: Buffer.byteLength(file.body, "utf-8") };
}

function currentIsoWeek(): string {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return String(week).padStart(2, "0");
}
