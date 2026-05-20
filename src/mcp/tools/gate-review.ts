import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { GateReviewToolInput, GateReviewToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";
import { assetsRoot } from "../../core/assets.js";
import { featureDirPath, gateReviewPath } from "../../core/paths.js";

const inputSchema = {
  type: "object",
  properties: {
    cwd: { type: "string" },
    feature_name: { type: "string" },
    action: { type: "string", enum: ["generate", "check"], default: "generate" },
  },
  required: ["cwd", "feature_name"],
} as const;

export function registerGateReviewTool(): ToolDefinition<
  GateReviewToolInput,
  GateReviewToolOutput
> {
  return {
    name: "harness_gate_review",
    description:
      "Generate or check 03_GATE_REVIEW.md for a feature. action=generate creates the review entry from the bundled 8-dimension template; action=check parses an existing file and returns BLOCKER list, conditional items, and pass/fail state.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const featureDir = join(input.cwd, featureDirPath(input.feature_name));
      const target = join(input.cwd, gateReviewPath(input.feature_name));
      const action = input.action ?? "generate";
      const filePathOut = toPortablePath(input.cwd, target);

      if (action === "generate") {
        mkdirSync(featureDir, { recursive: true });
        if (existsSync(target)) {
          return {
            status: "generated",
            file_path: filePathOut,
            blockers: ["existing file kept — append your sections instead of overwriting"],
          };
        }
        writeFileSync(target, renderGateReview(input.feature_name), "utf-8");
        return {
          status: "generated",
          file_path: filePathOut,
          blockers: [],
        };
      }

      if (!existsSync(target)) {
        return {
          status: "blocked",
          file_path: filePathOut,
          blockers: ["03_GATE_REVIEW.md 不存在，请先 action=generate"],
        };
      }
      const content = readFileSync(target, "utf-8");
      const analysis = analyzeGateReview(content);
      return {
        status: analysis.blockers.length > 0
          ? "blocked"
          : analysis.passedExplicitly
            ? "passed"
            : "blocked",
        file_path: filePathOut,
        blockers: analysis.blockers,
      };
    },
  };
}

function toPortablePath(cwd: string, abs: string): string {
  const rel = relative(cwd, abs) || abs;
  return rel.split(sep).join("/");
}

function renderGateReview(featureName: string): string {
  const templatePath = join(
    assetsRoot,
    "templates",
    "features",
    "_template",
    "03_GATE_REVIEW.md",
  );
  const today = new Date().toISOString().slice(0, 10);
  const base = existsSync(templatePath)
    ? readFileSync(templatePath, "utf-8")
    : EMBEDDED_GATE_REVIEW;

  return [
    `# 03 · Gate Review · ${featureName}`,
    "",
    `> Feature 名称：\`${featureName}\``,
    `> 创建日期：${today}`,
    "",
    base,
    "",
    "## Blockers",
    "",
    "> 列出所有 BLOCKER。任一项未解决禁止进入实现。",
    "- BLOCKER: (示例) 缺少回滚 SQL",
    "",
  ].join("\n");
}

interface GateReviewAnalysis {
  blockers: string[];
  conditionals: string[];
  passedExplicitly: boolean;
}

function analyzeGateReview(content: string): GateReviewAnalysis {
  const lines = content.split(/\r?\n/);
  const blockers: string[] = [];
  const conditionals: string[] = [];
  const blockerRe = /^\s*(?:[-*>]|\d+[.)]\s*)?(?:\[[ ]\]\s*)?[\s*]*\**BLOCKER\**\s*[:：]/i;
  const resolvedRe = /\[\s*[xX✓✔]\s*\]/;
  const conditionalRe = /^\s*(?:[-*>]|\d+[.)]\s*)?(?:\[[ ]\]\s*)?[\s*]*\**CONDITIONAL\**\s*[:：]/i;
  const stripRe = /^\s*(?:[-*>]|\d+[.)]\s*)?(?:\[[ ]\]\s*)?[\s*]*\**(?:BLOCKER|CONDITIONAL)\**\s*[:：]\s*/i;
  for (const line of lines) {
    if (resolvedRe.test(line)) continue;
    if (blockerRe.test(line)) {
      const text = line.replace(stripRe, "").trim();
      if (text && !text.startsWith("(示例)") && !/^B-\d+/.test(text)) {
        blockers.push(text);
      }
    } else if (conditionalRe.test(line)) {
      const text = line.replace(stripRe, "").trim();
      if (text && !text.startsWith("(示例)")) conditionals.push(text);
    }
  }

  const tableBlockers = parseStructuredBlockers(content);
  for (const b of tableBlockers) blockers.push(b);

  const passedExplicitly = /^[\s-]*\[\s*[xX✓✔]\s*\]\s*通过/m.test(content);

  return {
    blockers: dedupe(blockers),
    conditionals: dedupe(conditionals),
    passedExplicitly,
  };
}

function parseStructuredBlockers(content: string): string[] {
  const sectionMatch = content.match(/##\s*(?:\d+\.?\s*)?[^\n]*Blocker[^\n]*([\s\S]*?)(?=##|$)/i);
  if (!sectionMatch) return [];
  const section = sectionMatch[1] ?? "";
  const found: string[] = [];
  const tableRowRe = /^\|\s*B-\d+\s*\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*[^|]*\|\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = tableRowRe.exec(section))) {
    const desc = (m[1] ?? "").trim();
    if (desc && desc !== "…" && desc !== "..." && desc !== "...") {
      found.push(desc);
    }
  }
  return found;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const EMBEDDED_GATE_REVIEW = `# 03 Gate Review

> Fallback template used only when assets/templates/features/_template/03_GATE_REVIEW.md is missing.

## 2. 8 维度审查
| 维度 | 检查点 | 结论 |
| --- | --- | --- |
| 需求清晰度 | 目标 / 验收 / 边界是否明确 | PASS / WARN / FAIL |
| 数据安全 | 鉴权 / 权限 / 租户 / 敏感信息 | … |

## 3. 阻塞项（Blocker）
| 编号 | 描述 | 退回阶段 | 必改原因 |
| --- | --- | --- | --- |
| B-1 | … | 需求 / 方案 | … |

## 6. 评审结论
- [ ] 通过
- [ ] 有条件通过
- [ ] 不通过
`;
