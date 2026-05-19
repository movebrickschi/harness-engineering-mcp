import type { RouteTaskToolInput, RouteTaskToolOutput, ForcedUpgrade } from "../../types/harness.js";

interface IntentRule {
  intent:
    | "bugfix"
    | "refactor"
    | "perf"
    | "third-party"
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
];

const UPGRADE_KEYWORDS = [
  { regex: /数据库|DB|schema|表结构|数据表|建表|新增.*表|migration|flyway|liquibase/i, reason: "涉及数据库 schema 变更" },
  { regex: /鉴权|权限|auth|租户|多租户/i, reason: "涉及鉴权 / 多租户隔离" },
  { regex: /支付|订单|钱包|wallet|payment/i, reason: "涉及支付 / 订单 / 钱包" },
  { regex: /(>=?\s*8\s*h|超过\s*8\s*小时|大改|跨\s*\d+\s*模块)/i, reason: "估算工时 > 8h 或跨多模块" },
];

export async function routeTask(input: RouteTaskToolInput): Promise<RouteTaskToolOutput> {
  const task = input.task.trim();
  const intent = classifyIntent(task);

  let forcedUpgrade: ForcedUpgrade | null = null;
  for (const kw of UPGRADE_KEYWORDS) {
    if (kw.regex.test(task)) {
      forcedUpgrade = { to: "dev-flow-doc-*", reason: kw.reason };
      break;
    }
  }

  switch (intent) {
    case "bugfix":
      return buildResult("bugfix-flow", "Bug 修复", [
        "根因记录",
        "失败复现测试",
        "修复",
        "回归测试",
      ]);
    case "refactor":
      return buildResult("refactor-flow", "重构", [
        "重构边界说明",
        "关键路径测试覆盖",
        "行为零变化证据",
      ]);
    case "perf":
      return buildResult("perf-flow", "性能优化", [
        "benchmark 基线",
        "profile 证据",
        "单变量优化结果对比",
      ]);
    case "third-party":
      return buildResult("third-party-flow", "第三方接入", [
        "Vendor 适配层",
        "密钥/Webhook 安全审计",
        "沙箱 + 失败重放剧本",
      ]);
    case "feature":
    default: {
      const scope = input.context?.scope ?? inferScope(task);
      const hasPrd = input.context?.has_prd === true;
      const hasProto = input.context?.has_prototype === true;

      if (hasProto) {
        const skill =
          scope === "frontend"
            ? "dev-flow-proto-fe"
            : scope === "backend"
              ? "dev-flow-proto-be"
              : "dev-flow-full";
        return buildResult(skill, "原型项目", ["MINI_PRD", "对照差异表", "切片验证"], forcedUpgrade);
      }
      if (hasPrd) {
        const skill =
          scope === "frontend"
            ? "dev-flow-doc-fe"
            : scope === "backend"
              ? "dev-flow-doc-be"
              : "dev-flow-doc-full";
        return buildResult(
          skill,
          "完整 PRD",
          ["阶段文档 01-06", "Gate Review", "Code Review", "测试报告"],
          forcedUpgrade,
        );
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
      );
      if (forcedUpgrade) {
        oneliner.forced_upgrade = {
          to: skill.replace("oneliner", "doc"),
          reason: forcedUpgrade.reason,
        };
      }
      return oneliner;
    }
  }
}

function classifyIntent(task: string): IntentRule["intent"] {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(task))) return rule.intent;
  }
  return "feature";
}

function inferScope(task: string): "frontend" | "backend" | "full-stack" {
  const feHints = /(前端|页面|列表|表单|按钮|UI|样式|交互|组件|路由)/i;
  const beHints = /(后端|接口|API|查询|字段|service|controller|mapper|SQL|缓存)/i;
  const hasFe = feHints.test(task);
  const hasBe = beHints.test(task);
  if (hasFe && hasBe) return "full-stack";
  if (hasFe) return "frontend";
  if (hasBe) return "backend";
  return "full-stack";
}

function buildResult(
  skill: string,
  weight: string,
  deliverables: string[],
  forcedUpgrade: ForcedUpgrade | null = null,
): RouteTaskToolOutput {
  return {
    skill,
    skill_uri: `harness://skills/${skill}`,
    weight,
    deliverables,
    forced_upgrade: forcedUpgrade,
    suggested_next_tools: ["harness_load_skill", "harness_check"],
  };
}
