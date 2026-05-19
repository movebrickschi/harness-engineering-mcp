---
name: third-party-flow
description: |
  接入第三方服务（支付 / IM / OAuth / 短信 / OSS 等）。强制输出 Vendor 适配层，
  应用层只用领域接口，不直接调用 SDK；强制密钥/Webhook 安全审计；强制沙箱 + 失败
  重放剧本。
  Use when integrating with third-party services or SDKs.
  Voice triggers: "接第三方", "/third-party-flow", "接入 SDK", "对接".
---

# third-party-flow

## 适用场景

接入支付、IM、OAuth、短信、OSS、地图、AI Provider 等任意第三方服务/SDK。

## 前置条件

确认 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B.3** 启动参数；额外 `vendor_name`、`vendor_doc_url`、`use_case`（一句话描述用途）。

## 流程步骤

### 阶段 0 · 上下文初始化

`move_agent_to_root`；建知识库目录（极简 `META.md`）。

### 阶段 1 · 文档与契约调研

- 读官方文档；列出能力 / 限制 / 计费 / 配额 / 错误码
- `cursor-ide-browser` 打开 vendor 文档示例页面，必要时跑一遍其 demo
- 输出 `VENDOR_NOTES.md`：能力清单、关键限制、错误码、SLA、计费模式

### 阶段 2 · 安全与合规检查

```text
prompt: "本次接入是否涉及："
options:
  - "用户敏感数据（身份证 / 手机号 / 支付 / 健康）"
  - "Webhook 回调（vendor 反向推送给我们）"
  - "需要存储 vendor 颁发的 token / refresh_token"
  - "以上都不是"
allow_multiple: true
```

任一勾选 → 阶段 7 必做 `/cso`，且 `IMPLEMENTATION_PLAN.md` 必须含密钥管理与回调签名校验方案。

### 阶段 3 · 适配层方案 + 卡点

- 设计领域接口（`PaymentGateway`、`SmsSender` 等抽象）
- vendor SDK 仅在适配层使用，应用层一律调领域接口
- 输出 `IMPLEMENTATION_PLAN.md`：适配层接口 + DTO 转换 + 错误映射 + 重试/超时策略
- **卡点**：

```text
prompt: "适配层方案如下：[一句话摘要]。请确认："
options:
  - "方案 OK，进入实现"
  - "需要修改方案（说明）"
  - "需要先做更多 vendor 调研"
```

### 阶段 4 · 沙箱实现

- 用 vendor 的 sandbox / test mode 跑通最小路径
- 派 `backend-agent`（适配层）+ `test-agent`（契约 + 错误码 + Webhook 签名）
- commit：`feat(scope): 接入 [vendor] 沙箱`

### 阶段 5 · 失败剧本演练

按 vendor 错误码列表，**主动注入失败**：网络超时 / 401 / 429 / 5xx / 签名错误 / 重复回调；
确认每种情况都有合理处理（重试 / 降级 / 告警）。输出 `FAILURE_PLAYBOOK.md`。

### 阶段 6 · 切到生产 vendor

- 切换密钥/endpoint
- 在预发跑一次最小金额/最小动作的真实调用
- 确认账单/日志/监控就位

### 阶段 7 · 自查

- `/cso`（**必做**：密钥不入库、Webhook 签名校验、敏感字段日志脱敏）
- `/qa` + `/review`

### 阶段 8 · 上线

`/ship` → `/land-and-deploy` → `/canary`（重点监控 vendor 错误率、回调延迟）。

### 阶段 9 · 复盘

append `_lessons.md`：vendor 坑点 / 错误码处理模式 / 限流抗压数据。

## 错误处理

- vendor 文档与实际行为不符 → 在 `VENDOR_NOTES.md` 标注，必要时联系 vendor 支持
- 沙箱与生产差异大 → 阶段 6 拉长真实调用验证窗口
- 密钥误提交到 git → 立即吊销 + 重发；按 _playbook.md Part B.5"事故应对"处理

## 产物清单

`META.md`、`VENDOR_NOTES.md`、`IMPLEMENTATION_PLAN.md`、适配层代码、`FAILURE_PLAYBOOK.md`、`/cso` 报告、PR 链接。

## 支持的修饰符

- **M3 新项目** → 阶段 4 同时落地适配层模板，写入 `ARCHITECTURE.md`，便于未来同类 vendor 复用
- **M4 数据库迁移**（如要存储 vendor 数据/log）→ 必出 `MIGRATION_PLAN.md`

详细 delta 见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part D**。

## 与其他 skill 的关系

- 通常被 `/dev-flow` 路由到（也可被用户直接触发）
- **强依赖 `/cso`**
- 派发：`backend-agent`、`test-agent`
- 自查：`/qa`、`/review`、`/cso`
- 上线：`/ship`、`/land-and-deploy`、`/canary`

## 附录

- 通用基座：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part B**
- 文档模板：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part E**
- 完整索引：见 [_playbook.md](file:///c:/Users/Administrator/Projects/_requirements/_playbook.md) **Part F**
