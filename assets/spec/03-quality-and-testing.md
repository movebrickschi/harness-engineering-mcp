---
spec_id: harness-spec-03-quality
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# 03 Quality & Testing

> 测试金字塔、性能预算、Code Review checklist、本地/CI 门禁、baseline。
>
> solo 模式必读 §1（测试金字塔最简版）+ §4（本地门禁）+ §5（baseline）。

---

## 1. 测试金字塔 [solo+]

### 1.1 默认占比建议

| 层级 | 占比 | 角色 |
| --- | --- | --- |
| 单元测试 | 70% | 函数 / 类 / 组件级别，毫秒级 |
| 集成测试 | 20% | 模块协作 / DB / 外部依赖 mock |
| E2E 测试 | 5% | 用户路径完整跑通 |
| 契约 / 合约测试 | 5% | 跨服务 / 跨团队 |

### 1.2 项目类型差异 [project_types]

| 项目类型 | 强化层 | 弱化层 |
| --- | --- | --- |
| Backend Service | 集成 + 契约 | E2E（除非全栈） |
| Library/SDK | 单元 + 兼容性矩阵 | E2E（一般不适用） |
| CLI | 单元 + E2E（命令行端到端） | 契约 |
| Frontend SPA | 单元 + E2E（浏览器） | 契约（除非依赖外部 API） |

### 1.3 强制要求 [mid-team+]

- 新增功能必须带测试，禁止"先合再补"
- Bug 修复必先写失败用例再写修复
- 删除测试必须写明理由（注释 / PR 描述）

---

## 2. 性能预算 [small-team+]

### 2.1 预算字段

参考 [`templates/quality/perf-budget.md.tmpl`](templates/quality/perf-budget.md.tmpl)。

| 维度 | 指标 | 默认阈值 |
| --- | --- | --- |
| 后端接口 | P95 / P99 / 错误率 | P95 ≤ 500ms / P99 ≤ 1s / 错误率 ≤ 0.1% |
| 前端 | LCP / FID / CLS / TTI | LCP ≤ 2.5s / CLS ≤ 0.1 |
| 包体积 | gzipped 主包 | ≤ 200KB（前端）/ ≤ 5MB（后端镜像增量） |
| 库 | 启动时间 / API 调用延迟 | 视具体库定义 |

### 2.2 写入基线

阈值写入 [`verification_baseline.json`](../../verification_baseline.json)；CI / 本地脚本对比。

```json
{
  "perf": {
    "api_p95_ms": 500,
    "api_p99_ms": 1000,
    "frontend_lcp_ms": 2500
  }
}
```

### 2.3 门禁强度 [L3+]

- L1-L2：超阈值 WARN，不阻断
- L3：超阈值 FAIL，阻断合入
- L4：超阈值自动建 issue + 触发 oncall

---

## 3. Code Review Checklist [solo+]

参考 [`templates/quality/code-review-checklist.md`](templates/quality/code-review-checklist.md)。30 条横切检查项分 6 维：

### 3.1 架构

- [ ] 是否违反分层 / 模块边界
- [ ] 是否引入循环依赖
- [ ] 公共逻辑是否被复制
- [ ] 是否过度抽象

### 3.2 安全

- [ ] 输入是否校验
- [ ] 输出是否转义
- [ ] 鉴权 / 隔离是否到位
- [ ] 密钥 / Token 是否落库
- [ ] SQL 注入 / XSS / CSRF 风险

### 3.3 可读性

- [ ] 命名是否表达意图
- [ ] 函数职责是否单一
- [ ] 注释解释 why 而非 what
- [ ] 魔法数字 / 字面量已提取

### 3.4 可测性

- [ ] 是否易于 mock
- [ ] 测试覆盖关键路径 + 异常分支
- [ ] 测试是否有 race / 时序依赖
- [ ] 测试是否依赖外部环境

### 3.5 性能

- [ ] 大循环是否创建对象
- [ ] N+1 / 全表扫描风险
- [ ] 缓存是否合适
- [ ] 资源释放（连接 / 流 / 锁）

### 3.6 可观测

- [ ] 关键路径是否有日志
- [ ] 日志含必要业务 ID
- [ ] 错误是否可追踪到根因
- [ ] 指标是否覆盖关键业务

### 3.7 自检版（solo） vs 互审版

| 模式 | 谁执行 | 何时 |
| --- | --- | --- |
| solo / small-team | 作者自检 | PR 提交前 |
| mid-team+ | 评审者按清单逐项 | PR 评审过程 |

---

## 4. 本地门禁 `engineering-check` [solo+]

### 4.1 必备检查项

参考 [`templates/scripts/engineering-check.{ps1,sh}.skel`](templates/scripts/)。分组：

| 组 | 检查项 |
| --- | --- |
| A 文件存在 | README / SSOT / ADR 0001 / baseline 是否齐全 |
| B 代码风格 | 禁用的 API / 命名规范 / 导入顺序 / 文件长度 |
| C 配置安全 | 明文密钥 / 临时文件 / `.env` 入库 |
| D 数据迁移 | 涉及 schema 时检查迁移文件 + 回滚 SQL |
| E 基线对比 | 测试数 / 覆盖率 / 检查项数对比 baseline |
| F 测试 | 可选跑测试，单次 ≤ 5 分钟 |

### 4.2 性能要求

- 单次执行（不含 F 组）≤ 5 秒
- 输出 PASS / WARN / FAIL 三级，FAIL 阻断 commit
- 支持 `--json` 输出供 CI 消费

### 4.3 mode 驱动

脚本启动读 `harness.config.json.mode`：
- solo：跳过 Review SLA / On-call / SLO 检查
- mid-team+：启用全部
- 项目级覆盖：`harness.config.json.checks.<id>.enabled`

---

## 5. CI 门禁 [small-team+]

### 5.1 最小 CI 步骤

参考 [`templates/ci/`](templates/ci/) 骨架：

```yaml
jobs:
  build:           编译 / 类型检查
  test:            单元 + 集成
  engineering-check:  本地门禁脚本
  upload-coverage: 上传覆盖率（L3+）
  upload-sbom:     SBOM（org+）
```

### 5.2 性能要求

- 单次 PR CI ≤ 10 分钟
- 失败必须给出可定位日志
- 不允许 flaky 测试静默 retry

### 5.3 baseline 强约束 [L2+]

CI 读 `verification_baseline.json`：
- 测试数量 < 基线 -> FAIL
- 覆盖率 < 基线 -> FAIL（L3+）
- 检查项数 < 基线 -> FAIL

只有人工调整 baseline 并经评审，才允许下调。

---

## 6. baseline 管理 [small-team+]

### 6.1 字段

参考 [`templates/entry/verification_baseline.json.tmpl`](templates/entry/verification_baseline.json.tmpl)：

```json
{
  "test_classes": 8,
  "test_methods": 0,
  "coverage_baseline": 0.0,
  "engineering_check_items": 11,
  "perf": { ... },
  "ci": { ... },
  "mode": "mid-team",
  "maturity_target": "L3"
}
```

### 6.2 抬升节奏

- 每季度复盘时上调一次（如 coverage 0.6 -> 0.65）
- 不允许"为了通过 CI 临时下调"

---

## 7. 测试反模式 [solo+]

| 反模式 | 危害 |
| --- | --- |
| 测试覆盖 mock 而非真实行为 | 误导 |
| 把生产代码改成可测的"测试专用方法" | 污染 |
| 注释/skip 失败测试 | 失去防线 |
| 用 sleep 处理异步 | 易 flaky |
| 单元测试依赖网络 / DB | 慢且不稳 |
| 一个测试断言 20 个字段 | 出错难定位 |

详见 [`ANTIPATTERNS.md`](ANTIPATTERNS.md)。

---

## 8. 与其他模块的关系

- 紧急通道下测试不可跳过 -> [`02-process-and-governance.md`](02-process-and-governance.md) §7
- baseline 与发布检查 -> [`04-release-and-operations.md`](04-release-and-operations.md)
- 安全测试（SCA / SAST） -> [`05-security-and-compliance.md`](05-security-and-compliance.md)
