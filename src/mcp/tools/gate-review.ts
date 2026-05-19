import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { GateReviewToolInput, GateReviewToolOutput } from "../../types/harness.js";
import type { ToolDefinition } from "../../types/mcp.js";

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
      "Generate or check 03_GATE_REVIEW.md for a feature. action=generate creates the review entry; action=check parses an existing file and returns blockers + pass/fail state.",
    inputSchema: inputSchema as unknown as Record<string, unknown>,
    handler: async (input) => {
      const featureDir = join(input.cwd, "docs/features", input.feature_name);
      const target = join(featureDir, "03_GATE_REVIEW.md");
      const action = input.action ?? "generate";

      if (action === "generate") {
        mkdirSync(featureDir, { recursive: true });
        if (existsSync(target)) {
          return {
            status: "generated",
            file_path: target.replace(input.cwd + "\\", "").replace(input.cwd + "/", ""),
            blockers: ["existing file kept — append your sections instead of overwriting"],
          };
        }
        writeFileSync(target, renderGateReview(input.feature_name), "utf-8");
        return {
          status: "generated",
          file_path: target.replace(input.cwd + "\\", "").replace(input.cwd + "/", ""),
          blockers: [],
        };
      }

      if (!existsSync(target)) {
        return {
          status: "blocked",
          file_path: target.replace(input.cwd + "\\", "").replace(input.cwd + "/", ""),
          blockers: ["03_GATE_REVIEW.md 不存在，请先 action=generate"],
        };
      }
      const content = readFileSync(target, "utf-8");
      const blockers = extractBlockers(content);
      return {
        status: blockers.length === 0 ? "passed" : "blocked",
        file_path: target.replace(input.cwd + "\\", "").replace(input.cwd + "/", ""),
        blockers,
      };
    },
  };
}

function renderGateReview(featureName: string): string {
  return `# 03 · Gate Review · ${featureName}

> 开发前闸门评估。所有 BLOCKER 标记的事项必须解决后才能进入实现。

## 1. 评审输入清单
- [ ] 需求分析 (\`01_REQUIREMENT_ANALYSIS.md\`) 已完成
- [ ] 方案设计 (\`02_SOLUTION_DESIGN.md\`) 已完成
- [ ] API 契约 (如适用) 已定义
- [ ] DB 方案 (如适用) 已定义
- [ ] 影响分析 (\`IMPACT_ANALYSIS.md\`) 已完成

## 2. 评审维度

| 维度 | 评估 | 备注 |
|---|---|---|
| 范围明确 | ☐ Pass / ☐ Warn / ☐ Block | |
| 验收清晰 | ☐ Pass / ☐ Warn / ☐ Block | |
| 测试可达 | ☐ Pass / ☐ Warn / ☐ Block | |
| 性能可控 | ☐ Pass / ☐ Warn / ☐ Block | |
| 安全合规 | ☐ Pass / ☐ Warn / ☐ Block | |
| 回滚预案 | ☐ Pass / ☐ Warn / ☐ Block | |

## 3. Blockers

> 列出所有阻塞项。任一项未解决禁止进入实现。

- BLOCKER: (示例) 缺少回滚 SQL

## 4. 结论
☐ 通过  ☐ 有条件通过  ☐ 不通过

## 5. 评审签字
- 评审人:
- 日期:
`;
}

function extractBlockers(content: string): string[] {
  const lines = content.split(/\r?\n/);
  return lines
    .filter((l) => /^\s*[-*]\s*BLOCKER:/i.test(l))
    .map((l) => l.replace(/^\s*[-*]\s*BLOCKER:\s*/i, "").trim())
    .filter((s) => !s.startsWith("(示例)"));
}
