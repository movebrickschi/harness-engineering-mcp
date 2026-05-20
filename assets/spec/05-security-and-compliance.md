---
spec_id: harness-spec-05-security
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# 05 Security & Compliance

> 依赖漏洞扫描、密钥管理、数据分级、审计日志、第三方合规。
>
> solo 模式必读 §1（密钥管理） + §2（依赖最低线）。其余按合规要求启用。

---

## 1. 密钥管理 [solo+]

### 1.1 红线

- 任何 `accessKey` / `secretKey` / `password` / `token` / 私钥 / `.env` 禁止入库
- `engineering-check` 默认扫描 30+ 类正则模式（覆盖 AWS / GCP / Azure / 阿里云 / GitHub Token / Slack Webhook 等）

### 1.2 推荐方案

| 项目阶段 | 方案 |
| --- | --- |
| solo / small-team | 环境变量 + `.env`（仅本地，不入库） |
| mid-team | 配置中心（Nacos / Consul / Spring Cloud Config）+ 环境变量 |
| org | Vault / 云 KMS + 自动轮换 |

### 1.3 入库 Hook [small-team+]

- pre-commit：扫描 staged 文件
- pre-push：扫描整个分支增量
- CI：扫描 PR 全量改动 + 历史

### 1.4 误入库后的处置

发现入库 -> 立刻：
1. 撤销 / 轮换该密钥（不只是删 commit）
2. 用 `git filter-repo` 或 `bfg` 清除历史
3. force-push（必须经评审 + 通知）
4. 必出 ADR 记录事故 + Action Items

---

## 2. 依赖管理 [solo+]

参考 [`templates/security/dependency-policy.md.tmpl`](templates/security/dependency-policy.md.tmpl)。

### 2.1 SCA（Software Composition Analysis）

| Mode | 扫描节奏 |
| --- | --- |
| solo | 每次发版前手动跑一次 |
| small-team | 每 PR + 周报 |
| mid-team+ | 每 PR + 每天定时 + Critical 漏洞自动建 issue |

### 2.2 漏洞响应 SLA

| 严重度 | 修复 SLA |
| --- | --- |
| Critical | 24 小时 |
| High | 7 天 |
| Medium | 30 天 |
| Low | 季度修 |

### 2.3 依赖升级节奏 [mid-team+]

- 每周 / 每两周由机器人（dependabot / renovate）发起 PR
- 主版本升级（major bump）必出 ADR
- 锁定版本（lockfile）必入库

### 2.4 SBOM [org-only]

- 每次发版生成 SBOM（CycloneDX / SPDX 格式）
- 归档至少保留 1 年
- 与 SCA 工具联动，方便定向定位漏洞影响

---

## 3. 数据分级 [mid-team+] [compliance-driven]

参考 [`templates/security/data-classification.md.tmpl`](templates/security/data-classification.md.tmpl)。

### 3.1 4 档分级

| 档 | 含义 | 例 | 必做 |
| --- | --- | --- | --- |
| P0 公开 | 可公开访问 | 营销页 / 公开 API 文档 | 无特殊 |
| P1 内部 | 仅团队 / 业务方 | 内部数据看板 | 鉴权 |
| P2 敏感 | PII / 业务核心 | 用户姓名 / 手机号 / 订单 | 鉴权 + 访问审计 + 静态加密 |
| P3 高敏 | 强合规 | 身份证 / 银行卡 / 健康数据 | 上述 + 字段级加密 + 严格脱敏 + 严格审计 |

### 3.2 数据流落点

每条数据流（采集 -> 传输 -> 存储 -> 计算 -> 展示）都要标注最高分级，按最高档执行控制。

### 3.3 项目类型差异 [project_types]

| 项目类型 | 是否必做 |
| --- | --- |
| Backend Service | 必做（业务承载） |
| Frontend SPA | 必做（PII 展示） |
| Library/SDK | 不适用（除非处理 P2/P3） |
| CLI | 视场景 |

---

## 4. 审计日志 [mid-team+] [compliance-driven]

参考 [`templates/security/audit-log-policy.md.tmpl`](templates/security/audit-log-policy.md.tmpl)。

### 4.1 必记录字段

| 字段 | 含义 |
| --- | --- |
| who | 操作者 ID + 类型（用户 / 系统 / Agent） |
| what | 操作类型 + 资源 ID |
| when | UTC 时间戳 + 时区 |
| from-where | 来源 IP + UA |
| result | 成功 / 失败 + 错误码 |
| context | 关键业务字段（订单号 / 租户 ID） |

### 4.2 不记录

- 密码 / Token 明文
- P3 数据明文
- 整请求体 / 整响应体（除非合规要求）

### 4.3 存储与查询

- 独立存储（不与业务库混）
- 至少保留 6 个月（合规要求可拉长到 2-7 年）
- 必须支持按用户 / 时间 / 操作类型查询

---

## 5. 输入校验 / 输出转义 [solo+]

### 5.1 输入校验

- 所有外部输入（API / 表单 / 文件 / 队列消息）必须校验
- 校验失败返回明确错误 + 不泄漏内部信息
- 不允许"先存再说"

### 5.2 输出转义

- HTML / JS / SQL / 命令行 / 文件路径，按目标场景转义
- 模板引擎默认开启自动转义
- 反例：`String sql = "SELECT * FROM users WHERE id = " + id;`

---

## 6. 鉴权 / 授权 [small-team+]

| 层 | 关注点 |
| --- | --- |
| 身份认证 | 登录方式 / Token 有效期 / 刷新机制 |
| 授权 | RBAC / ABAC / 资源级权限 |
| 多租户 | 租户隔离 / 跨租户访问审计 |
| API | 公开 / 鉴权 / 内部三档明示 |

### 6.1 反模式

- 客户端控制权限（仅前端隐藏按钮）
- Token 无过期 / 无刷新机制
- 跨租户查询无显式校验

---

## 7. 第三方依赖 [mid-team+]

参考 [`02-process-and-governance.md`](02-process-and-governance.md) §3 ADR。引入第三方时必出 ADR，包含：

- 替代方案对比
- 失败 / 降级策略
- 密钥 / Webhook 安全
- 沙箱测试结果
- 卸载成本

---

## 8. 合规框架 [org-only] [compliance-driven]

按业务覆盖区域 / 行业选择：

| 框架 | 适用 |
| --- | --- |
| GDPR | 欧盟用户 |
| 个人信息保护法 (PIPL) | 中国大陆用户 |
| CCPA | 加州用户 |
| HIPAA | 美国医疗 |
| PCI-DSS | 支付卡 |
| ISO 27001 | 通用信息安全 |
| SOC 2 | SaaS 服务 |

`.harness/config.json.modules.security.compliance` 字段声明启用的框架，CI 据此启停对应检查。

---

## 9. 安全演练 [mid-team+]

- 每季度 1 次：密钥泄漏 / 数据库丢失 / 服务被攻陷三选一
- 演练后 ≤ 1 周出 Action Items + Owner + 截止日期

---

## 10. 与其他模块的关系

- 紧急通道下安全检查不可跳过 -> [`02-process-and-governance.md`](02-process-and-governance.md) §7
- Code Review 安全维度 -> [`03-quality-and-testing.md`](03-quality-and-testing.md) §3.2
- 第三方依赖 ADR -> [`06-knowledge-and-memory.md`](06-knowledge-and-memory.md)
- AI Agent 改密钥必须人审 -> [`AI_AGENT_CONTRACT.md`](AI_AGENT_CONTRACT.md)
