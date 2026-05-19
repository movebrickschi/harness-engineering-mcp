---
name: ai-efficiency
version: 0.1.0
description: Use whenever an AI agent executes a multi-step task to save tokens, parallelize tool calls, cache prompts, and keep replies under 2000 chars
applies_to: [all]
priority: P0
usage_frequency: daily
depends_on: [brainstorming, writing-plans, executing-plans]
related: [subagent-driven-development, find-skills]
---

# AI Efficiency · 高效执行 & 省 Token 清单

> 使用本 skill 的场景：
> - 任务规模 ≥ 3 个文件 / ≥ 50 行改动
> - 多轮对话已经在 6 轮以上还没完成
> - 用户/团队明确关心 token 成本
>
> 与 `assets/spec/AI_EFFICIENCY.md` 是「契约 / 执行」对应关系——契约写规则，本 skill 是把规则翻译成**当下就能照做的清单**。

---

## Phase 0 · 入场 30 秒自检

1. **是不是 3 步以内的小事**？是 → 直接做，不要拉 skill 链。
2. **是不是已经有 plan**？没有 → 先 `writing-plans` 出最小计划，**再**动手。
3. **是不是跨 ≥ 3 文件 / 跨模块**？是 → 委派 subagent。
4. **是不是已经发生过 ≥ 6 轮往返且没收敛**？是 → 中止，回到 §6 模式切换。

---

## Phase 1 · 检索（找到正确的几个位置）

### 1.1 工具优先级

```
Grep "确切字符串" > Glob "src/path/**/*.ts" > SemanticSearch "意图问句" > Read 全文
```

### 1.2 一次问对，少问多次

| 反模式 | 正确做法 |
|---|---|
| `Grep "user"` （命中数百）| `Grep "class UserService " --type ts` |
| 在 monorepo 找东西 | `Grep ... --path packages/api/src` |
| 不知道命中多少 | 先用 `output_mode: "count"` 看一次 |

### 1.3 并行批发

独立的 3 个 Grep / Read，一次性发出去：

```
batch:
  Grep "patternA"
  Grep "patternB"
  Glob "src/**/types.ts"
```

---

## Phase 2 · 阅读（用最少 token 拿到上下文）

### 2.1 切片不全读

```
小文件 < 200 行：直接 Read
中文件 200-800 行：Read offset/limit，分 2-3 段
大文件 > 800 行：先 Grep 定位，再 Read offset/limit
```

### 2.2 不重复粘贴

如果 L0（spec / rule）/ L1（项目配置）已经被加载过，**不要**在回复里复制其中段落。指向资源 URI 即可。

### 2.3 摘要替代原文

读完后用 1-2 句给主会话摘要，不要把原文塞回。

---

## Phase 3 · 修改（让改动安全 & 可被 cache）

### 3.1 StrReplace 优先于重写

- 改 ≤ 3 处 → 用 `StrReplace`
- 改 ≥ 整个函数 / 重大重构 → 用 `Write` 重写**单个文件**
- 跨文件大改 → 拆成 N 次 `StrReplace`，每次原子

### 3.2 一次改一个语义单元

```
反模式：一个 StrReplace 把 Class A 拆成 A + B + C 三个文件
正确  ：先 StrReplace 抽出 A 的接口；再 Write 新增 B；再 StrReplace 让 C 引用
```

每步都让代码处于可编译态，便于回退。

### 3.3 改完立刻验证

```
StrReplace → ReadLints → npm test --run （仅本文件相关测试） → 下一步
```

不要堆 10 个改动一起 commit，回滚成本巨大。

---

## Phase 4 · 验证（最少跑测试拿到 PASS 证据）

### 4.1 跑被影响的子集

| 反模式 | 正确做法 |
|---|---|
| 每次都 `npm test` 全量 | `npm test -- --runRelatedTests src/foo.ts` |
| Java 跑全模块 | `mvn -pl module-x test` |
| Python `pytest` 全 | `pytest tests/test_foo.py -q` |

### 4.2 只在最后做 `harness check --strict --run-tests`

任务收尾时一次全局门禁，不要每改一行跑一次。

### 4.3 失败 → root cause first

测试红了优先用 `systematic-debugging` skill 找根因，而不是「让我再调一下看看」式打补丁。

---

## Phase 5 · 输出（短、结构化、可追踪）

### 5.1 回复结构（标准模板）

```markdown
## 做了什么
- 改了 src/foo.ts: …
- 加了 test/foo.spec.ts: …

## 验证
- npm test --runRelatedTests src/foo.ts → PASS
- harness check --strict → WARN（与本任务无关）

## 风险 / 后续
- 1 句以内
```

### 5.2 每段 ≤ 2000 字符

超过就拆段，不要硬塞。表格永远比散文省 token。

### 5.3 禁用废话

- ❌「我会仔细思考」「让我先理解一下」（默认会做的事不必说）
- ❌「希望这个回答对你有帮助」
- ✅ 直接给结论 / 给代码 / 给数据

---

## Phase 6 · 卡住时切模式

当出现下列任一现象：

- 同一 bug 已 3 次尝试未修
- 上下文逼近模型 limit
- 工具调用循环（输出和上一轮基本一致）

立刻切到：

1. **委派 subagent** → `subagent-driven-development` skill
2. **倒回写计划** → `writing-plans` skill 强制重新拉齐
3. **缩短输出** → 严格 < 1000 字符
4. **重启会话** → 主会话上下文整理为 1 段摘要后开新会话继续

---

## 自检（每次完成任务前过一遍）

- [ ] 单次回复 < 2000 字符
- [ ] Grep / Glob 调用次数 ≥ Read 全文次数
- [ ] 大于 3 文件的检索都委派给 subagent
- [ ] 改动按语义单元拆分，每步可回退
- [ ] 跑了**被影响的**测试子集，没盲跑全量
- [ ] 输出结构化（表格 / 短列表），无废话

不到 6 条达标，回到 Phase 1 重新跑一遍流程。

---

## 相关工具调用速记

| 场景 | 推荐工具调用 |
|---|---|
| 找一个 class 在哪里 | `Grep "class FooService " --type ts -l` |
| 列 dev-flow 的所有 skill | `harness_list skills` |
| 读 spec 不污染主上下文 | 用 MCP 资源 `harness://spec/index` |
| 跑当前任务相关测试 | `harness check --categories tests --run-tests` |
| 起一份 PRD 计划 | `harness_load_skill name=writing-plans` |
