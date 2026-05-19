/**
 * Shared TypeScript types for Engineering Harness configuration and runtime.
 * Mirrors assets/spec/harness.config.schema.json. Treat this file as the
 * authoritative TS contract surface for both MCP tools and CLI commands.
 */

export type HarnessMode = "solo" | "small-team" | "mid-team" | "org";

export type HarnessStack =
  | "java-spring"
  | "node-typescript"
  | "python"
  | "go"
  | "other";

export type HarnessProjectType =
  | "backend-service"
  | "library"
  | "cli"
  | "frontend-spa";

export type MaturityLevel = "L1" | "L2" | "L3" | "L4";

export type SupportedIde =
  | "cursor"
  | "claude-code"
  | "codex"
  | "windsurf"
  | "cline"
  | "auto";

export type CheckStatus = "PASS" | "WARN" | "FAIL";

export type CheckLevel = "pass" | "warn" | "fail";

export type ComplianceTag = "gdpr" | "pipl" | "iso27001" | "soc2" | "hipaa";

export interface HarnessProjectConfig {
  name: string;
  type: HarnessProjectType;
  stack: HarnessStack;
  mode: HarnessMode;
  team_size?: "1" | "2-4" | "5-15" | "16-30" | "30+";
  maturity_target?: MaturityLevel;
}

export interface HarnessModulesConfig {
  people?: {
    branch_strategy?: "trunk" | "git-flow" | "github-flow";
    pr_max_lines?: number;
    pr_max_files?: number;
    review_sla_hours?: number;
    codeowners_enabled?: boolean;
    oncall_enabled?: boolean;
  };
  process?: {
    gate_review_enabled?: boolean;
    rollback_routing_enabled?: boolean;
    emergency_channel_enabled?: boolean;
  };
  quality?: {
    coverage_baseline?: number;
    coverage_hard_gate?: boolean;
    perf_p95_ms?: number;
    perf_lcp_ms?: number;
    bundle_size_kb?: number;
    local_check_max_seconds?: number;
  };
  release?: {
    semver?: boolean;
    changelog?: boolean;
    feature_flags?: boolean;
    slo_enabled?: boolean;
    rollback_runbook_required?: boolean;
  };
  security?: {
    secret_scan?: boolean;
    sca_on_pr?: boolean;
    sbom_required?: boolean;
    data_classification_enabled?: boolean;
    audit_log_required?: boolean;
    compliance?: ComplianceTag[];
  };
  knowledge?: {
    adr_required_for?: string[];
    feature_board?: boolean;
    onboarding_path?: boolean;
    post_mortem_required?: boolean;
  };
}

export interface HarnessAiAgentConfig {
  enabled?: boolean;
  auto_commit_max_lines?: number;
  auto_change_files_limit?: number;
  require_human_review_for?: string[];
  trace_required?: boolean;
}

export interface HarnessDoraConfig {
  track?: boolean;
  dashboard_path?: string;
  metrics?: Array<
    "deployment_frequency" | "lead_time" | "change_failure_rate" | "mttr"
  >;
}

export interface HarnessChecksConfig {
  [checkId: string]: {
    enabled?: boolean;
    level?: CheckLevel;
  };
}

export interface HarnessConfig {
  $schema?: string;
  version: string;
  project: HarnessProjectConfig;
  modules: HarnessModulesConfig;
  ai_agent?: HarnessAiAgentConfig;
  dora?: HarnessDoraConfig;
  checks?: HarnessChecksConfig;
}

// ───────────────────────────────────────────────────────────────
// Tool input / output types
// ───────────────────────────────────────────────────────────────

export interface InitToolInput {
  cwd: string;
  mode?: HarnessMode;
  stack?: HarnessStack;
  project_type?: HarnessProjectType;
  project_name?: string;
  ide?: SupportedIde;
  maturity_target?: MaturityLevel;
  compliance?: ComplianceTag[];
  dry_run?: boolean;
}

export interface DetectionEvidence {
  source: string;
  signal: string;
  weight: number;
}

export interface InitDetected {
  stack: HarnessStack | null;
  project_type: HarnessProjectType | null;
  mode_suggestion: HarnessMode;
  project_name: string | null;
  evidence: DetectionEvidence[];
  confidence: number;
}

export interface AskUserItem {
  field: string;
  question: string;
  options?: string[];
  default?: string;
}

export interface GeneratedFile {
  path: string;
  action: "created" | "updated" | "skipped";
  bytes: number;
  reason?: string;
}

export interface InitToolOutput {
  status: "ready" | "needs_input" | "completed" | "dry_run";
  detected: InitDetected;
  ask_user: AskUserItem[];
  generated_files: GeneratedFile[];
  next_steps: string[];
}

export interface CheckToolInput {
  cwd: string;
  categories?: Array<
    "config" | "structure" | "tests" | "secrets" | "baseline" | "docs" | "all"
  >;
  strict?: boolean;
  output_format?: "summary" | "detailed" | "json";
}

export interface CheckResult {
  category: string;
  check_id: string;
  status: CheckStatus;
  message: string;
  suggestion?: string;
  file?: string;
  line?: number;
}

export interface BaselineDiff {
  added_tests?: number;
  removed_tests?: number;
  coverage_change?: string;
}

export interface CheckToolOutput {
  status: CheckStatus;
  summary: { pass: number; warn: number; fail: number; total: number };
  results: CheckResult[];
  baseline_diff?: BaselineDiff;
  elapsed_ms: number;
}

export interface RouteTaskToolInput {
  task: string;
  cwd?: string;
  context?: {
    scope?: "frontend" | "backend" | "full-stack";
    has_prd?: boolean;
    has_prototype?: boolean;
  };
}

export interface ForcedUpgrade {
  to: string;
  reason: string;
}

export interface RouteTaskToolOutput {
  skill: string;
  skill_uri: string;
  weight: string;
  deliverables: string[];
  forced_upgrade: ForcedUpgrade | null;
  suggested_next_tools: string[];
}

export interface LoadSkillToolInput {
  name: string;
}

export interface LoadSkillToolOutput {
  name: string;
  version: string;
  content: string;
  depends_on: string[];
  related: string[];
}

export interface GateReviewToolInput {
  cwd: string;
  feature_name: string;
  action?: "generate" | "check";
}

export interface GateReviewToolOutput {
  status: "generated" | "passed" | "blocked";
  file_path: string;
  blockers: string[];
}

export interface UpgradeModeToolInput {
  cwd: string;
  from?: HarnessMode;
  to: HarnessMode;
}

export interface UpgradeModeToolOutput {
  from: HarnessMode;
  to: HarnessMode;
  generated_files: GeneratedFile[];
  next_steps: string[];
}
