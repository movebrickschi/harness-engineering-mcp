---
spec_id: harness-spec-glossary
applies_to: [solo, small-team, mid-team, org]
min_level: L1
---

# Glossary

> 本规范包内出现的术语速查表。

| 术语 | 含义 |
| --- | --- |
| Harness | 工程治理基座；本规范包定义其规则、模板、门禁。 |
| MVH | Minimum Viable Harness，最小生存核心，约 7 文件。 |
| SSOT | Single Source of Truth，单一事实源，避免规则散落多处。 |
| ADR | Architecture Decision Record，架构决策记录。 |
| RFC | Request for Comments，规范条目变更提案。 |
| DoD | Definition of Done，任务完成定义。 |
| Gate Review | 开发前的设计 / 风险评估关卡。 |
| Mode | 项目当前规模档位（solo / small-team / mid-team / org）。 |
| Maturity Level | 成熟度档（L1 起步 / L2 标准化 / L3 度量化 / L4 自适应）。 |
| Project Type | 项目类型（backend-service / library / cli / frontend-spa）。 |
| applies_to | frontmatter 字段，声明文件适用的 mode 集合。 |
| min_level | frontmatter 字段，声明文件最低适用成熟度。 |
| optional_for | frontmatter 字段，声明该 mode 下整篇可跳过。 |
| Project Memory | 项目级长期记忆，主要是 `docs/features/` + ADR + Post-mortem。 |
| Feature Brief | 一句话需求 mini-PRD。 |
| Feature Stages | 阶段文档（01_REQUIREMENT_ANALYSIS ... 06_TEST_REPORT）。 |
| Two Gates | 一句话需求两道门：清晰度门 + 影响风险门。 |
| Rollback Routing | 失败时退回的目标阶段路由表。 |
| Emergency Channel | 紧急通道，可跳过部分流程的快速通路。 |
| baseline | `verification_baseline.json`，质量基线。 |
| engineering-check | 本地门禁脚本，机械化扫描多组检查项。 |
| SemVer | Semantic Versioning，语义化版本号。 |
| CHANGELOG | 用户视角的版本变更日志。 |
| Feature Flag | 特性开关，与代码部署解耦的功能控制。 |
| Canary | 灰度发布观察期。 |
| SLI | Service Level Indicator，服务质量指标。 |
| SLO | Service Level Objective，服务质量目标（内部）。 |
| SLA | Service Level Agreement，服务等级协议（对客户）。 |
| Error Budget | 错误预算 = 1 - SLO，剩余即可承担的故障量。 |
| Runbook | 应急 / 操作手册，针对特定场景的处置指南。 |
| Post-mortem | 故障复盘，blameless 5 Whys。 |
| MTTR | Mean Time To Recovery，平均恢复时间。 |
| DORA | DevOps Research and Assessment 四指标。 |
| Lead Time | 提交到上线的耗时。 |
| Change Failure Rate | 部署后故障的比例。 |
| SCA | Software Composition Analysis，依赖漏洞扫描。 |
| SAST | Static Application Security Testing，静态应用安全测试。 |
| DAST | Dynamic Application Security Testing，动态应用安全测试。 |
| SBOM | Software Bill of Materials，软件物料清单。 |
| PII | Personally Identifiable Information，个人可识别信息。 |
| Data Classification | 数据分级（P0-P3）。 |
| Audit Log | 审计日志（who/what/when/from-where/result）。 |
| Trunk-based | 主干开发，短期 feature 分支 + 频繁合入 main。 |
| Conventional Commits | 约定式提交，`<type>(<scope>): <subject>` 格式。 |
| CODEOWNERS | 代码负责人映射文件，自动指派评审。 |
| Review SLA | 代码评审的响应 / 完成时长承诺。 |
| WIP Limit | 进行中任务上限，控制并行任务数。 |
| Onboarding 30/60/90 | 新人入职三阶段路径。 |
| Five Whys | 连问 5 次为什么以追到根因。 |
| AI Agent | 自动化编程代理（Cursor / Claude Code / Copilot 等）。 |
| Co-authored-by | git commit footer，标注共同作者（含 AI Agent）。 |
| Trace | 留痕，记录 Agent 操作的可追溯信息。 |
| Skill | `.cursor/skills/` 下的任务执行流程定义。 |
| Rule | `.cursor/rules/` 下的编码硬规范。 |
| harness.config.json | 项目级机器可读 Harness 配置。 |
| Stack Adapter | 各技术栈的适配指南，位于 STACK_ADAPTERS/。 |
| Antipattern | 反模式，应避免的做法。 |
