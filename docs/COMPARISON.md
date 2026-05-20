# Harness Engineering vs 同类工具对比

> 在你装 harness-engineering-mcp 之前 / 之后，可能想知道：**它和 Cursor 自带规则、Claude memories、Aider conventions 这些到底有什么差异？该一起用还是替换？**
> 这份文档给一份**坦白对照**——能取代什么、不能取代什么、互补怎么用。

---

## 0. 一句话总览

| 工具 | 一句话定位 |
|---|---|
| **Cursor `.cursor/rules/*.mdc`** | Cursor IDE 内置的、按 glob 自动注入的**行为规则**（给单个 AI 看） |
| **Claude Code `CLAUDE.md` / memories** | Claude 单线程记忆，告诉 Claude "你不要做什么"、"用什么语气" |
| **Aider `CONVENTIONS.md`** | Aider 命令行 agent 的项目约定 / 代码风格 |
| **GitHub Copilot Workspace 任务模板** | 单任务级的工作流模板，不跨任务 |
| **OpenAI Custom Instructions / Project** | 用户级 / 项目级偏好设置（聊天前缀） |
| **Harness Engineering MCP** | **跨 IDE / 跨 agent** 的工程治理基线：spec + skills + rules + 路由 + 门禁 + 任务记忆 |

**关键差异点**：前 5 个都是 **某 IDE / 某 agent 私有** 的描述性配置；harness 是 **跨 IDE / 跨 agent** 的**机制 + 数据 + 工具链**统一层。

---

## 1. 全维度对照表

| 维度 | Cursor rules | Claude memories | Aider conv. | Copilot WS | Custom Inst. | **harness-engineering** |
|---|---|---|---|---|---|---|
| **作用范围** | 单 IDE（Cursor）| 单 agent（Claude）| 单 CLI（Aider）| 单 IDE（Copilot）| 单 agent（ChatGPT）| **跨 IDE / 跨 agent** |
| **跨 agent 兼容** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅（Cursor / Claude Code / Codex / 任何支持 MCP 的）|
| **跨 IDE 兼容** | ❌ | 部分 | ❌ | ❌ | 部分 | ✅ |
| **持久化** | 文件 | 文件 + Claude 内部 | 文件 | 任务级（不持久）| Server-side | 文件 + MCP 资源 |
| **配置格式** | `.mdc` Markdown + frontmatter | `CLAUDE.md` 单文件 | `CONVENTIONS.md` + `.aider.conf.yml` | 自由 prompt | 网页表单 | **结构化 JSON Schema** + Markdown |
| **版本管理** | git | git | git | 无 | 无 | **git + `harness upgrade_mode` 升档** |
| **团队共享** | git 仓库共享 | git 仓库共享 | git 仓库共享 | 无 | 个人 | git + 模式升级机制 |
| **非 AI 用户可读** | 中（人也能看 .mdc）| 中 | 高（plain MD）| 低 | 低 | **高**（`.harness/engineering-harness.md` 是 SSOT）|
| **跨会话记忆** | ❌ | ✅（Claude 内部）| ❌ | ❌ | ❌ | ✅（`.harness/features/<x>/01-06.md`）|
| **任务路由** | ❌ | ❌ | ❌ | 内置但黑盒 | ❌ | **`harness_route_task` 显式 + 可审** |
| **门禁脚本** | ❌ | ❌ | ❌（靠 lint 工具）| ❌ | ❌ | **`harness_check` 12 项 PASS/WARN/FAIL** |
| **强制升档（M3/M4/支付）** | ❌ | ❌ | ❌ | ❌ | ❌ | **路由器机械触发** |
| **审计 / 闸门评审** | ❌ | ❌ | ❌ | ❌ | ❌ | **`harness_gate_review` 8 维度 BLOCKER 检测** |
| **token 缓存机制** | inline 注入 | inline 注入 | inline 注入 | inline | inline | **`harness://` URI 资源，不进 prompt** |
| **AI Efficiency 量化** | ❌ | ❌ | ❌ | ❌ | ❌ | **6 KPI + 三层缓存策略** |
| **CI 集成** | ❌（IDE-only）| ❌ | ❌ | ❌ | ❌ | **`harness check --strict --run-tests --json`** |
| **合规附件**（SBOM/DORA/SLO）| ❌ | ❌ | ❌ | ❌ | ❌ | **org mode 自动生成模板** |

---

## 2. 按维度展开

### 2.1 作用范围

**Cursor `.cursor/rules`** = "这个项目里 Cursor 应该怎么干活"
- 你换到 Claude Code 打开同一个项目，`.cursor/rules` 不会被 Claude 读到
- 改用 Codex CLI，rules 完全不识别

**Harness** = "这个项目的工程标准"（与 IDE 无关）
- `.harness/engineering-harness.md` 是项目 SSOT
- `harness://skills/*` 通过 MCP 协议被 Cursor / Claude / Codex 任一调用方读取
- 即使没 AI，团队成员也能 `cat .harness/engineering-harness.md` 看规范

### 2.2 跨 agent 一致性

如果你的团队里：
- A 用 Cursor + Claude Sonnet
- B 用 Claude Code + Opus
- C 用 Codex CLI + GPT-5

**没 harness 的情况**：A、B、C 三个人写出来的代码风格、ADR 习惯、Gate Review 流程**完全不一致**。Cursor rules 帮不到 B 和 C；Claude memories 帮不到 A 和 C。

**有 harness 的情况**：三方都通过 MCP 调用 `harness_route_task` / `harness_load_skill`，**路由表 + skill 内容是同一份**。

### 2.3 跨会话记忆

**Claude memories**：是 Claude 内部的"长期记忆"，**只对你这一个 Claude 账号生效**。换台机器、换账号、给同事看——记忆都跟不过去。

**Harness features/01-06**：是**仓库文件**。
- 周一 Cursor + Sonnet 写了 01_REQUIREMENT_ANALYSIS.md
- 周三在家用 Claude Code + Opus 接着改 → 它能读到周一的需求分析
- 同事接手 → 读 01-06 不用你复述

**记忆载体**：Claude 在它的服务器 vs harness 在你的 git 仓库。**git 才是真正的"跨人 / 跨机 / 跨时间"硬通货**。

### 2.4 配置可演进性

| 工具 | 升级方式 |
|---|---|
| `.cursor/rules` | 手工编辑 .mdc，没有"我从 solo 升到 mid-team 该补什么"的引导 |
| `CLAUDE.md` | 手工编辑，同上 |
| `CONVENTIONS.md` | 手工编辑，同上 |
| **harness** | `harness upgrade_mode --to=mid-team` **自动累加** CHANGELOG / CODEOWNERS / SLO / oncall 这些团队规模升级才需要的产物，**已存在的不动**。 |

这一点对**长期演进**的产品至关重要——你不需要每次都重读"团队 5 人时该新增哪些规范"。

### 2.5 强制门 vs 软建议

`.cursor/rules` 是软建议——LLM 读到后**有几率忽略**（即使 Opus 4.7 也有几率）。

**harness 路由器**是确定性逻辑：
```
任务文本 "后端加张订单表" → regex 匹配 "表" → tag M4 → 强制 forced_upgrade=dev-flow-doc-be
```

**LLM 想跳也跳不过**——因为路由决策在 LLM 推理之前已经做好了，返回的 skill 名是硬性的。这是**安全网**，不是描述性建议。

### 2.6 Token 经济性

主流方案（Cursor rules / CLAUDE.md / CONVENTIONS.md）都是**直接进 prompt**——每轮对话都重复消耗这些 token。

harness 的 `harness://` URI 走 **MCP 资源协议**：
- AI 调用 `harness_load_skill` 时 IDE 把内容塞到那一轮上下文
- 不主动调用就不占 token
- spec / rules 全集可以**按需懒加载**

200K 上下文的 Opus 4.7 也不能浪费——一份 ai-efficiency 6 铁律占 600 tokens，跨 30 轮对话 = 18K tokens 直接省掉。

---

## 3. 它们各自不能替代什么

### Cursor `.cursor/rules` **不能替代**

- 给非 Cursor 用户提供规范
- 给非 AI 同事看的工程治理
- 给 CI / GitHub Actions 用的门禁
- 跨会话 / 跨人的任务记忆
- 数据库 / 支付变更的强制升档

### Claude `CLAUDE.md` **不能替代**

- 跨 agent 一致性（GPT / Codex 读不到）
- 团队级 SSOT（每个人的 CLAUDE.md 可能不一样）
- 落盘的审计证据
- 模式升级时增量补齐

### Aider `CONVENTIONS.md` **不能替代**

- IDE 内集成（Aider 是 CLI 工具）
- MCP 生态对接（资源 URI / 工具调用）
- 强制门 / Gate Review

### **harness-engineering 不能替代什么**

也实事求是：

- **Cursor rules 的便利性**：写 `.cursor/rules/foo.mdc` 后 Cursor 自动按 glob 注入，**比 harness 加载 skill 还省一步**。如果你**只**用 Cursor 且不在乎跨 IDE，rules 更轻量。
- **Claude memories 的连续性**：你的个人偏好（"叫我 lcc"、"用中文回复"）放 Claude memories 更对路，harness 不管这种。
- **Aider 的 git 集成深度**：Aider 自动 commit / undo / dry-run 这套和代码改动深度耦合，harness 没有同等机制。
- **某些专门工具的能力**：harness 不是 type-checker、不是 lint 工具、不是 dependency manager。它是治理**架子**，具体执行靠 `npm test` / `mvn test` / `pytest` 这些专业工具。

---

## 4. 共存方案（最常见）

**Harness 不与上述工具竞争，而是补全跨工具协作层**：

```
项目根/
├── .harness/                           ← 跨 IDE / 跨 agent SSOT（harness 管）
│   ├── config.json                     工程治理基线
│   ├── engineering-harness.md          团队规范 SSOT
│   ├── features/...                    跨会话任务记忆
│   └── ...
├── .cursor/rules/*.mdc                 ← Cursor 用户的快捷规则（rules 管）
│   └── 16-ai-efficiency.mdc            （由 harness 提供模板）
├── CLAUDE.md                           ← Claude 用户的开场白（memories 管）
├── CONVENTIONS.md                      ← Aider 用户的约定（aider 管）
└── .github/                            ← GitHub 平台约定
    ├── CODEOWNERS                      （harness upgrade_mode 生成）
    └── pull_request_template.md        （harness init 生成）
```

**对应关系**：
| 关注层 | 用什么 |
|---|---|
| 「这个文件做什么」 | 注释 + JSDoc |
| 「Cursor 在 .ts 文件里要遵守什么」 | `.cursor/rules/*.mdc` |
| 「Claude 在这个项目用什么语气」 | `CLAUDE.md` |
| 「Aider 改代码时的约定」 | `CONVENTIONS.md` |
| **「这个项目的工程治理 / 跨 agent 一致性 / 模式升级 / 强制门 / 任务记忆」** | **harness** |

可以把 harness 看作"**底座**"——其它工具构建在它的标尺上。事实上，`harness init` 会生成 `.cursor/rules/16-ai-efficiency.mdc`，让 Cursor 用户也能享受 harness 的 AI 效率规则。

---

## 5. 决策树：你该用什么？

```
你的场景是？
├── 单人 / Prototype / 一次性脚本
│   └── 用 Cursor rules 或 CLAUDE.md 就够了，harness 是 overkill
│
├── 单人 / 维护周期 1-3 个月
│   ├── 强模型（Opus 4.7 / GPT-5）+ 单 IDE
│   │   └── Cursor rules + harness URI 缓存 / check 门禁 即可
│   └── 弱模型 / 多模型混用
│       └── harness 整套（路由 + skills + 门禁）
│
├── 2-5 人小团队
│   └── harness solo→small-team 升档 + git 共享 .harness/
│
├── 5-15 人中型团队
│   └── harness mid-team 升档（+ CODEOWNERS / SLO / oncall）
│       └── 配合 .cursor/rules + CLAUDE.md（各人偏好层）
│
└── 跨团队 / 跨公司 / 合规审计
    └── harness org mode 全开（+ DORA / SBOM / RFC / 合规附件）
        └── + 各人偏好层
```

---

## 6. 常见疑问

### Q1. 我已经有 `.cursor/rules` 了，还要 harness 干嘛？

如果**只**用 Cursor 一家、单人开发、项目寿命短 → `.cursor/rules` 够了。

但只要满足以下任一项，harness 就有 ROI：
- 团队 ≥ 2 人 → 需要共享 SSOT
- 用了不止一家 IDE → rules 跨不过去
- 有非 AI 协作者 → 他们读不懂 `.mdc`，但能读 `.harness/engineering-harness.md`
- 涉及 DB / 鉴权 / 支付 → 需要强制升档
- 需要 CI 跑门禁 → rules 不能在 CI 跑

### Q2. Harness 会和 Cursor rules 冲突吗？

不会。`harness init` 会**主动生成** `.cursor/rules/16-ai-efficiency.mdc`，把 harness 的 AI 效率规则塞到 Cursor 里。两者是**互补的**——rules 负责 "Cursor 这一家怎么干"，harness 负责"项目整体怎么治理"。

### Q3. 学习曲线如何？

| 工具 | 学习曲线 |
|---|---|
| Cursor rules | 5 分钟（写个 .mdc） |
| Claude memories | 30 秒（一句话）|
| Aider conventions | 10 分钟 |
| **harness** | **30 分钟看完 README + USAGE，但很多动作 AI 自动做了**。日常使用：你只说业务，AI 路由 / 加载 / 检查全自动 |

### Q4. 它取代 ESLint / Prettier / Husky 吗？

**不**。这些是具体工具，harness 是**编排层**：
- `harness_check tests.exec` 会 spawn `npm test`（实际工具：vitest / jest）
- `secrets.envfile` 是 harness 内置（不需要外部工具）
- 用户自己的 ESLint / Prettier / Husky 继续按原方式运行，harness 不取代

### Q5. 我什么时候不应该用 harness？

诚实清单：

- ❌ 你的项目是**一次性写完就丢**的脚本
- ❌ 你**只**在意 Cursor / **只**在意 Claude，不打算换
- ❌ 你的团队**不接受形式化流程**，宁可裸跑
- ❌ 你**不写 git**（harness 大量假设有 git 历史）
- ❌ 项目**小到一个文件**

---

## 7. 我们的定位

**harness-engineering 不和上述任何工具竞争。**

我们填补的空隙是：「**当 IDE / agent / 模型不断更替时，项目本身的工程治理需要一个不变的、机器可读、人也可读、跨工具的统一层**」。

- IDE 会变（Cursor → Claude Code → 明天的某新 IDE）
- 模型会变（Sonnet → Opus → 明年的某新模型）
- 团队会变（solo → 5 人 → 50 人）
- **项目的工程标准不该跟着变**——它该是项目自身的资产

这就是 `.harness/` 存在的理由。

---

## 8. 进一步阅读

- [`README.md`](../README.md) — 工具概览
- [`docs/USAGE.md`](USAGE.md) — 5 个真实场景走通
- [`docs/IDE_DAILY_USAGE.md`](IDE_DAILY_USAGE.md) — 装好后每天怎么用
- [`docs/EXECUTION_FLOW.md`](EXECUTION_FLOW.md) — 9 个流程时序图
- [`assets/spec/PRIORITY_HIERARCHY.md`](../assets/spec/PRIORITY_HIERARCHY.md) — L0-L4 规范优先级（说明 harness 在整个规范体系里的位置）
