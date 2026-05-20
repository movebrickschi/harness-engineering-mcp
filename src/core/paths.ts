/**
 * Harness 工程目录布局 · 唯一真理源（Single Source of Truth）
 *
 * v0.2 起所有 harness 自身产物收拢到 `.harness/` 下，仅以下例外保留原位置：
 *   - `CHANGELOG.md`               npm / GitHub Release / changesets 等外部工具强约定
 *   - `.github/CODEOWNERS`         GitHub 平台读取约定
 *   - `.github/pull_request_template.md`  同上
 *   - `.gitignore` / `README.md`   仓库根目录通用约定
 *
 * 所有读写硬编码路径的模块（init/checker/gate-review/upgrade/loader）必须从本文件取常量，
 * 严禁出现裸字符串 "harness.config.json" / "docs/features" 等老路径。
 */

export const HARNESS_DIR = ".harness";

export const HARNESS_PATHS = {
  /** 主配置文件 · 旧路径：harness.config.json（项目根） */
  config: `${HARNESS_DIR}/config.json`,
  /** 验证基线 · 旧路径：verification_baseline.json（项目根） */
  baseline: `${HARNESS_DIR}/baseline.json`,
  /** 项目 SSOT 文档 · 旧路径：docs/engineering-harness.md */
  ssot: `${HARNESS_DIR}/engineering-harness.md`,

  /** ADR 目录 · 旧路径：docs/adr/ */
  adrDir: `${HARNESS_DIR}/adr`,
  /** 首个 ADR */
  adrBaseline: `${HARNESS_DIR}/adr/0001-engineering-harness-baseline.md`,

  /** Features 目录 · 旧路径：docs/features/ */
  featuresDir: `${HARNESS_DIR}/features`,
  /** Features 索引 */
  featuresIndex: `${HARNESS_DIR}/features/INDEX.md`,
  /** Features 阶段模板目录 */
  featuresTemplateDir: `${HARNESS_DIR}/features/_template`,

  /** 门禁脚本目录 · 旧路径：项目根 */
  scriptsDir: `${HARNESS_DIR}/scripts`,
  /** PowerShell 门禁入口 */
  checkPs1: `${HARNESS_DIR}/scripts/engineering-check.ps1`,
  /** Bash/sh 门禁入口 */
  checkSh: `${HARNESS_DIR}/scripts/engineering-check.sh`,

  /** mid-team 升档产物：On-call 轮值 */
  oncall: `${HARNESS_DIR}/oncall.md`,
  /** mid-team 升档产物：SLO */
  slo: `${HARNESS_DIR}/SLO.md`,

  /** org 升档产物：DORA 指标 */
  dora: `${HARNESS_DIR}/DORA.md`,
  /** org 升档产物：SBOM 说明 */
  sbom: `${HARNESS_DIR}/SBOM.md`,
  /** org 升档产物：RFC 模板目录 */
  rfcTemplate: `${HARNESS_DIR}/rfc/0000-template.md`,
  /** org 升档产物：合规附件目录占位 */
  complianceKeep: `${HARNESS_DIR}/compliance/.gitkeep`,
} as const;

/** 计算指定 feature 的目录相对路径。 */
export function featureDirPath(featureName: string): string {
  return `${HARNESS_DIR}/features/${featureName}`;
}

/** 计算指定 feature 的 Gate Review 文件相对路径。 */
export function gateReviewPath(featureName: string): string {
  return `${HARNESS_DIR}/features/${featureName}/03_GATE_REVIEW.md`;
}

/** Features 阶段模板的 7 个文件名（顺序固定，不要在这里乱排序）。 */
export const FEATURE_TEMPLATE_FILES = [
  "README.md",
  "01_REQUIREMENT_ANALYSIS.md",
  "02_SOLUTION_DESIGN.md",
  "03_GATE_REVIEW.md",
  "04_DEVELOPMENT.md",
  "05_CODE_REVIEW.md",
  "06_TEST_REPORT.md",
] as const;
