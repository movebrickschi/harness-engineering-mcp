---
spec_id: harness-spec-stack-adapters
applies_to: [solo, small-team, mid-team, org]
min_level: L1
---

# Stack Adapters

> 各技术栈的差异化指南。规范包本身栈无关；落地时按本目录对应栈展开命令矩阵 / 工具选型 / CI 步骤。

## 目录

- [`java-spring.md`](java-spring.md)：Java 21 + Spring Boot 3.x/4.x 后端
- [`node-typescript.md`](node-typescript.md)：Node 20+ / TypeScript / pnpm 后端 + 前端
- [`python.md`](python.md)：Python 3.11+ / pyproject / pytest
- [`go.md`](go.md)：Go 1.22+ / standard tooling

## 通用对照

| 维度 | 各栈共性 |
| --- | --- |
| 项目入口识别 | `pom.xml` / `package.json` / `pyproject.toml` / `go.mod` |
| 依赖管理 | Maven / pnpm / pip+venv / go mod |
| 测试 | JUnit / Vitest+Jest / pytest / go test |
| 覆盖率 | JaCoCo / c8+nyc / coverage / go test -cover |
| 静态检查 | Checkstyle+SpotBugs / ESLint+tsc / ruff+mypy / vet+staticcheck |
| 安全扫描 | OWASP Dependency Check / npm audit+snyk / pip-audit / govulncheck |

## 选型不在范围

本规范不强制具体厂商：
- CI：GitHub Actions / GitLab CI / Jenkins 任选
- 监控：Datadog / Prometheus+Grafana / Sentry 任选
- 密钥：Vault / 云 KMS / Doppler 任选

各 stack 文件给出常见组合作参考。
