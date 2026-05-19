---
name: bugfix-flow
description: |
  Bug 修复全流程。强制 /investigate 找根因，禁止"看似修好就交付"。/freeze 锁定文件
  防止顺手"清理"无关代码；先写复现失败测试再写修复。
  Use when reporting bugs, errors, 500s, stack traces, or "it stopped working" type issues.
  Voice triggers: "修 bug", "/bugfix-flow", "bugfix".
version: 0.1.0
applies_to: [all]
priority: P1
usage_frequency: weekly
depends_on: [systematic-debugging]
related: [root-cause-tracing, test-driven-development, verification-before-completion]
---

# bugfix-flow

## 适用场景

线上/线下报告的 Bug、错误、栈追踪、"以前能用现在不行"。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外需要 `bug_report`（用户描述 / 截图 / 日志）。

## 流程步骤

### 阶段 0 · 上下文初始化

`move_agent_to_root`；建知识库目录（极简 `META.md`）；如有 `_lessons.md` 加载；用 `/learn` 检索"曾经修过类似问题"。

### 阶段 1 · 现象固化

```text
prompt: "请提供 Bug 信息（可全选）："
options:
  - "已粘贴报错堆栈/日志"
  - "已提供复现步骤"
  - "已提供截图/录屏"
  - "需要我用 cursor-ide-browser 自己复现"
allow_multiple: true
```

把现象写入 `BUG_REPORT.md`：环境 / 步骤 / 实际 vs 预期 / 频率。

### 阶段 2 · 根因调查（强制 `/investigate`）

- 调用 `/investigate` 走完 4 阶段（investigate/analyze/hypothesize/implement）
- **铁律**：未找到根因不许动手改代码
- 输出 `RCA.md`（模板见 _playbook.md Part E.10）

### 阶段 3 · 修复方案 + 卡点

```text
prompt: "根因已确认（RCA.md），修复方案有几种："
options:
  - "用方案 A（推荐）"
  - "用方案 B（备选，更保守）"
  - "需要更多调查（说明）"
```

### 阶段 4 · 写复现失败测试

- `git checkout -b fix/[short-slug]`
- **必须先写一个能复现 Bug 的失败测试**，commit：`test(scope): 复现 [bug 摘要]`

### 阶段 5 · 实施修复

- `/freeze` 锁定相关目录，避免"顺手清理"无关代码
- 写最小修复 → 同一测试由红变绿 → commit：`fix(scope): 修复 [bug 摘要]`
- `/unfreeze`

### 阶段 6 · 回归检查

- `/qa` quick + `/review`
- 跑 `IMPACT_ANALYSIS.md` 列出的回归点
- 跑 `/cso` 若涉及鉴权/数据可见性

### 阶段 7 · 上线

`/ship`（PR 描述带 `RCA.md` 链接）→ `/land-and-deploy` → `/canary`。

### 阶段 8 · 复盘

append `_lessons.md`：根因类型 / 怎么发现的 / 怎么避免再次发生。

## 错误处理

- 找不到根因 → 不允许"猜着改"，继续 `/investigate` 或升级请求帮助
- 修复后回归测试失败 → 立即 revert 修复 commit，回阶段 2 重做调查
- "改完之后看似 OK，没有失败测试" → 不接受，要求补失败测试

## 产物清单

`META.md`、`BUG_REPORT.md`、`RCA.md`、复现失败测试 commit、修复 commit、`/qa` 报告、PR 链接。

## 支持的修饰符

无标准修饰符；可叠加 `M4`（如修复涉及数据修复脚本）→ 必须在 `RCA.md` 加"数据修复说明 + 回滚方案"。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- **强依赖 `/investigate`**
- 自查：`/qa`、`/review`、`/cso`
- 上线：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
