import type { RouteTaskToolInput, RouteTaskToolOutput, ForcedUpgrade, HarnessConfig } from "../../types/harness.js";
import { loadHarnessConfig } from "../config/loader.js";

interface IntentRule {
  intent:
    | "bugfix"
    | "refactor"
    | "perf"
    | "third-party"
    | "docs"
    | "brainstorm"
    | "feature";
  patterns: RegExp[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: "bugfix",
    patterns: [/bug/i, /错误|报错/i, /崩溃|crash/i, /500/i, /异常|exception/i, /不工作|not working/i, /failed?/i],
  },
  {
    intent: "refactor",
    patterns: [/重构|refactor/i, /整理|cleanup/i, /tech.?debt/i],
  },
  {
    intent: "perf",
    patterns: [/性能|perf/i, /慢|slow/i, /优化(?!.*性能)?|optimi[sz]e/i, /benchmark/i, /web.?vitals?/i],
  },
  {
    intent: "third-party",
    patterns: [/接入|集成|integrate/i, /对接/i, /SDK|API[\s_-]?key/i, /webhook/i, /OAuth|微信|支付宝|Stripe/i],
  },
  {
    intent: "docs" as IntentRule["intent"],
    patterns: [/文档|注释|comment|readme|说明|描述|changelog|备注/i],
  },
  {
    intent: "brainstorm" as IntentRule["intent"],
    patterns: [/想做|帮我想|是否值得|头脑风暴|brainstorm|idea|设计方案|怎么设计/i],
  },
];

const UPGRADE_KEYWORDS = [
  { regex: /数据库|DB|schema|表结构|数据表|建表|新增.*表|migration|flyway|liquibase/i, reason: "涉及数据库 schema 变更" },
  { regex: /鉴权|权限|auth|租户|多租户/i, reason: "涉及鉴权 / 多租户隔离" },
  { regex: /支付|订单|钱包|wallet|payment/i, reason: "涉及支付 / 订单 / 钱包" },
  { regex: /(>=?\s*8\s*h|超过\s*8\s*小时|大改|跨\s*\d+\s*模块)/i, reason: "估算工时 > 8h 或跨多模块" },
];

const M2_NO_DESIGN = /(没有设计稿|无设计稿|没有原型|无原型)/i;
const M1_HAS_DESIGN = /(带设计稿|有设计稿|figma|mockup|视觉稿)/i;
const M2_UI_HINT = /(UI|页面|列表|表单|按钮|样式|组件)/i;
const M3_AUTH = /(鉴权|权限|auth|多租户|租户|登录)/i;
const M4_DB = /(数据库|DB|schema|表结构|数据表|建表|新增.*表|migration|flyway|liquibase)/i;
const M5_INTEGRATION = /(只联调|联调|集成测试|对接联调|端到端联通)/i;

function detectModifiers(task: string): string[] {
  const tags = new Set<string>();

  const noDesign = M2_NO_DESIGN.test(task);
  if (noDesign) {
    tags.add("M2");
  } else if (M1_HAS_DESIGN.test(task)) {
    tags.add("M1");
  } else if (M2_UI_HINT.test(task)) {
    tags.add("M2");
  }

  if (M3_AUTH.test(task)) tags.add("M3");
  if (M4_DB.test(task)) tags.add("M4");
  if (M5_INTEGRATION.test(task)) tags.add("M5");

  return Array.from(tags);
}

export async function routeTask(input: RouteTaskToolInput): Promise<RouteTaskToolOutput> {
  const task = input.task.trim();
  const allIntents = classifyAllIntents(task);
  const intent = allIntents[0] ?? "feature";
  const modifiers = detectModifiers(task);
  let projectConfig: HarnessConfig | null = null;
  if (input.cwd) {
    try { projectConfig = loadHarnessConfig(input.cwd); } catch { /* ignore */ }
  }

  let forcedUpgrade: ForcedUpgrade | null = null;
  for (const kw of UPGRADE_KEYWORDS) {
    if (kw.regex.test(task)) {
      forcedUpgrade = { to: "dev-flow-doc-*", reason: kw.reason };
      break;
    }
  }

  const multiIntentHint = allIntents.length > 1
    ? `检测到多个意图: [${allIntents.join(", ")}]，当前按 ${intent} 路由。如需分开处理，请拆分任务`
    : null;

  const addMultiHint = (result: RouteTaskToolOutput): RouteTaskToolOutput => {
    if (multiIntentHint) result.efficiency_hints.unshift(multiIntentHint);
    return result;
  };

  switch (intent) {
    case "bugfix":
      return addMultiHint(buildResult("bugfix-flow", "Bug 修复", [
        "根因记录",
        "失败复现测试",
        "修复",
        "回归测试",
      ], null, modifiers, projectConfig));
    case "refactor":
      return addMultiHint(buildResult("refactor-flow", "重构", [
        "重构边界说明",
        "关键路径测试覆盖",
        "行为零变化证据",
      ], null, modifiers, projectConfig));
    case "perf":
      return addMultiHint(buildResult("perf-flow", "性能优化", [
        "benchmark 基线",
        "profile 证据",
        "单变量优化结果对比",
      ], null, modifiers, projectConfig));
    case "third-party":
      return addMultiHint(buildResult("third-party-flow", "第三方接入", [
        "Vendor 适配层",
        "密钥/Webhook 安全审计",
        "沙箱 + 失败重放剧本",
      ], null, modifiers, projectConfig));
    case "docs":
      return addMultiHint(buildResult("writing-plans", "文档任务", [
        "文档产出",
        "内容审校",
      ], null, modifiers, projectConfig));
    case "brainstorm":
      return addMultiHint(buildResult("brainstorming", "头脑风暴", [
        "设计文档",
        "方案对比表",
      ], null, modifiers, projectConfig));
    case "feature":
    default: {
      const scopeResult = input.context?.scope
        ? { scope: input.context.scope, fallback: false }
        : inferScope(task);
      const scope = scopeResult.scope;
      const hasPrd = input.context?.has_prd === true;
      const hasProto = input.context?.has_prototype === true;

      if (hasProto) {
        const skill =
          scope === "frontend"
            ? "dev-flow-proto-fe"
            : scope === "backend"
              ? "dev-flow-proto-be"
              : "dev-flow-full";
        return addMultiHint(buildResult(skill, "原型项目", ["MINI_PRD", "对照差异表", "切片验证"], forcedUpgrade, modifiers, projectConfig));
      }
      if (hasPrd) {
        const skill =
          scope === "frontend"
            ? "dev-flow-doc-fe"
            : scope === "backend"
              ? "dev-flow-doc-be"
              : "dev-flow-doc-full";
        return addMultiHint(buildResult(
          skill,
          "完整 PRD",
          ["阶段文档 01-06", "Gate Review", "Code Review", "测试报告"],
          forcedUpgrade,
          modifiers,
          projectConfig,
        ));
      }
      const skill =
        scope === "frontend"
          ? "dev-flow-oneliner-fe"
          : scope === "backend"
            ? "dev-flow-oneliner-be"
            : "dev-flow-oneliner-full";
      const oneliner = buildResult(
        skill,
        "一句话需求",
        ["MINI_PRD", "IMPACT_ANALYSIS", "API_CONTRACT(if needed)"],
        forcedUpgrade,
        modifiers,
        projectConfig,
      );
      if (forcedUpgrade) {
        oneliner.forced_upgrade = {
          to: skill.replace("oneliner", "doc"),
          reason: forcedUpgrade.reason,
        };
      }
      if (scopeResult.fallback) {
        oneliner.efficiency_hints.unshift(
          "开发范围未明确推断，建议手动指定 context.scope 参数以获得更精准的路由",
        );
      }
      return addMultiHint(oneliner);
    }
  }
}

function classifyAllIntents(task: string): IntentRule["intent"][] {
  const hits: IntentRule["intent"][] = [];
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(task))) hits.push(rule.intent);
  }
  return hits.length > 0 ? hits : ["feature"];
}

interface ScopeResult {
  scope: "frontend" | "backend" | "full-stack";
  /** true 表示是兜底推断（前后端词都没命中） */
  fallback: boolean;
}

function inferScope(task: string): ScopeResult {
  const feHints = /(前端|页面|列表|表单|按钮|UI|样式|交互|组件|路由)/i;
  const beHints = /(后端|接口|API|查询|字段|service|controller|mapper|SQL|缓存)/i;
  const hasFe = feHints.test(task);
  const hasBe = beHints.test(task);
  if (hasFe && hasBe) return { scope: "full-stack", fallback: false };
  if (hasFe) return { scope: "frontend", fallback: false };
  if (hasBe) return { scope: "backend", fallback: false };
  return { scope: "full-stack", fallback: true };
}

function buildResult(
  skill: string,
  weight: string,
  deliverables: string[],
  forcedUpgrade: ForcedUpgrade | null = null,
  modifiers: string[] = [],
  config?: HarnessConfig | null,
): RouteTaskToolOutput {
  return {
    skill,
    skill_uri: `harness://skills/${skill}`,
    weight,
    deliverables,
    forced_upgrade: forcedUpgrade,
    suggested_next_tools: ["harness_load_skill", "harness_check"],
    modifiers,
    efficiency_hints: efficiencyHintsFor(skill, modifiers, forcedUpgrade, config),
  };
}

function efficiencyHintsFor(
  skill: string,
  modifiers: string[],
  forcedUpgrade: ForcedUpgrade | null,
  config?: HarnessConfig | null,
): string[] {
  const hints: string[] = [];
  hints.push(
    "spec/rule 走 harness:// URI 引用，不要复制粘贴到 prompt 里（保持 prompt cache 命中）",
  );

  if (skill.startsWith("bugfix")) {
    hints.push("根因优先：先 Grep 复现路径，禁止 mock 掉断言或盲打补丁");
    hints.push("只跑被影响的测试子集（--runRelatedTests / -pl module / 单文件 pytest）");
  } else if (skill.startsWith("refactor")) {
    hints.push("先 Grep 找全部调用点（≤ 20 行结果），再分批 StrReplace，每步绿测");
    hints.push("禁止一次 Write 重写多个文件；按语义单元拆 ≥ N 次原子改动");
  } else if (skill.startsWith("perf")) {
    hints.push("先 benchmark 立基线，单变量优化，每改一次跑一次微基准，不要凭感觉");
  } else if (skill.startsWith("third-party")) {
    hints.push("强制 Vendor 适配层：业务层禁直接调 SDK；沙箱跑通后再切真实");
  } else if (skill.startsWith("dev-flow-doc") || skill.startsWith("dev-flow-full")) {
    hints.push("≥ 3 步任务必先 writing-plans 出明文计划，禁止边想边改 10 轮往返");
    hints.push("文件检索 ≥ 3 个时委派 subagent，主会话只保留摘要");
  } else if (skill.startsWith("dev-flow-oneliner")) {
    hints.push("小需求不要拉重型流程：直接 StrReplace + ReadLints + 子集测试");
  }

  if (modifiers.includes("M4")) {
    hints.push("DB schema 变更：先出迁移脚本 + 回滚 SQL，再写代码，禁止跳过 ADR");
  }
  if (modifiers.includes("M3")) {
    hints.push("鉴权变更走 Gate Review 强校验，必须人审");
  }
  if (forcedUpgrade) {
    hints.push(`强制升级到 ${forcedUpgrade.to}：保留完整 PRD + 阶段文档，禁止偷工省略`);
  }

  if (config) {
    const cov = config.modules?.quality?.coverage_baseline;
    if (typeof cov === "number" && cov > 0)
      hints.push(`本项目覆盖率底线 ${(cov * 100).toFixed(0)}%，新代码必须被测试覆盖`);
    const maxLines = config.modules?.people?.pr_max_lines;
    const maxFiles = config.modules?.people?.pr_max_files;
    if (maxLines || maxFiles) {
      const parts: string[] = [];
      if (maxLines) parts.push(`${maxLines} 行`);
      if (maxFiles) parts.push(`${maxFiles} 文件`);
      hints.push(`PR 大小限制 ${parts.join(" / ")}，超限需拆分`);
    }
    const reviewSla = config.modules?.people?.review_sla_hours;
    if (typeof reviewSla === "number")
      hints.push(`Code Review SLA ${reviewSla} 小时，提交后尽早@reviewer`);
  }

  hints.push("回复 < 2000 字符，表格优于散文，独立工具调用一次性批发");
  return hints.slice(0, 6);
}
