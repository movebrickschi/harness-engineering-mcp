# IDE 日常使用手册 · Cursor / Claude Code

> 假设你已经按 `docs/M3_CURSOR_INTEGRATION.md` 或 `docs/M4_MULTI_IDE_INTEGRATION.md` 接入了 `harness-engineering` MCP server。本文档教你**怎么用它**，而不是怎么装它。
>
> 配套：`docs/USAGE.md`（5 个端到端长场景）· 本文件聚焦"安装完之后每天怎么说话"。

---

## 1. 5 个真实场景

### 1.1 场景 1 · 给新项目接入 Harness（一次性）

直接发自然语言，**别提工具名**：

```
我有一个 Java Spring 项目在 C:/work/order-api，请帮我接入 Harness Engineering
```

AI 自动跑：

```
1. harness_init({cwd:"C:/work/order-api"})
   → MCP 扫描 pom.xml / package.json → 返回 detected + ask_user
2. AI 把缺失字段问你（mode / project_name 等）
3. 收齐再调一次 harness_init({...})
   → 生成 .harness/config.json + 5 个文件
4. AI 报告 "已接入"，附 next_steps
```

---

### 1.2 场景 2 · 接到一句话需求（每天用）

```
"列表加一个状态筛选"
```

AI 链路：

```
1. harness_route_task → skill=dev-flow-oneliner-fe + efficiency_hints
2. harness_load_skill name=dev-flow-oneliner-fe
3. 按 skill：MINI_PRD → 切片实现 → 测试 → 验证
4. harness_check 跑门禁
```

高风险任务自动升档：

```
"后端新增订单表和查询接口"
→ forced_upgrade:{to:"dev-flow-doc-be",reason:"涉及数据库 schema 变更"}
→ 自动走完整 PRD 流程（01-06 阶段文档）
→ 关键节点 harness_gate_review action=generate
```

---

### 1.3 场景 3 · 修 Bug

```
"接口 500 报错，登录后查不到数据"
```

AI 自动：

```
1. harness_route_task → skill=bugfix-flow
2. 加载 harness://skills/systematic-debugging
3. Phase 1 调查 → Phase 2 假设 → Phase 3 验证 → Phase 4 修复
4. 写复现失败测试 → 修代码让它过
5. harness_check --run-tests 验证
```

**关键省心点**：因为 `systematic-debugging` 的 `## 反例` 段明文禁止 mock 掉断言 / try-catch 吞异常，AI 不会再用这些反模式偷懒。

---

### 1.4 场景 4 · 团队扩张升档

```
"项目升档到 mid-team"
```

```
1. harness_upgrade_mode to=mid-team
   → 自动生成 CHANGELOG / PR 模板 / .github/CODEOWNERS
   → .harness/oncall.md / .harness/SLO.md
2. harness_check --strict 验证新门禁
```

升档**零迁移成本**，已有文件保留不动。

---

### 1.5 场景 5 · CI 集成

`.github/workflows/harness.yml`：

```yaml
- run: npx -y -p harness-engineering-mcp@latest harness check --strict --run-tests --json > harness-report.json
- if: always()
  uses: actions/upload-artifact@v4
  with: { name: harness-report, path: harness-report.json }
```

CI 失败时直接看 `harness-report.json`，每条都带 `check_id` 与 `message`。

---

## 2. 开场白模板（强烈推荐）

第一次让 AI 接手项目前，先发这段当作"系统提示"：

```text
我的项目已经接入了 harness-engineering MCP。请你严格按以下规则工作：

1. 接到任务先用 harness_route_task 路由，按返回的 efficiency_hints 执行
2. 长任务遵守 harness://spec/file/AI_EFFICIENCY.md 的 6 条铁律
3. 提交前必须 harness_check --strict 通过
4. BLOCKER 必须先 harness_gate_review action=check 确认
5. 规则冲突时按 harness://spec/file/PRIORITY_HIERARCHY.md 裁决

确认理解后回复 "ok"。
```

AI 会通过 URI 引用（**不消耗 token**）加载 spec/rule/skill 全集到上下文。

---

## 3. 7 个工具的"不需记忆"映射

| 想做什么 | 你说什么 | AI 自动调用 |
|---|---|---|
| 接入新项目 | 「接入 Harness」 | `harness_init` |
| 强制按模板重生成 | 「按模板重新生成 / 强制 init」 | `harness_init` w/ `force=true` |
| 一句话需求 | 直接描述需求 | `harness_route_task` + `harness_load_skill` |
| 修 bug | 直接描述报错现象 | `harness_route_task` → bugfix-flow |
| 性能优化 | 「性能优化 / 太慢」 | `harness_route_task` → perf-flow |
| 重构 | 「整理代码 / 重构」 | `harness_route_task` → refactor-flow |
| 接第三方 | 「接入 X SDK」 | `harness_route_task` → third-party-flow |
| 跑门禁 | 「跑一次 harness check」 | `harness_check` |
| 闸门评审 | 「为 X 功能做 Gate Review」 | `harness_gate_review` |
| 升档 | 「升档到 mid-team」 | `harness_upgrade_mode` |
| 清除 / 不再用 harness | 「卸载 harness / 清空 `.harness/`」 | `harness_uninstall`（CHANGELOG.md / .github/* 自动保留）|

**你越少提工具名，AI 表现越好** —— 路由器比手挑更准。

---

## 4. 关键资源 URI 速查

直接在 Cursor / Claude Code 的 `@` 提示里输入 URI 即可拉取内容（不消耗主上下文 token）：

| URI | 内容 |
|---|---|
| `harness://skills/_decision-tree` | 40 个 skill 决策树 + 频率 + 依赖图 |
| `harness://spec/file/AI_EFFICIENCY.md` | 省 token 6 铁律 + 三层缓存 + 6 KPI |
| `harness://spec/file/PRIORITY_HIERARCHY.md` | L0-L4 规范优先级裁决 |
| `harness://skills/ai-efficiency` | 高效执行 skill 正文（6 阶段清单）|
| `harness://skills/dev-flow` | 开发组合拳路由器（含 mermaid 决策图）|
| `harness://rules/16-ai-efficiency.mdc` | 10 条 token-saving 硬规则 |
| `harness://config/schema` | `.harness/config.json` 完整 JSON Schema |
| `harness://skills/index` | 所有 skill 的 JSON 元数据列表 |
| `harness://rules/index` | 所有 rule + applies_to 标签 |

---

## 5. 验收三件套（重启 IDE 后必跑）

```text
1. harness_route_task task="测试一下"
   → 期望返回 efficiency_hints 非空数组
2. 读资源 harness://skills/_decision-tree
   → 期望返回决策树 markdown，包含「Skills Index」字样
3. harness_check cwd=. categories=["config"]
   → 期望返回 PASS / WARN / FAIL 结构化输出
```

三条全通 = MCP 在线，可以放心使用。

---

## 6. 高效工作的 5 条潜规则

按 `assets/skills/ai-efficiency/SKILL.md` 提炼：

1. **能用 Grep 别用 Read** —— 精确字符串先窄查询
2. **大文件切片读** —— Read 必带 offset/limit
3. **独立工具调用并行** —— 同一轮 ≥ 2 个独立调用一次性发出
4. **跨 ≥ 3 文件检索委派 subagent** —— 主会话只留摘要
5. **每段回复 ≤ 2000 字符** —— 表格优于散文

让 AI 把这 5 条贴墙上，token 消耗下降 30-50% 是基线。

---

## 7. 跨 IDE 兼容性提醒

| 能力 | Cursor | Claude Code | Codex CLI |
|---|---|---|---|
| 7 个工具（含 `harness_uninstall`）| ✅ | ✅ | ✅ |
| `harness://spec/*` URI | ✅ | ✅ | ⚠ 部分 |
| `harness://skills/*` URI | ✅ | ✅ | ⚠ 通过工具替代 |
| `--run-tests` 真实跑测试 | ✅ | ✅ | ✅ |

⚠ 标记不影响功能（用 `harness_load_skill` 替代 URI 即可）。

完整矩阵：`docs/M4_MULTI_IDE_INTEGRATION.md`。

---

## 8. 故障排查

| 现象 | 原因 | 修复 |
|---|---|---|
| AI 不调任何 harness_* 工具 | 没看到 MCP server | 重启 IDE / 检查 `mcp.json` 路径 |
| AI 自己生成 `.harness/config.json` 而非调 init | 没意识到有 MCP | 用开场白模板（§2）显式提醒 |
| `harness_check` 总报 `config.exists FAIL` | 项目未 init | 先调 `harness_init` |
| `tests.exec` 提示 `无法为 stack=other 推断` | stack=other 没绑测试器 | 改 `.harness/config.json` 的 `project.stack` |
| `harness_route_task` 路由不到合适 skill | 任务描述太抽象 | 加上 `context: {scope, has_prd, has_prototype}` |
| AI 把 `harness://...` URI 当普通字符串 | IDE 不支持 MCP resources（旧版）| 升级 IDE 或改用 `harness_load_skill` |

---

## 9. 进阶：在 PRD / 长任务里强制使用

如果你给 AI 一份完整 PRD，让它跑全流程，开头加一句：

```
请按 harness://skills/dev-flow-doc-full 的 5 阶段流程执行：
阶段 1 阶段 1 收集启动参数 → 阶段 2 项目勘察 → 阶段 3 方案评审 →
阶段 4 切片验证 → 阶段 5 上线 + 复盘。
每阶段交付物按 skill 内的清单产出，关键节点跑 harness_check 和 harness_gate_review。
```

AI 不会跳步，所有产物（01-06_*.md）会按规范落在 `.harness/features/<name>/`。

---

## 10. 与 Restful-all / 其它工具的关系

| 工具 | 与 harness-mcp 关系 |
|---|---|
| Cursor 内置 `.cursor/rules` | 由 harness 集中管理：`harness_init` 写入 → 后续 `harness_upgrade_mode` 累加 |
| Claude Code 的 `AGENTS.md` | 由 harness `engineering-harness.md` 充当 SSOT |
| GitHub Copilot | 不直接接入；但 Copilot 看到 harness 生成的 spec / rule 后表现会变好 |
| Restful-all IDEA 插件 | 互补：Restful-all 管 API 调试 UI，harness-mcp 管工程治理流程 |
| BaJie-MCP（多 agent 编排）| 互补：BaJie 管 agent 之间通信，harness 管单个 agent 的输出质量 |

可以多个 MCP 共存在同一 `mcp.json` 里。
