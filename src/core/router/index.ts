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
  const intent = classifyIntent(task);
  const modifiers = detectModifiers(task);

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
      ], null, modifiers);
    case "refactor":
      return buildResult("refactor-flow", "重构", [
        "重构边界说明",
        "关键路径测试覆盖",
        "行为零变化证据",
      ], null, modifiers);
    case "perf":
      return buildResult("perf-flow", "性能优化", [
        "benchmark 基线",
        "profile 证据",
        "单变量优化结果对比",
      ], null, modifiers);
    case "third-party":
      return buildResult("third-party-flow", "第三方接入", [
        "Vendor 适配层",
        "密钥/Webhook 安全审计",
        "沙箱 + 失败重放剧本",
      ], null, modifiers);
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
        return buildResult(skill, "原型项目", ["MINI_PRD", "对照差异表", "切片验证"], forcedUpgrade, modifiers);
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
          modifiers,
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
        modifiers,
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
  modifiers: string[] = [],
): RouteTaskToolOutput {
  return {
    skill,
    skill_uri: `harness://skills/${skill}`,
    weight,
    deliverables,
    forced_upgrade: forcedUpgrade,
    suggested_next_tools: ["harness_load_skill", "harness_check"],
    modifiers,
    efficiency_hints: efficiencyHintsFor(skill, modifiers, forcedUpgrade),
  };
}

function efficiencyHintsFor(
  skill: string,
  modifiers: string[],
  forcedUpgrade: ForcedUpgrade | null,
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

  hints.push("回复 < 2000 字符，表格优于散文，独立工具调用一次性批发");
  return hints.slice(0, 6);
}
