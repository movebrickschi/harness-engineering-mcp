---
spec_id: harness-spec-dora
applies_to: [mid-team, org]
min_level: L3
optional_for: [solo, small-team]
project_types: [backend-service, library, cli, frontend-spa]
---

# DORA - 四指标自证

> 用 DORA 四指标度量 Harness 自身是否有效。L3+ 必做；L1-L2 可选了解。

DORA 来自 Google "Accelerate" 研究，是工程效能领域接受度最广的度量框架。

## 1. 四指标

| 指标 | 定义 | 健康阈值（参考） |
| --- | --- | --- |
| Deployment Frequency | 部署到生产环境的频率 | Elite: 多次/天；High: 周-月；Medium: 月-半年；Low: 半年+ |
| Lead Time for Changes | 提交到上线的耗时 | Elite: <1h；High: 1d-1w；Medium: 1w-1m；Low: 1m+ |
| Change Failure Rate | 部署后导致故障的比例 | Elite/High: 0-15%；Medium: 16-30%；Low: 31%+ |
| MTTR | 故障从发生到恢复的平均时间 | Elite: <1h；High: 1d；Medium: 1d-1w；Low: 1w+ |

## 2. 采集来源

| 指标 | 主数据源 | 采集方式 |
| --- | --- | --- |
| Deployment Frequency | CI 部署任务 | 每次 prod 部署写入数据库 / 看板 |
| Lead Time | git + CI | commit 时间 - prod 部署时间 |
| Change Failure Rate | 故障台账 + 部署记录 | 故障 / 部署总数 |
| MTTR | 故障台账 | 故障开始 - 故障恢复 |

## 3. 实施步骤

### 3.1 起步：手工记录（L2 -> L3 过渡）

1. Excel / Notion 维护「部署日志」「故障日志」表
2. 每月手工统计四指标
3. 月度复盘讨论一次

### 3.2 标准化：埋点 + dashboard（L3）

1. CI 部署任务自动写入指标存储
2. 故障台账系统集成
3. dashboard 实时展示当月趋势

### 3.3 自适应：闭环改进（L4）

1. 触发预警时自动建 issue 给 platform team
2. 季度 OKR 与 DORA 联动
3. 跨项目对齐基线

## 4. 看板模板

参考 [`templates/knowledge/dora-dashboard.md.tmpl`](templates/knowledge/dora-dashboard.md.tmpl)。最简版：

```markdown
# DORA Metrics - 2026 Q1

| 指标 | 本月 | 上月 | 季度均值 | 趋势 |
| --- | --- | --- | --- | --- |
| 部署频率 | 12/周 | 10/周 | 11/周 | 上 |
| Lead Time | 2.5d | 3d | 2.7d | 优 |
| Change Failure Rate | 12% | 18% | 14% | 优 |
| MTTR | 45min | 1.5h | 1h | 优 |
```

## 5. 反模式

- **只看不动**：报表月月出，从不指导改进 -> 等于没采集
- **指标作弊**：拆小 PR 刷部署频率 / 不上报小故障刷 CFR
- **单指标极端化**：只追求部署频率忽视失败率
- **没有目标**：基线写 0，永远"在改进"

## 6. 与其他模块的关系

- 部署频率与 Release 节奏 -> [`04-release-and-operations.md`](04-release-and-operations.md) §9
- Change Failure Rate 与 Post-mortem -> [`06-knowledge-and-memory.md`](06-knowledge-and-memory.md) §4
- MTTR 与回滚 / Runbook -> [`04-release-and-operations.md`](04-release-and-operations.md) §4 / §7
- Lead Time 与 Code Review SLA -> [`01-people-and-collaboration.md`](01-people-and-collaboration.md) §4.3

## 7. 单人 / 小团队为何可选

- 单人项目：四指标自感知，不需要 dashboard
- 小团队：埋点成本 > 收益；可月度 stand-up 口头汇总即可

升档触发：跨多个团队 / 多产品 / 高用户量 / 合规要求。
