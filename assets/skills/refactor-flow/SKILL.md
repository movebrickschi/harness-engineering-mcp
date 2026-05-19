---
name: refactor-flow
description: |
  代码重构 / 整理。任何重构必须先有覆盖待重构区域的测试网；分步原子 commit；每步
  绿测，不允许"大爆炸式重构"。性能/行为变更属于 perf-flow / dev-flow，不在此范围。
  Use when refactoring code, cleaning up tech debt, or restructuring without behavior change.
  Voice triggers: "重构", "整理代码", "/refactor-flow".
---

# refactor-flow

## 适用场景

不改外部行为，只改内部结构（rename、提取函数、模块拆分、消除重复等）。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外 `refactor_target`（要重构的模块/文件/目录）。

## 流程步骤

### 阶段 0 · 上下文初始化

`move_agent_to_root`；建知识库目录（极简 `META.md`）。

### 阶段 1 · 现状评估

- 用 `/health` 跑当前分数
- 用 explore subagent 列出待重构区域的：依赖入度 / 出度 / 测试覆盖率 / 已知 TODO/FIXME
- 输出 `REFACTOR_BASELINE.md`（行为基线 + 健康分基线）

### 阶段 2 · 测试网铺设

- 检查覆盖率：若未覆盖，**先补足覆盖到 70%+**
- commit：`test(scope): 补充重构前覆盖测试`
- 这一步不通过不许进入阶段 3

### 阶段 3 · 重构方案 + 卡点

```text
prompt: "测试网就绪，重构方案如下：[方案 A 一句话摘要]。请确认："
options:
  - "方案 OK，分步执行"
  - "需要修改方案（说明）"
  - "暂不重构（关闭流程）"
```

### 阶段 4 · 分步原子 commit

每步：
- 改一小块 → 跑测试全绿 → commit `refactor(scope): 中文描述`
- 任意一步测试不绿 → 立即 revert 该步，不允许"先红着提交后续修"

### 阶段 5 · 验证无行为变化

- `/qa`（重点跑回归）
- `/health` 分数应**持平或上升**
- `/review`

### 阶段 6 · 上线

`/ship` → `/land-and-deploy` → `/canary`（监控同模块错误率，确认与基线一致）。

### 阶段 7 · 复盘

append `_lessons.md`：重构动因 + 收益（健康分变化）+ 成本（工时）。

## 错误处理

- 覆盖率不达标且短期补不齐 → 退化为"小范围 PR + 大量手动验证"，明确告知用户风险
- 重构暴露隐藏 Bug → **暂停重构**，先按 `/bugfix-flow` 修复 + 上线，再回来继续
- 重构后健康分下降 → 不允许 ship，回阶段 4 检查

## 产物清单

`META.md`、`REFACTOR_BASELINE.md`、补测试 commit、若干原子重构 commit、`/health` 前后对比、PR 链接。

## 支持的修饰符

无。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- 若过程中发现 Bug → 切换到 `/bugfix-flow`
- 若实际目的是性能 → 切换到 `/perf-flow`
- 自查：`/qa`、`/health`、`/review`
- 上线：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
