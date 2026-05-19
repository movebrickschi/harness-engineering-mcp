---
spec_id: harness-spec-stack-node-typescript
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# Stack Adapter: Node / TypeScript

## 1. 项目识别

- 入口：`package.json`
- TS 配置：`tsconfig.json`
- 包管理：pnpm（推荐）/ npm / yarn

## 2. 依赖管理

| 项 | 推荐 |
| --- | --- |
| 包管理器 | pnpm（速度 + 严格 hoisting） |
| 锁定文件 | `pnpm-lock.yaml` 必须入库 |
| Node 版本 | `.nvmrc` / `engines` 字段 |
| Monorepo | pnpm workspaces / Turborepo / Nx |

## 3. 测试矩阵

| 类型 | 推荐工具 |
| --- | --- |
| 单元 | Vitest（推荐）/ Jest |
| 集成 | Vitest + supertest（HTTP）/ Testcontainers |
| E2E（前端） | Playwright（推荐）/ Cypress |
| E2E（CLI） | execa + temp dir |
| 契约 | Pact / `@pact-foundation/pact-js` |

```bash
pnpm test
pnpm test:integration
pnpm test:e2e
```

## 4. 覆盖率

```bash
pnpm vitest run --coverage   # 用 c8 / istanbul
```

输出：`coverage/lcov.info` + `coverage/coverage-summary.json`。

## 5. 静态检查

| 工具 | 用途 |
| --- | --- |
| TypeScript `tsc --noEmit` | 类型检查 |
| ESLint | 代码风格 + 错误模式 |
| Prettier | 格式化 |
| `@typescript-eslint/strict-type-checked` | 严格模式 |
| Knip / depcheck | 死代码 / 未用依赖 |
| madge | 循环依赖检测 |

## 6. 安全扫描

| 维度 | 工具 |
| --- | --- |
| SCA | `pnpm audit` / Snyk / Socket.dev |
| 密钥扫描 | gitleaks / `@secretlint/secretlint` |
| SAST | Semgrep / ESLint security plugin |
| SBOM | `cyclonedx-npm` |

## 7. 性能

| 类型 | 工具 |
| --- | --- |
| 后端压测 | autocannon / k6 |
| 前端 | Lighthouse / Web Vitals / WebPageTest |
| 包体积 | `pnpm size-limit` / bundlephobia |
| Profiling | `--inspect` + Chrome DevTools / clinic.js |

## 8. 项目类型差异

### 8.1 Backend Service

- 框架：NestJS / Fastify / Express
- API 文档：`@nestjs/swagger` / OpenAPI generators
- 监控：OpenTelemetry + Prometheus

### 8.2 Library / SDK

- 双发布：ESM + CJS（用 `tsup` / `unbuild` / `tshy`）
- 类型导出：`exports` 字段含 `types`
- 版本管理：changesets（推荐）/ semantic-release
- 兼容性矩阵：Node 18 / 20 / 22 + ESM/CJS

### 8.3 CLI

- 框架：commander / yargs / oclif
- 二进制：`bin` 字段 + shebang
- 兼容性：跨 OS（Windows / macOS / Linux）+ 多 shell（bash/zsh/pwsh）

### 8.4 Frontend SPA

- 框架：React / Vue / Svelte
- 构建：Vite（推荐）/ webpack / Rspack
- 路由 / 状态：按框架生态选
- 性能预算：LCP ≤ 2.5s / CLS ≤ 0.1 / 主包 gzipped ≤ 200KB

## 9. CI 关键步骤

```yaml
- uses: actions/setup-node@v4
  with: { node-version-file: '.nvmrc', cache: pnpm }
- uses: pnpm/action-setup@v3
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck
- run: pnpm lint
- run: pnpm test --coverage
- run: pnpm audit --audit-level=high   # mid-team+
- run: pnpm build
```

前端额外：

```yaml
- run: pnpm build && pnpm size-limit
- run: pnpm playwright install --with-deps && pnpm test:e2e
```

## 10. 与本规范的常见映射

| 规范条目 | Node/TS 实现 |
| --- | --- |
| 测试金字塔 | Vitest + supertest + Playwright + Pact |
| 性能预算 | size-limit + Lighthouse CI + Web Vitals 上报 |
| Feature Flag | Unleash / LaunchDarkly / 自建 + React Context |
| Audit Log | 中间件 + Pino structured logging |
| AI Agent 留痕 | husky pre-commit 自动加 footer |

## 11. 反模式（栈特定）

- 把 `node_modules` 入库
- `any` 类型遍地 / 关闭 `strict`
- `lockfile` 不入库
- `try/catch` 吞异常无日志
- 浏览器代码用 Node only API（`fs` / `path`）
- 前端组件直接读 `process.env.SECRET`
