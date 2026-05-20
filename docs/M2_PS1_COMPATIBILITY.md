# M2 · 与原 `engineering-check.ps1` 的兼容性映射

> 目的：明确 `harness check`（TS / 跨平台）与 `heritage-inherit` 项目里的 `engineering-check.ps1` 之间的**输出兼容关系**，让任何已经在解析 ps1 输出的 CI / 脚本无须重写。
>
> 覆盖：M2 阶段「与原 ps1 输出 PASS/WARN/FAIL 一致」验收。

---

## 1. 等价对照表

| ps1 check 名称（推断）| harness_check `check_id` | category | 等价说明 |
|---|---|---|---|
| Config exists | `config.exists` | config | 检测 `.harness/config.json` |
| Config valid | `config.valid` | config | 解析 mode/stack 字段 |
| SSOT exists | `structure.ssot` | structure | `.harness/engineering-harness.md` |
| ADR present | `structure.adr` | structure | `.harness/adr/` 至少一条 |
| Features board | `structure.features` | structure | `.harness/features/INDEX.md` |
| No .env in repo | `secrets.envfile` | secrets | walk repo 找泄漏的 .env |
| Test directory | `tests.directory` | tests | `test/` / `tests/` / `src/test/` |
| Test command | `tests.command` | tests | 按 stack 判断 npm/mvn/pytest 是否就绪 |
| Real test run | `tests.exec` | tests | **新增** · 实际跑 mvn/npm/pytest，PASS=exit 0 |
| Baseline exists | `baseline.exists` | baseline | `.harness/baseline.json` |
| Baseline valid | `baseline.valid` | baseline | JSON 解析 + version 校验 |
| README exists | `docs.readme` | docs | `README.md` |

> `tests.exec` 是 TS 版扩展项，ps1 时代仅做静态检查；旧消费者**不会**看到这一项，因为它仅在 `run_tests=true` 时被激活（CLI: `harness check --run-tests`）。

## 2. 输出格式契约

ps1 输出每行形如：

```
PASS Config exists
WARN ADR present  -- .harness/adr/ 下尚无 ADR 记录
FAIL Config valid -- config.project.mode 缺失
```

harness_check 跨平台版输出（CLI summary 模式）形如：

```
Harness Check: WARN
PASS 7 · WARN 4 · FAIL 0 · 142ms
PASS config.exists: .harness/config.json 存在
WARN structure.adr: .harness/adr/ 下尚无 ADR 记录
...
```

关键不变量：

1. **每条结果**都含 `PASS|WARN|FAIL` 三选一的状态 token，与 ps1 一致；
2. **check_id 命名空间**稳定，见上表；新增项以新 id 追加，**不**复用旧 id；
3. **summary 行**显式给出 `PASS X · WARN Y · FAIL Z · 总耗时`；
4. **整体 status** 与 ps1 同语义：
   - 任一 FAIL → 整体 FAIL（exitCode=1）
   - 否则若 `--strict` 且有 WARN → FAIL（与 ps1 `-Strict` 一致）
   - 否则若有 WARN → WARN
   - 否则 PASS

这些不变量由 `test/check-ps1-compat.test.ts` 单测锁定。

## 3. CI 接入示例

旧脚本：

```powershell
pwsh ./scripts/engineering-check.ps1 -Strict
if ($LASTEXITCODE -ne 0) { throw "harness check failed" }
```

新等价：

```bash
harness check --strict
# 或
harness check --strict --run-tests   # 同时跑真实 mvn/npm/pytest
```

输出可以继续按 `^(PASS|WARN|FAIL) (\S+):` 解析。`tests.exec` 行的 message 末尾会附带被生成命令的最后 160 字节，方便 CI 直接定位失败原因。

## 4. JSON 模式（机器解析友好）

ps1 没有 JSON 模式；harness 提供：

```bash
harness check --json
```

输出形如：

```json
{
  "status": "WARN",
  "summary": { "pass": 7, "warn": 4, "fail": 0, "total": 11 },
  "results": [
    { "category": "config", "check_id": "config.exists", "status": "PASS", "message": "..." }
  ],
  "elapsed_ms": 142
}
```

JSON 结构和单测、`harness://config/schema` 共享同一份类型来源（`src/types/harness.ts: CheckToolOutput`）。

## 5. 已迁移 vs. 仍兼容 vs. 已弃用

| ps1 时代行为 | 当前实现 | 备注 |
|---|---|---|
| 静态结构检查 | ✅ 完整等价 | 一对一对应 |
| `-Strict` 行为 | ✅ `--strict` / `strict:true` 等价 | |
| 真实 `mvn test` / `npm test` / `pytest` 执行 | ✅ `--run-tests` 启用 | 默认关闭以保速度 |
| `Write-Host` 着色 | ✅ `picocolors` | 输出不可解析地方一致 |
| `$LASTEXITCODE` 设置 | ✅ `process.exitCode = 1` | FAIL 时退出码 1 |
| Powershell-only flag `-Verbose` | ❌ 未实现 | JSON 模式 + `categories=detailed` 替代 |

## 6. 验收清单

- [x] `check_id` 命名空间被 `test/check-ps1-compat.test.ts` 锁定
- [x] PASS/WARN/FAIL 三态严格使用，由测试断言
- [x] `--strict` 升级行为与 ps1 `-Strict` 一致
- [x] `--run-tests` 真实跑测试，PASS=exit 0、FAIL=非 0、WARN=无运行器
- [x] CLI / MCP / JSON 三入口共享一份输出结构
