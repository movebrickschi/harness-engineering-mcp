---
spec_id: harness-spec-project-types
applies_to: [solo, small-team, mid-team, org]
min_level: L2
project_types: [backend-service, library, cli, frontend-spa]
---

# Project Types

> 4 类项目的剪裁矩阵。说明同一条规则在不同项目类型下的差异。

## 1. 4 类项目定义

| 类型 | 特征 | 典型例 |
| --- | --- | --- |
| Backend Service | 长期运行 / 提供 API / 有 SLA / 有数据库 | Web API、微服务、网关 |
| Library/SDK | 被其他项目依赖 / 有版本号 / 不直接运行 | 内部 SDK、开源 npm 包 |
| CLI | 命令行工具 / 有版本号 / 可单次运行 | git、kubectl、自研构建工具 |
| Frontend SPA | 浏览器运行 / 单页应用 / 部署即发布 | React/Vue 应用 |

## 2. 剪裁矩阵

### 2.1 People & Collaboration

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| 分支策略 | trunk 推荐 | trunk 或 git-flow（多版本维护） | 同 Library | trunk |
| Conventional Commits | 必做 | 必做 | 必做 | 必做 |
| PR 大小约束 | 必做 | 必做 | 必做 | 必做 |
| CODEOWNERS | mid-team+ | mid-team+ | mid-team+ | mid-team+ |
| On-call 轮值 | 必做 | 不适用 | 不适用 | 必做 |

### 2.2 Process & Governance

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| 流程分级 | 必做 | 必做 | 必做 | 必做 |
| Gate Review | 必做 | 必做（API 变更） | 必做（命令变更） | 必做 |
| DoD | 必做 | 必做 | 必做 | 必做 |
| 紧急通道 | 必做 | 限版本回退 | 限版本回退 | 必做 |

### 2.3 Quality & Testing

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| 单元测试 | ≥ 70% | ≥ 80% | ≥ 70% | ≥ 60% |
| 集成测试 | 必做 | 必做（多版本兼容性矩阵） | 必做（多 OS / Shell） | 视情况 |
| E2E | 视前端 | 一般不适用 | 必做（命令端到端） | 必做（浏览器） |
| 契约测试 | 推荐 | 强烈推荐（消费者驱动） | 不适用 | 视后端 |
| 性能预算 | API P95/P99 | 启动时间 / API 调用耗时 | 启动时间 / 命令耗时 | LCP / CLS / 包体积 |

### 2.4 Release & Operations

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| SemVer | 视消费者 | 必做 | 必做 | 视情况 |
| CHANGELOG | 视情况 | 必做 | 必做 | 视情况 |
| 灰度 | 必做 | 不适用（版本号即灰度） | 不适用 | 必做 |
| 回滚 Runbook | 必做 | 版本回退 | 版本回退 | 必做 |
| Feature Flag | 强烈推荐 | 不适用 | 不适用 | 必做 |
| SLO/SLA | 必做 | 不适用 | 不适用 | 必做（前端可用性） |
| 兼容性矩阵 | 不适用 | 必做（语言/依赖范围） | 必做（OS/Shell） | 必做（浏览器版本/Node） |
| 包体积预算 | 不适用 | 必做 | 必做 | 必做 |

### 2.5 Security & Compliance

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| 密钥扫描 | 必做 | 必做 | 必做 | 必做 |
| SCA | 必做 | 必做 | 必做 | 必做 |
| SBOM | mid-team+ | 强烈推荐（外部消费者） | 推荐 | mid-team+ |
| 数据分级 | 必做 | 不适用 | 视场景 | 必做（PII） |
| 审计日志 | 必做（业务） | 不适用 | 不适用 | 必做（用户行为） |
| 输入校验 / 输出转义 | 必做 | 必做（外部输入） | 必做（参数解析） | 必做 |

### 2.6 Knowledge & Memory

| 条目 | Backend Service | Library | CLI | Frontend SPA |
| --- | --- | --- | --- | --- |
| ADR | 必做 | 必做 | 必做 | 必做 |
| features 任务板 | 必做 | 必做 | 必做 | 必做 |
| Onboarding 30/60/90 | small-team+ | small-team+ | small-team+ | small-team+ |
| Post-mortem 文化 | 必做 | 视情况 | 视情况 | 必做 |
| 公开 API 文档 | 推荐（OpenAPI） | 必做（API 参考） | 必做（--help） | 不适用 |

## 3. 项目类型 × 团队规模二维矩阵

每条规则同时受 mode 与 project type 约束。例：

| 条目 | solo / Library | solo / Backend | mid-team / Library | mid-team / Backend |
| --- | --- | --- | --- | --- |
| SemVer | 必做（外部消费者） | 视消费者 | 必做 | 视消费者 |
| SLO | 不适用 | 视用户 | 不适用 | 必做 |
| Onboarding | 不适用 | 不适用 | 必做 | 必做 |

工具消费规则：

```
是否启用某条目 = applies_to 包含当前 mode
              && project_types 包含当前 type（若条目限定）
              && min_level <= 当前 maturity
```

## 4. 多类型项目（monorepo）

monorepo 含多个项目时：

- 每个子项目可有独立 `.harness/config.json`
- 根级 `.harness/config.json` 提供默认值
- 子项目优先级 > 根级

## 5. 选型不清时

如果不确定项目类型：

- 长期运行 + 对外提供能力 -> Backend Service
- 被其他代码 import / require -> Library
- 命令行直接调用 -> CLI
- 浏览器跑 -> Frontend SPA

混合（如 SDK 同时提供 CLI）：选最强约束的那个（这里取 Library + CLI 的并集）。
