import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { HarnessConfig } from "../../types/harness.js";
import { HARNESS_PATHS } from "../paths.js";

export function loadHarnessConfig(cwd: string): HarnessConfig | null {
  const cfgPath = join(cwd, HARNESS_PATHS.config);
  if (!existsSync(cfgPath)) return null;
  try {
    return JSON.parse(readFileSync(cfgPath, "utf-8")) as HarnessConfig;
  } catch (err) {
    throw new Error(
      `Failed to parse ${HARNESS_PATHS.config}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function defaultConfigForMode(
  mode: HarnessConfig["project"]["mode"],
  baseProject: HarnessConfig["project"],
): HarnessConfig {
  const base: HarnessConfig = {
    version: "1.0",
    project: { ...baseProject, mode },
    modules: {},
  };
  switch (mode) {
    case "solo":
      base.modules = {
        people: { branch_strategy: "trunk", pr_max_lines: 400 },
        process: { gate_review_enabled: false, emergency_channel_enabled: true },
        quality: { coverage_baseline: 0.0, local_check_max_seconds: 5 },
        release: { semver: false, changelog: false },
        security: { secret_scan: true, sca_on_pr: false },
        knowledge: { feature_board: true, adr_required_for: ["架构变更"] },
      };
      break;
    case "small-team":
      base.modules = {
        people: {
          branch_strategy: "github-flow",
          pr_max_lines: 400,
          pr_max_files: 20,
          review_sla_hours: 24,
        },
        process: { gate_review_enabled: false, rollback_routing_enabled: true },
        quality: { coverage_baseline: 0.4, local_check_max_seconds: 5 },
        release: { semver: true, changelog: true },
        security: { secret_scan: true, sca_on_pr: true },
        knowledge: { feature_board: true, post_mortem_required: false },
      };
      break;
    case "mid-team":
      base.modules = {
        people: {
          branch_strategy: "github-flow",
          pr_max_lines: 600,
          pr_max_files: 25,
          review_sla_hours: 12,
          codeowners_enabled: true,
          oncall_enabled: true,
        },
        process: {
          gate_review_enabled: true,
          rollback_routing_enabled: true,
          emergency_channel_enabled: true,
        },
        quality: { coverage_baseline: 0.6, coverage_hard_gate: true },
        release: {
          semver: true,
          changelog: true,
          feature_flags: true,
          slo_enabled: true,
          rollback_runbook_required: true,
        },
        security: {
          secret_scan: true,
          sca_on_pr: true,
          sbom_required: false,
          data_classification_enabled: true,
        },
        knowledge: {
          feature_board: true,
          onboarding_path: true,
          post_mortem_required: true,
          adr_required_for: ["架构变更", "DB 表设计", "第三方依赖引入"],
        },
      };
      break;
    case "org":
      base.modules = {
        people: {
          branch_strategy: "github-flow",
          pr_max_lines: 800,
          pr_max_files: 30,
          review_sla_hours: 8,
          codeowners_enabled: true,
          oncall_enabled: true,
        },
        process: {
          gate_review_enabled: true,
          rollback_routing_enabled: true,
          emergency_channel_enabled: true,
        },
        quality: {
          coverage_baseline: 0.75,
          coverage_hard_gate: true,
        },
        release: {
          semver: true,
          changelog: true,
          feature_flags: true,
          slo_enabled: true,
          rollback_runbook_required: true,
        },
        security: {
          secret_scan: true,
          sca_on_pr: true,
          sbom_required: true,
          data_classification_enabled: true,
          audit_log_required: true,
        },
        knowledge: {
          feature_board: true,
          onboarding_path: true,
          post_mortem_required: true,
          adr_required_for: [
            "架构变更",
            "DB 表设计",
            "第三方依赖引入",
            "破坏性 API 变更",
            "数据合规调整",
          ],
        },
      };
      base.dora = {
        track: true,
        metrics: ["deployment_frequency", "lead_time", "change_failure_rate", "mttr"],
      };
      break;
  }
  base.ai_agent = {
    enabled: true,
    auto_commit_max_lines: 50,
    auto_change_files_limit: 1,
    require_human_review_for: ["api_change", "db_migration", "security", "secret"],
    trace_required: true,
  };
  return base;
}
