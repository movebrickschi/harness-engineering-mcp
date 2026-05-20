---
spec_id: harness-spec-antipatterns
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# Antipatterns - 红线与反模式

> 横切 6 模块的常见反模式集合。每条给「典型表现 / 危害 / 替代做法 / 触发的 Harness 机制」。

---

## 1. 流程类

### 1.1 我先合了再补文档

- **典型表现**：PR 描述空 / 无 ADR / features INDEX 不更新
- **危害**：3 个月后没人记得为什么这样改 / 新人无法 onboard
- **替代**：合入前完成 DoD（[02 §6](02-process-and-governance.md)）
- **触发机制**：PR 模板硬字段 + `engineering-check` 检查 INDEX 更新

### 1.2 紧急通道当成日常路径

- **典型表现**：每周都有"紧急修复" / 每个迭代 hotfix 数 > 正常 PR 数
- **危害**：流程失效 / 质量塌方 / 信任流失
- **替代**：限定真生产事故才走；mid-team+ 严格审批
- **触发机制**：紧急通道使用率纳入季度复盘（[02 §7](02-process-and-governance.md)）

### 1.3 PR 1500 行让我快速过一下

- **典型表现**：单 PR > 800 行 / > 20 文件 / 跨多模块
- **危害**：评审失效 / 隐藏缺陷 / 回滚成本高
- **替代**：拆 PR；机器自动生成代码 / 重命名重构在描述显式说明
- **触发机制**：PR 大小硬上限（[01 §3.2](01-people-and-collaboration.md)）

---

## 2. 测试类

### 2.1 测试可以下个迭代写

- **典型表现**：合代码时一句"测试 follow-up"
- **危害**：永远 follow-up / Bug 概率提升
- **替代**：DoD 强制要求测试 / 失败先写测试再写修复
- **触发机制**：DoD（[02 §6](02-process-and-governance.md)）+ baseline 测试数量门禁

### 2.2 测试覆盖 mock 而非真实行为

- **典型表现**：测试只验证 mock 调用次数与参数
- **危害**：mock 与真实分离 / 重构后测试仍过但行为已变
- **替代**：尽量集成测试 / 用真实依赖（H2 / Testcontainers）
- **触发机制**：Code Review 可测性维度（[03 §3.4](03-quality-and-testing.md)）

### 2.3 注释失败测试

- **典型表现**：`@Disabled` / `@Skip` / `xit` 没有 follow-up issue
- **危害**：失去防线
- **替代**：必须关联 issue + 截止日期；超期 FAIL
- **触发机制**：`engineering-check` 扫描 skip 标记

---

## 3. 安全类

### 3.1 密钥就在 application.yml 里方便调试

- **典型表现**：`accessKey: AKIA...` 直接入库
- **危害**：泄漏后整个云账号被劫持
- **替代**：环境变量 / 配置中心 / Vault
- **触发机制**：`engineering-check` 密钥扫描（[05 §1](05-security-and-compliance.md)）

### 3.2 客户端控制权限

- **典型表现**：前端隐藏按钮 / 不下发后端校验
- **危害**：直接调 API 即可绕过
- **替代**：服务端鉴权 + 资源级权限 + 审计日志
- **触发机制**：Code Review 安全维度

### 3.3 删 commit 等于删密钥

- **典型表现**：发现密钥入库 -> 删 commit -> 觉得没事
- **危害**：git 历史还在 / 已被爬虫抓
- **替代**：先轮换密钥 -> 再清理历史 -> force-push（评审）
- **触发机制**：[05 §1.4](05-security-and-compliance.md)

---

## 4. 发布类

### 4.1 回滚？我们没回滚过应该不用写

- **典型表现**：无 rollback Runbook / 无演练
- **危害**：真出事故时手足无措 / 数据无法恢复
- **替代**：每次大版本发版前演练 1 次
- **触发机制**：mid-team+ 必须有 rollback-runbook（[04 §4](04-release-and-operations.md)）

### 4.2 Feature Flag 永不清理

- **典型表现**：3 年前的 flag 还在 `if (FLAG_X)` 分支里
- **危害**：代码僵化 / 维护成本高
- **替代**：每个 release/experiment flag 必须有过期日期
- **触发机制**：季度 flag 墓地复盘（[04 §5.2](04-release-and-operations.md)）

### 4.3 SemVer 0.x 永不进入 1.0

- **典型表现**：用 0.x 当成"我们在演进，不必兼容"借口
- **危害**：消费者永远在适配
- **替代**：明确进入 1.0 的标准 + 时间表
- **触发机制**：季度复盘

---

## 5. 知识沉淀类

### 5.1 ADR 太重了，我口头同步过了

- **典型表现**：架构改动无 ADR / 第三方依赖引入无记录
- **危害**：历史无法追溯 / 新人无法理解 / 决策反复
- **替代**：[06 §1.1](06-knowledge-and-memory.md) 触发条件强制写 ADR
- **触发机制**：Gate Review 检查 ADR 是否齐全

### 5.2 Post-mortem 写完就归档

- **典型表现**：Action Items 没人跟进 / 没截止日期
- **危害**：同样事故反复
- **替代**：每周 stand-up 检查 Action Items / 季度复盘汇总
- **触发机制**：[06 §4.4](06-knowledge-and-memory.md)

### 5.3 onboarding 文档 6 个月没更新

- **典型表现**：新人按文档安装环境失败
- **危害**：新人 30 天达成率低 / 团队信誉受损
- **替代**：每位新人入职后 30 天回填文档 errata
- **触发机制**：onboarding 30/60/90 验收清单

---

## 6. AI Agent 类

### 6.1 Agent 写的代码我直接合了

- **典型表现**：未读改动 / 未跑测试 / 无人审
- **危害**：失去最后一道防线 / 隐藏缺陷
- **替代**：按 [`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md) 边界矩阵
- **触发机制**：PR 模板 AI 协作硬字段

### 6.2 Agent 在紧急通道下 Auto 改生产代码

- **典型表现**：oncall 让 Agent 自动 hotfix
- **危害**：事故放大 / 责任不清
- **替代**：紧急通道严禁 Agent Auto；只能 Suggest
- **触发机制**：[`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md) §3 边界矩阵

### 6.3 用 lint-disable 绕过规则

- **典型表现**：`// eslint-disable` / `@SuppressWarnings` 没说原因
- **危害**：等于关闭工具
- **替代**：必须注释说明 + 关联 issue + 季度审计
- **触发机制**：`engineering-check` 扫描禁用注释（[05 §10](05-security-and-compliance.md)）

---

## 7. 规模 / 治理类

### 7.1 小项目套大流程

- **典型表现**：solo 项目硬上 SLO / DORA / Onboarding
- **危害**：仪式感 > 实效 / 疲劳放弃
- **替代**：mode=solo + 仅 MVH（[`MVH.md`](MVH.md)）
- **触发机制**：mode 字段驱动文档与门禁

### 7.2 跳级升档

- **典型表现**：solo 直接套 mid-team / mid-team 一次升 L4
- **危害**：基础不牢 / 工具不到位 / 团队疲劳
- **替代**：渐进升档（[`MATURITY_LEVELS.md`](MATURITY_LEVELS.md) §7）
- **触发机制**：升档前评估当前模块得分

### 7.3 升档时全部一次启用

- **典型表现**：solo -> mid-team 一次启 15 文件
- **危害**：团队接受度低 / 文档形同虚设
- **替代**：分批 2-4 周渐进
- **触发机制**：BOOTSTRAP 段落分批

### 7.4 不写 mode 字段

- **典型表现**：`.harness/config.json` 缺 mode
- **危害**：工具不知该用哪套规则
- **替代**：默认按 mid-team 处理；CI WARN
- **触发机制**：schema 校验 + `engineering-check`

### 7.5 规范条目永不修订

- **典型表现**：3 年前的规则没人改
- **危害**：与现状脱节 / 被持续绕过
- **替代**：[`DEPRECATION_PATH.md`](DEPRECATION_PATH.md) RFC + 季度复盘
- **触发机制**：DEPRECATION_PATH

---

## 8. 速查表

| 反模式 | 触发模块 |
| --- | --- |
| 先合再补文档 | 02 |
| 紧急通道当日常 | 02 |
| PR 1500 行 | 01 |
| 测试 follow-up | 03 |
| mock 测试 | 03 |
| skip 测试 | 03 |
| 密钥入库 | 05 |
| 客户端权限 | 05 |
| 无 rollback 演练 | 04 |
| Flag 永不清 | 04 |
| 0.x 永不 1.0 | 04 |
| ADR 口头 | 06 |
| Post-mortem 不跟进 | 06 |
| 文档过期 | 06 |
| Agent 直接合 | AI Agent |
| 紧急通道 Agent Auto | AI Agent |
| lint-disable 滥用 | 05 / AI Agent |
| 小项目套大流程 | 规模 |
| 跳级升档 | 规模 |
| 一次升档 | 规模 |
| 缺 mode 字段 | 规模 |
| 规则永不修订 | DEPRECATION |
