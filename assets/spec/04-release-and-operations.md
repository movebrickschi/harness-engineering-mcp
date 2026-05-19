---
spec_id: harness-spec-04-release
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# 04 Release & Operations

> SemVer、CHANGELOG、灰度、回滚、Feature Flag、SLO/SLA/SLI、Runbook。
>
> solo 模式：仅看 §1（SemVer）+ §2（CHANGELOG）即可；其余按需启用。

---

## 1. SemVer [small-team+]

### 1.1 版本号格式

```
MAJOR.MINOR.PATCH[-pre.N][+build]
```

| 段 | 触发条件 |
| --- | --- |
| MAJOR | 不向后兼容的 API / 行为变更 |
| MINOR | 新增功能但向后兼容 |
| PATCH | Bug 修复（不改 API） |
| pre | alpha / beta / rc |
| build | CI 元数据 |

### 1.2 0.x 阶段特例

- 0.x.x 视为前向兼容性"软"承诺，但每次 minor 仍应文档化破坏性变更
- 进入 1.0.0 之后严格遵守 SemVer

### 1.3 项目类型差异 [project_types]

| 项目类型 | 必做程度 |
| --- | --- |
| Library/SDK | 必做（外部消费者依赖） |
| CLI | 必做 |
| Backend Service | 视消费者；纯内部可宽松 |
| Frontend SPA | 部署即发布，可仅记 build 号 |

---

## 2. CHANGELOG [small-team+]

### 2.1 格式：Keep a Changelog

参考 [`templates/release/CHANGELOG.md.tmpl`](templates/release/CHANGELOG.md.tmpl)：

```markdown
# Changelog

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.2.0] - 2026-01-15

### Added
- ...
```

### 2.2 强制规则

- 每次发版必更新 `[Unreleased]` -> 新版本
- CI 校验 CHANGELOG 在版本变化时被改动
- BREAKING CHANGE 必出现在 `Removed` 或显式 "BREAKING:" 前缀

### 2.3 用户视角写法

CHANGELOG 是给 **使用者 / 消费者** 看的，不是给开发者看的：
- 反例："refactor user service"
- 正例："修复用户登录后偶发的 401，提升登录稳定性"

---

## 3. 灰度发布 [mid-team+]

### 3.1 灰度策略选型

| 策略 | 适用 |
| --- | --- |
| 比例灰度 | 1% -> 5% -> 25% -> 100% |
| 按租户 / 用户白名单 | B2B / 内部用户先行 |
| 按地域 / 机房 | 多机房部署 |
| 按特性开关（见 §5） | 与代码部署解耦 |

### 3.2 灰度门禁

每一阶段升档前确认：
- 错误率没飙升（对比基线）
- 关键 SLI 没退化
- 无新增告警
- 业务方未反馈异常

### 3.3 失败响应

任一不满足 -> 立刻回滚或暂停灰度。

---

## 4. 回滚 [mid-team+]

参考 [`templates/release/rollback-runbook.md.tmpl`](templates/release/rollback-runbook.md.tmpl)。

### 4.1 必备字段

- 触发条件（什么数据 / 哪个指标突破 -> 回滚）
- 操作步骤（具体命令 / 控制台操作）
- 数据恢复（如有 schema 变更，迁移如何反向）
- 沟通模板（用户 / 内部 / 媒体三档）
- 演练记录（至少每季度演练 1 次）

### 4.2 回滚反模式

- "我们没回滚过应该不需要演练"
- "回滚 SQL 写在了某个 PR 里"（必须独立成文档归档）
- "重要变更上线时无 oncall"

---

## 5. Feature Flag [mid-team+]

参考 [`templates/release/feature-flags-policy.md.tmpl`](templates/release/feature-flags-policy.md.tmpl)。

### 5.1 用途分类

| 类型 | 生命周期 | 责任 |
| --- | --- | --- |
| Release flag | 1-4 周（功能开关） | 产品 + 开发 |
| Experiment flag | 1-3 个月（A/B 实验） | 数据 + 产品 |
| Ops flag | 长期（应急降级） | SRE + 开发 |
| Permission flag | 长期（按用户类型） | 业务 |

### 5.2 墓地规则

- Release / Experiment flag 必须设置过期日期
- 过期日期到 -> 发起清理 PR
- 长期未清理的视为技术债，季度复盘必检

### 5.3 工具选型

不绑定厂商。可选：LaunchDarkly / Unleash / 自建配置中心。在 [`STACK_ADAPTERS/`](STACK_ADAPTERS/) 各栈中给出推荐。

---

## 6. SLO / SLA / SLI [mid-team+] [project_types: backend-service, frontend-spa]

参考 [`templates/release/slo-template.md`](templates/release/slo-template.md)。

### 6.1 三个核心 SLI

每个对外服务必须声明 ≥ 3 项：

| SLI | 定义 | 例 |
| --- | --- | --- |
| 可用性 | 成功请求 / 总请求 | ≥ 99.9% / 月 |
| 延迟 | P95 / P99 | P95 ≤ 500ms |
| 错误率 | 5xx / 总请求 | ≤ 0.1% |

### 6.2 SLO 与 SLA 的差异

- SLO 是内部目标
- SLA 是与客户签订的承诺，违反有补偿条款
- SLO 通常严于 SLA

### 6.3 错误预算

```
错误预算 = (1 - SLO) × 时间窗口
```

错误预算耗尽 -> 暂停新功能上线，专注稳定性。

### 6.4 [L3+] 自动度量

L3+ 必须自动采集 SLI 并以 dashboard 呈现。

---

## 7. Runbook [mid-team+] [project_types: backend-service, frontend-spa]

### 7.1 必备 Runbook

- 启动 / 重启服务
- 回滚（参考 §4）
- 数据恢复
- 性能问题排查
- 常见告警的处置

### 7.2 格式

每篇 Runbook 含：
- 触发条件（哪个告警 / 哪种现象）
- 排查步骤（命令 / 链接 / 责任人）
- 处置动作
- 升级路径
- 事后跟进

---

## 8. 发布检查清单 [small-team+]

参考 [`templates/release/release-checklist.md`](templates/release/release-checklist.md)。发布前依次确认：

- [ ] CI 已通过
- [ ] 数据库迁移在测试环境验证完成
- [ ] 回滚方案已文档化（mid-team+）
- [ ] 配置 / 环境变量已就位
- [ ] API 变更已通知调用方（含 Swagger / OpenAPI）
- [ ] 监控 / 告警已覆盖（mid-team+）
- [ ] 灰度方案已明确（mid-team+）
- [ ] On-call 已就位（mid-team+）
- [ ] 发布后用 canary 做线上健康检查
- [ ] 结果归档到对应 feature 目录

---

## 9. 部署节奏与频率 [mid-team+]

| 团队规模 | 推荐节奏 |
| --- | --- |
| 5-15 人 / 单产品 | 每天 1 次（trunk-based + CD） |
| 15-30 人 / 单产品 | 每天多次 |
| 30+ 人 / 多产品 | 多产品独立部署，统一编排 |

DORA 部署频率指标参考 [`DORA.md`](DORA.md)。

---

## 10. 与其他模块的关系

- 紧急发布 -> [`02-process-and-governance.md`](02-process-and-governance.md) §7
- 性能预算与门禁 -> [`03-quality-and-testing.md`](03-quality-and-testing.md) §2
- 发布安全审计 -> [`05-security-and-compliance.md`](05-security-and-compliance.md)
- Post-mortem 与回滚 -> [`06-knowledge-and-memory.md`](06-knowledge-and-memory.md)
