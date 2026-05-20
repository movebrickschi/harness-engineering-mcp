# Harness Engineering MCP · 执行流程图

> 本文档包含 harness-engineering-mcp 全部 7 个 MCP 工具的交互流程图。
> 所有图表使用 Mermaid 格式，可在 GitHub / Cursor / Typora 等支持 Mermaid 的编辑器中直接渲染。

---

## 目录

1. [项目初始化流程（harness_init）](#1-项目初始化流程harness_init)
2. [任务路由决策树（harness_route_task）](#2-任务路由决策树harness_route_task)
3. [日常任务执行时序（route + load_skill + check）](#3-日常任务执行时序)
4. [工程门禁检查（harness_check）](#4-工程门禁检查harness_check)
5. [闸门评审（harness_gate_review）](#5-闸门评审harness_gate_review)
6. [团队升档（harness_upgrade_mode）](#6-团队升档harness_upgrade_mode)
7. [端到端全链路（高风险任务完整流程）](#7-端到端全链路)
8. [Modifier 检测逻辑（M1-M5）](#8-modifier-检测逻辑)
9. [项目卸载（harness_uninstall）](#9-项目卸载harness_uninstall)

---

## 1. 项目初始化流程（harness_init）

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant AI as AI Agent
  participant MCP as harness MCP Server
  participant FS as 项目文件系统

  U->>AI: 给当前项目接入 Harness Engineering
  AI->>MCP: harness_init({ cwd })

  rect rgb(240,248,255)
    Note over MCP,FS: Scanner 阶段 · 确定性规则扫描
    MCP->>FS: 逐个探测 pom.xml / package.json / go.mod / pyproject.toml 等
    FS-->>MCP: 文件指纹 + 权重投票
    MCP->>FS: 读 package.json.name / pom.xml artifactId / pyproject.toml name
    FS-->>MCP: 项目名
    MCP->>FS: 推断项目类型（SPA / CLI / service 等）
    FS-->>MCP: project_type
  end

  alt 信息齐全
    MCP-->>AI: status=completed, detected, generated_files
  else 缺少字段
    MCP-->>AI: status=needs_input, ask_user=[缺失字段]
    AI->>U: 扫描到 node-typescript，项目名和模式没确定，请补充？
    U->>AI: 名叫 my-app，用 solo
    AI->>MCP: harness_init({ cwd, mode, stack, project_name })
  end

  rect rgb(255,248,240)
    Note over MCP,FS: Renderer 阶段 · Handlebars 模板渲染
    MCP->>FS: 写入 .harness/config.json（mode 对应的 modules 开关）
    MCP->>FS: 写入 .harness/baseline.json
    MCP->>FS: 写入 .harness/scripts/engineering-check.ps1 + .sh
    MCP->>FS: 写入 .harness/engineering-harness.md（SSOT）
    MCP->>FS: 写入 .harness/adr/0001-engineering-harness-baseline.md
    MCP->>FS: 写入 .harness/features/INDEX.md + _template/（7 个阶段模板）
    MCP->>FS: 写入 .github/pull_request_template.md
  end

  MCP-->>AI: status=completed, generated_files=[7-15], next_steps
  AI->>U: 已生成 7 个文件，建议下一步：harness_check 跑首次门禁
```

### Scanner 文件指纹权重表

| 检测文件 | 识别 stack | 权重 |
|---|---|---|
| `pom.xml` | `java-spring` | 30 |
| `build.gradle(.kts)` | `java-spring` | 25 |
| `package.json` | `node-typescript` | 30 |
| `tsconfig.json` | `node-typescript` | 15 |
| `pyproject.toml` | `python` | 30 |
| `requirements.txt` | `python` | 25 |
| `setup.py` | `python` | 20 |
| `go.mod` | `go` | 35 |

---

## 2. 任务路由决策树（harness_route_task）

```mermaid
flowchart TD
  task["一句话任务"] --> intent{Intent 分类<br/>正则匹配}

  intent -->|bug/error/500/崩溃| bugfix["bugfix-flow"]
  intent -->|重构/refactor/整理| refactor["refactor-flow"]
  intent -->|性能/慢/优化| perf["perf-flow"]
  intent -->|接入/对接/SDK| third["third-party-flow"]
  intent -->|新需求/feature| weight{评估输入形式}

  weight -->|has_prototype=true| proto["dev-flow-proto-*"]
  weight -->|has_prd=true| doc["dev-flow-doc-*"]
  weight -->|一句话需求| scope{推断开发范围<br/>前端词/后端词/都有}

  scope -->|前端词: 页面/列表/UI| oneFE["dev-flow-oneliner-fe"]
  scope -->|后端词: 接口/字段/SQL| oneBE["dev-flow-oneliner-be"]
  scope -->|都有或都没有| oneFull["dev-flow-oneliner-full"]

  oneFE & oneBE & oneFull --> upgrade{Modifier 检测<br/>+ 升级条件}

  upgrade -->|M4:DB 变更| forceDoc["强制升级 dev-flow-doc-*"]
  upgrade -->|M3:鉴权/多租户| forceDoc
  upgrade -->|支付/订单/钱包| forceDoc
  upgrade -->|估算>8h/跨多模块| forceDoc
  upgrade -->|无升级触发| keep["保留轻量 oneliner"]

  style bugfix fill:#ffcccc
  style refactor fill:#cce5ff
  style perf fill:#fff3cd
  style third fill:#d4edda
  style forceDoc fill:#f8d7da
  style keep fill:#d1e7dd
```

### 升级触发条件（从 oneliner 强制升级到 doc 流程）

| 触发条件 | 关键词正则 |
|---|---|
| DB schema 变更 | `数据库/DB/schema/表结构/建表/migration/flyway/liquibase` |
| 鉴权 / 多租户 | `鉴权/权限/auth/租户/多租户` |
| 支付 / 订单 / 钱包 | `支付/订单/钱包/wallet/payment` |
| 工时过大 / 跨多模块 | `>=8h/超过8小时/大改/跨N模块` |

---

## 3. 日常任务执行时序

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant AI as AI Agent
  participant MCP as harness MCP

  U->>AI: 列表加个状态筛选
  AI->>MCP: harness_route_task({ task:"列表加个状态筛选" })
  MCP-->>AI: skill=dev-flow-oneliner-fe<br/>modifiers=[M2]<br/>forced_upgrade=null<br/>efficiency_hints=[4条]
  AI->>MCP: harness_load_skill({ name:"dev-flow-oneliner-fe" })
  MCP-->>AI: SKILL.md 正文（含流程步骤 + 反例 + 交付清单）

  rect rgb(240,255,240)
    Note over AI,U: AI 按 SKILL.md 执行
    AI->>U: MINI_PRD（5行）→ 确认?
    U->>AI: ok
    AI->>AI: 切片实现（改文件 + diff）
  end

  AI->>MCP: harness_check({ cwd, run_tests:true })
  MCP-->>AI: PASS · Tests 23 passed
  AI->>U: 全绿，建议 commit: "feat(user): add status filter"
```

### 日常 6 回合节拍

| 回合 | 用户说 | AI 自动执行 |
|---|---|---|
| ① 描述需求 | "列表加一个状态筛选" | `harness_route_task` → 路由 |
| ② 确认方向 | "按这个 skill 走" | `harness_load_skill` → 加载 SKILL.md |
| ③ 切片实现 | "ok，开始写代码" | 按 SKILL 切片顺序改文件 |
| ④ 测试 | "跑一下测试" | `harness_check --run-tests` |
| ⑤ 自检 | "提交前体检" | `harness_check --strict` |
| ⑥ 提交 | "可以提交了" | 写 commit message |

---

## 4. 工程门禁检查（harness_check）

```mermaid
flowchart LR
  input["harness_check<br/>cwd + categories<br/>+ strict + run_tests"] --> loader["加载<br/>.harness/config.json"]

  loader --> checks["12 项 Check"]

  subgraph checks_detail ["Check 清单"]
    direction TB
    c1["config.exists · config.valid"]
    c2["structure.ssot · structure.adr · structure.features"]
    c3["secrets.envfile"]
    c4["tests.directory · tests.command"]
    c5["baseline.exists · baseline.valid"]
    c6["docs.readme"]
    c7["tests.exec（仅 run_tests=true）"]
  end

  checks --> c1 & c2 & c3 & c4 & c5 & c6 & c7

  c7 -->|run_tests=true| exec["spawn 真实命令<br/>npm test / mvn test / pytest"]

  checks_detail --> agg{汇总 status}
  agg -->|任一 FAIL| fail["FAIL · exitCode=1"]
  agg -->|strict + 有 WARN| fail
  agg -->|有 WARN| warn["WARN"]
  agg -->|全 PASS| pass["PASS"]

  style fail fill:#f8d7da
  style warn fill:#fff3cd
  style pass fill:#d1e7dd
```

### check_id 全集

```
config.exists · config.valid
structure.ssot · structure.adr · structure.features
secrets.envfile
tests.directory · tests.command · tests.exec
baseline.exists · baseline.valid
docs.readme
```

---

## 5. 闸门评审（harness_gate_review）

```mermaid
sequenceDiagram
  autonumber
  participant AI as AI Agent
  participant MCP as harness MCP
  participant FS as 文件系统

  Note over AI: 高风险任务（DB变更/鉴权/支付）

  AI->>MCP: harness_gate_review({ cwd, feature_name:"order-create", action:"generate" })
  MCP->>FS: 读取模板 03_GATE_REVIEW.md
  MCP->>FS: 写入 .harness/features/order-create/03_GATE_REVIEW.md
  MCP-->>AI: status=generated, file_path

  Note over AI: AI 填充内容（回滚SQL/鉴权策略/测试计划等）

  AI->>MCP: harness_gate_review({ cwd, feature_name:"order-create", action:"check" })
  MCP->>FS: 读取 03_GATE_REVIEW.md
  MCP->>MCP: 扫描 BLOCKER bullet / B-N 表行 / 结论勾选

  alt 有 BLOCKER 或结论未勾选
    MCP-->>AI: status=blocked, blockers=["缺少回滚SQL","鉴权策略缺失"]
    AI->>AI: 必须先解决 BLOCKER，不能继续写代码
  else 无 BLOCKER 且结论已勾选通过
    MCP-->>AI: status=passed
    AI->>AI: Gate Review 通过，可以开始实现
  end
```

### Gate Review 通过条件

1. 文件中无 BLOCKER bullet 且无 B-N 表行
2. 结论一节的 `[x] 通过` 已勾选

两个条件**同时满足**才返回 `status=passed`。

---

## 6. 团队升档（harness_upgrade_mode）

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant AI as AI Agent
  participant MCP as harness MCP
  participant FS as 文件系统

  U->>AI: 升档到 mid-team
  AI->>MCP: harness_upgrade_mode({ cwd, to:"mid-team" })

  MCP->>FS: 读 .harness/config.json → from=solo
  MCP->>MCP: 计算增量文件清单

  rect rgb(240,248,255)
    Note over MCP,FS: 累积生成（已有文件跳过不覆盖）
    MCP->>FS: CHANGELOG.md → 已存在? skip : create
    MCP->>FS: .github/CODEOWNERS → create
    MCP->>FS: .harness/oncall.md → create
    MCP->>FS: .harness/SLO.md → create
  end

  MCP->>FS: 更新 .harness/config.json（mode→mid-team，modules 开关升级）
  MCP-->>AI: from=solo, to=mid-team, generated_files=[3 created, 2 skipped]

  AI->>MCP: harness_check({ cwd, strict:true })
  MCP-->>AI: 新门禁结果
  AI->>U: 升档完成，3 个新文件已生成，2 个已有文件保留不动
```

### 升档累积生成文件清单

| 目标 mode | 新增文件 |
|---|---|
| `small-team` | `CHANGELOG.md` · `.github/pull_request_template.md` |
| `mid-team` | `.github/CODEOWNERS` · `.harness/oncall.md` · `.harness/SLO.md` |
| `org` | `.harness/DORA.md` · `.harness/rfc/0000-template.md` · `.harness/SBOM.md` · `.harness/compliance/.gitkeep` |

---

## 7. 端到端全链路

> 以高风险任务"后端新增订单表和查询接口"为例，展示从路由到提交的完整流程。

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant AI as AI Agent
  participant MCP as harness MCP
  participant Git as Git

  U->>AI: 后端新增订单表和查询接口

  rect rgb(255,248,240)
    Note over AI,MCP: 阶段 1 · 路由
    AI->>MCP: harness_route_task({ task:"后端新增订单表和查询接口" })
    MCP-->>AI: skill=dev-flow-oneliner-be<br/>modifiers=[M4]<br/>forced_upgrade={to:"dev-flow-doc-be"}
    AI->>MCP: harness_load_skill({ name:"dev-flow-doc-be" })
    MCP-->>AI: SKILL.md 完整流程
  end

  rect rgb(240,255,240)
    Note over AI,U: 阶段 2 · PRD + 设计
    AI->>U: 触发强制升档，需要完整 PRD 流程
    AI->>AI: 生成 01_PRD.md
    AI->>AI: 生成 02_DESIGN.md（含迁移脚本+回滚SQL）
  end

  rect rgb(255,240,240)
    Note over AI,MCP: 阶段 3 · Gate Review
    AI->>MCP: harness_gate_review({ action:"generate", feature_name:"order-create" })
    MCP-->>AI: 03_GATE_REVIEW.md 已生成
    AI->>AI: 填充 Gate Review
    AI->>MCP: harness_gate_review({ action:"check", feature_name:"order-create" })
    MCP-->>AI: status=passed
  end

  rect rgb(240,240,255)
    Note over AI,U: 阶段 4 · 实现
    AI->>U: Gate Review 通过，开始写代码
    AI->>AI: 迁移脚本 → 实体类 → Controller → Service → Mapper
  end

  rect rgb(248,248,240)
    Note over AI,MCP: 阶段 5 · 验证
    AI->>MCP: harness_check({ cwd, strict:true, run_tests:true })
    MCP-->>AI: PASS / WARN / FAIL

    alt 有 FAIL
      AI->>AI: 修复 → 重跑 harness_check（循环到绿）
    end
  end

  AI->>U: 全绿，生成 commit message
  AI->>Git: git add + git commit
  AI->>U: 完成，建议下一步发 PR
```

---

## 8. Modifier 检测逻辑

```mermaid
flowchart TD
  task["任务文本"] --> m1{包含: 带设计稿<br/>figma/mockup?}
  m1 -->|是| tagM1["M1 · 有设计稿"]
  m1 -->|否| m2{包含: 没有设计稿<br/>或 UI/页面/列表/组件?}
  m2 -->|是| tagM2["M2 · UI 无设计稿"]
  m2 -->|否| noUI["无 UI 标记"]

  task --> m3{包含: 鉴权/权限<br/>auth/多租户/登录?}
  m3 -->|是| tagM3["M3 · 鉴权"]

  task --> m4{包含: 数据库/DB/schema<br/>表结构/建表/migration?}
  m4 -->|是| tagM4["M4 · DB变更"]

  task --> m5{包含: 联调/集成测试<br/>端到端联通?}
  m5 -->|是| tagM5["M5 · 联调"]

  tagM1 & tagM2 & tagM3 & tagM4 & tagM5 --> result["modifiers 数组<br/>如 [M2, M4]"]

  style tagM1 fill:#cce5ff
  style tagM2 fill:#fff3cd
  style tagM3 fill:#f8d7da
  style tagM4 fill:#f8d7da
  style tagM5 fill:#d4edda
```

### Modifier 含义速查

| 标签 | 含义 | 触发关键词 |
|---|---|---|
| M1 | 有设计稿 | `带设计稿` `figma` `mockup` `视觉稿` |
| M2 | UI / 无设计稿 | `没有设计稿` `UI` `页面` `列表` `组件` |
| M3 | 鉴权 / 多租户 | `鉴权` `权限` `auth` `登录` `多租户` |
| M4 | DB schema 变更 | `数据库` `schema` `新增…表` `migration` |
| M5 | 联调 / 端到端 | `只联调` `联调` `集成测试` `端到端联通` |

---

## 9. 项目卸载（harness_uninstall）

```mermaid
sequenceDiagram
  autonumber
  participant U as 用户
  participant AI as AI Agent
  participant MCP as harness MCP
  participant FS as 项目文件系统

  U->>AI: 这个项目不再用 harness 了，帮我清干净
  AI->>MCP: harness_uninstall({ cwd, dry_run:true })

  rect rgb(240,248,255)
    Note over MCP,FS: 安全预检 · dry_run 阶段
    MCP->>FS: 检查 .harness/ 是否存在
    alt 不存在
      MCP-->>AI: status=not_found, removed=[]
    else 存在
      MCP->>FS: 递归列出 .harness/ 下所有文件
      MCP->>FS: 检查根 CHANGELOG.md / .github/CODEOWNERS / pull_request_template.md
      MCP-->>AI: status=dry_run<br/>removed=[.harness/config.json,...]<br/>kept=[CHANGELOG.md, .github/*]
    end
  end

  AI->>U: 即将删除 N 项，CHANGELOG / .github/* 因外部约定保留，确认？
  U->>AI: 确认

  AI->>MCP: harness_uninstall({ cwd, dry_run:false })

  rect rgb(255,240,240)
    Note over MCP,FS: 实际清除阶段
    alt keep_root_dir=true
      MCP->>FS: 清空 .harness/ 内部文件 + 子目录，保留 .harness/ 占位
    else keep_root_dir=false (默认)
      MCP->>FS: rm -rf .harness/
    end
  end

  MCP-->>AI: status=completed<br/>removed=[.harness 及全部子项]<br/>kept=[CHANGELOG.md, .github/*]
  AI->>U: 已清除。如想重新启用 harness：直接运行 harness init
```

### Uninstall 设计要点

| 维度 | 行为 |
|---|---|
| 默认范围 | 递归删除 `.harness/` 目录树 |
| 自动保留 | `CHANGELOG.md` / `.github/CODEOWNERS` / `.github/pull_request_template.md` |
| 保留原因 | npm release / GitHub 平台等**外部工具约定**这些位置 |
| 提示用户 | 上述保留项列在 `kept[]` 数组里，用户决定是否手工删 |
| 安全门 | CLI 默认弹交互确认，`-y` 跳过；MCP 工具调用 `dry_run=true` 预览 |
| 重装能力 | uninstall 后直接 `harness init` 即可重新启用 |

---

> 本文档由 harness-engineering-mcp 项目维护，配套阅读：
> - [`README.md`](../README.md) — 全局概览
> - [`IDE_DAILY_USAGE.md`](IDE_DAILY_USAGE.md) — 装好后每天怎么用
> - [`PROPOSAL.md`](PROPOSAL.md) — v0.1 设计草案（含原始时序图）
