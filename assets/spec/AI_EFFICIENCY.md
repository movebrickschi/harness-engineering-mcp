---
spec_id: harness-spec-ai-efficiency
applies_to: [solo, small-team, mid-team, org]
min_level: L1
project_types: [backend-service, library, cli, frontend-spa]
---

# AI Efficiency Contract · 高效 & 省 Token 操作规范

> 与 `AI_AGENT_CONTRACT.md` 互补——后者管「边界 / 留痕」，**本契约管「同一件事用更少 token 做完」**。
>
> 阅读对象：AI Agent 本身 + 写 prompt / skill / rule 的工程师。

---

## 1. 核心铁律（必须遵守）

### 1.1 先窄后宽（grep-first, read-last）

| 反模式 | 正确做法 |
|---|---|
| 一上来 `Read 整个文件` 找一个符号 | 先 `Grep "exactName"`，找到行号后再 `Read offset/limit` |
| 用 `Glob *.ts` 列全部文件再筛 | 直接 `Glob src/path/**/*.ts` 缩小目标 |
| 把 50 个候选文件都读一遍 | 用 `Grep -l` 拿到命中文件，再选最有价值的 3-5 个读 |

> **指标**：单次检索工具的输出 ≤ 20 行有效信息。命中超过 20 条立刻收紧条件。

### 1.2 读文件按需切片

```text
反模式：Read("src/big-file.ts")  // 默认全读，2000+ 行
正确  ：Read("src/big-file.ts", offset=120, limit=80)  // 只看相关函数
```

> **指标**：单次 Read 不超过 500 行；> 500 行先 Grep 定位再切片。

### 1.3 工具调用尽量并行

独立的检索 / 读 / 类型检查可以一次性批发：

```text
反模式（顺序）：
  Read fileA → Read fileB → Read fileC
正确（并行）：
  一次消息里同时发 3 个 Read 工具调用
```

> **指标**：同一轮内可并行的工具调用 ≥ 80% 真的批发出去；连续 5 次单工具调用 = 违规。

### 1.4 子任务用 subagent 隔离

大任务（多文件重构 / 跨模块调研 / 长链路 debug）丢给 subagent / 子会话，避免长上下文污染主会话。

| 主会话该做的 | subagent 该做的 |
|---|---|
| 拆任务 / 收集结果 / 做最终决策 | 跑长检索 / 全文阅读 / 拼接调研报告 |
| 写最终代码 | 评估某个改动是否安全 |

> **指标**：> 3 文件的检索任务必须委派 subagent；主会话上下文增长不应被 raw 文件内容污染。

### 1.5 短输出 + 结构化

```text
反模式：让 LLM 用自由叙述讲清楚 8 个修改点
正确  ：让 LLM 输出
  | # | 文件 | 行 | 改动一行说明 |
```

> **指标**：每段 reply 不超过 2000 字符（与 token-loop 防护规则一致）；超过就拆段或换表格。

### 1.6 计划与执行分离

任何 > 3 步的改动：先 `writing-plans` skill 出明文计划 → 用户 / 主控审过 → 再 `executing-plans` skill 推进。

> **指标**：禁止「边想边改」造成 10+ 轮试错往返；一轮 plan + 一轮 execute 即可完成的事别拆成 8 轮。

---

## 2. 三层缓存策略（提高 prompt cache 命中）

> 主流大模型（Claude / GPT / Gemini）的 prompt cache 都以「前缀稳定」为命中条件。Harness 通过分层加载利用这一点。

### 2.1 L0 · System / Spec 层（最稳定）

- 系统提示 + Harness spec / rules 全集 → 一次加载，永不变动
- 推荐通过 MCP 资源 `harness://spec/index` / `harness://rules/index` 一次性挂载，避免每轮 prompt 里手抄

### 2.2 L1 · Project context 层（半稳定）

- `harness.config.json` + `docs/engineering-harness.md` + `verification_baseline.json`
- 每个项目稳定 ~周级别
- 用 MCP 工具按需读，**不要**把它们重复贴进每轮 prompt

### 2.3 L2 · Task context 层（一次性）

- 当前 feature 的 `01-06_*.md`、本轮要改的几个文件、本轮跑的测试输出
- 每个任务结束即丢弃

> **优化点**：让 L0 / L1 在 cache 中常驻；L2 只承担「新增 token」。如果 cache 命中率 < 60%，多半是 L0/L1 被错误地塞进了每轮 prompt。

---

## 3. 检索路径优先级（同样的事，多花费 vs 少花费）

| 行动 | 单次 token 估算 | 推荐场景 |
|---|---|---|
| `Grep "exactSymbol"` | ~ 200 | 知道精确字符串 |
| `Glob "src/**/Service.ts"` | ~ 300 | 知道文件名规律 |
| `SemanticSearch query="..."` | ~ 1500 | 探索性 / 不知名 |
| `Read entire file` | 文件大小 × 1.3 | 已通过 Grep 定位 / 文件 < 200 行 |
| `subagent.explore(...)` | 主会话 ~ 300 + 子会话独算 | 多文件调研 |

**铁律**：能用 Grep / Glob 解决的，不要 Semantic Search；能 Semantic Search 解决的，不要让主会话自己读全文。

---

## 4. 写 prompt / skill / rule 的反模式

| 反模式 | 危害 | 对策 |
|---|---|---|
| 在 skill 里写「在思考之前请先慢慢思考」之类的废话 | 浪费 token，无信号 | 删掉，AI 默认会思考 |
| 大段重复警告（"千万不要 X · 一定不要 X · 切勿 X"） | token 翻倍且收益边际下降 | 一条铁律 + 一个反例 |
| 把同样的话用 markdown 重复 2-3 次 | 上下文膨胀 | 表格化 |
| 给 AI 「读这 30 个文件再开始」 | 上下文爆炸 | 列出文件清单 + 「按需读」 |
| skill 文件夹塞 10+ MB 的示例 | 工具调用 timeout / cost spike | 引用外部 URL 或拆 fixture 仓库 |

---

## 5. 量化 KPI（可被 CI / `harness check` 跟踪）

| 指标 | 期望值 | 检测方式 |
|---|---|---|
| 单次 reply ≤ 2000 字符 | ≥ 95% | 解析对话日志 |
| 工具并行率 | ≥ 60% | 解析 tool-call sequence |
| Grep / Glob vs Read 比 | ≥ 2:1 | 工具调用统计 |
| Plan-then-execute 命中率 | ≥ 80%（> 3 步任务）| skill 调用日志 |
| Prompt cache 命中率 | ≥ 60% | 大模型 API 报告 |
| Subagent 委派率（> 3 文件检索）| ≥ 80% | dispatch 日志 |

mid-team+ 项目应该把这些指标采进 `docs/DORA.md` 之外的「AI Efficiency Board」，自下而上推动改善。

---

## 6. 自检清单（每轮回复前自问 5 条）

- [ ] 这次回复 < 2000 字符？
- [ ] 本轮发出的工具调用尽量是**并行**而非顺序？
- [ ] 没有把整份大文件塞进上下文？
- [ ] 没有重复粘贴 L0/L1 层已有的 spec / rule？
- [ ] 如果是 > 3 步任务，已经先出计划？

5 条全 yes 才往下走，否则收紧。

---

## 7. 与其它规范的关系

| 规范 | 关系 |
|---|---|
| `AI_AGENT_CONTRACT.md` | 互补 · 管「能做什么」 |
| `assets/skills/brainstorming/SKILL.md` | 互补 · 设计阶段省 token |
| `assets/skills/writing-plans/SKILL.md` | 互补 · 计划阶段省 token |
| `assets/skills/executing-plans/SKILL.md` | 互补 · 执行阶段省 token |
| `assets/skills/ai-efficiency/SKILL.md` | **执行落地**版本（本规范的 actionable 子集）|
| `assets/rules/16-ai-efficiency.mdc` | Cursor 用的硬规则，CI 可校验 |

---

## 8. 落地建议

| Mode | 落地动作 |
|---|---|
| `solo` | 把本规范挂进 `harness://spec/file/AI_EFFICIENCY.md`，AI 调用 skill 时自动读到 |
| `small-team` | + PR 模板 checklist 加一行「AI Efficiency 自检通过」|
| `mid-team` | + 每月一次 token 用量 retro，红黄绿三档跟踪 §5 KPI |
| `org` | + 接入 AI 平台用量看板，跨团队对齐 cache hit / 并行率基线 |
