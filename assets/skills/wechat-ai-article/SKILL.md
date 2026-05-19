---
name: wechat-ai-article
description: End-to-end workflow that writes Chinese WeChat tech articles from either the latest tech news or a user-provided custom topic, with source verification, readable technical depth, and ready-to-paste inline HTML. Use when asked to write a WeChat article, custom topic tech post, AI weekly, 科技新闻 / 科技周报, 公众号, 微信文章, or AI 周报.
---

# WeChat Tech Article Skill

这个 skill 负责把「最新科技新闻」或「用户指定的科技主题方向」（以 AI 为重点，但同样覆盖芯片/硬件/大厂财报/开发者工具/GitHub 热门项目/MCP 与 skills 生态/新工程术语/安全事件/重大并购）自动化转成一篇微信公众号级别的深度长文。输出单文件：`article.html`（内联样式，粘贴即用）。

## 启动前约定

- **语言**：正文中文，数据/产品名/benchmark/公司名 用英文原词
- **风格**：技术深度 + 通俗导读双轨。默认面向**混合读者**——非技术读者能跟着故事和判断读完，技术读者能从可选阅读层拿到 benchmark / 源码 / 公式细节。每个硬核段落必须配一段白话翻译或生活类比，让普通人也能 get 到
- **实战与痛点导向**：涉及技术能力、工具、论文、框架、模型或开发者生态时，正文必须尽量回答「当前解决什么痛点、方案怎么落地、谁适合用、有哪些坑、哪些问题仍然解决不了」。不要只写原理、参数和行业影响
- **不使用 emoji**
- **不落盘 Markdown 源文件**，文章草稿只存在 Agent 上下文里，直接转 HTML
- **每篇视觉语言必须独立生成**：文章排版风格（色板 / 排版尺度 / 组件形态）要与最近历史避重，绝不复用上一篇的 token
- **不生成封面**：本 workflow 只负责公众号正文 HTML，不调用任何图片生成工具，不创建图片候选，不写任何图片后处理配置

## Step 0：输入路由

在执行 Step 1 前，先判断用户输入属于哪种模式，并把结果记录为 `input_mode`：

| `input_mode` | 触发条件 | 后续流程 |
| --- | --- | --- |
| `auto_news` | 用户只说 `/wechat-ai-article`、写 AI 周报、科技新闻、近期热点、今日/本周科技新闻，且没有给出明确主题 | 跑 Step 1A + Step 2，采集最近 7 天新闻并展示 Top 10 让用户选择 |
| `custom_topic` | 用户请求里已经带明确主题、方向、公司、产品、技术、议题或人群，例如「AI Agent 工程化」「OpenAI 最近的新模型」「国产大模型出海」「Cursor 和 Claude Code 对比」 | 跑 Step 1B，围绕主题定向调研，跳过 Top 10 拍板，直接进入 Step 3 |
| `direct_link` | 用户给了一个或多个新闻 / 博客 / 论文 / 公告链接，并要求基于链接写文章 | 跑 Step 1C，用 `WebFetch` 读原文并做交叉验证，跳过 Top 10 拍板，直接进入 Step 3 |

**主题判定优先级**：只要用户输入中包含可写作的主题，就按 `custom_topic` 处理；不要再默认跑 14 条全局新闻查询。只有在没有主题时，才使用原来的自动新闻流程。

**过宽主题处理**：如果用户只给「AI」「科技」「大模型」「芯片」这类过宽词，无法判断写作角度时，先用 `AskQuestion` 让用户在 2-4 个方向里收窄；不要直接泛写。

## 工作流（最多 8 步，按主题分支）

复制下面的清单，逐项勾选执行：

```
Task Progress:
- [ ] Step 0: 判断输入模式（auto_news / custom_topic / direct_link）
- [ ] Step 1: 按输入模式采集资料（auto_news 采集最近 7 天新闻；custom_topic 定向调研；direct_link 读取链接并交叉验证）
- [ ] Step 2: 仅 auto_news 模式打分排序并给出 Top 10 候选让用户拍板；custom_topic / direct_link 直接进入写作策略
- [ ] Step 3: 根据新闻类型确定写作模板与篇幅，并标记 content_profile
- [ ] Step 3.1: 命中 personal_practice / retrospective 时 AskQuestion 二选一（仅 custom_topic / direct_link 触发，auto_news 跳过）
- [ ] Step 3.5: 仅技术层面主题做「叙事骨架设计」（产出 6 字段 JSON），business_narrative / fast_take / 消费功能型 product_experience 跳过
- [ ] Step 4: 按规范写作（含 5 个备选标题、正文、参考资料）
- [ ] Step 4.5: 生成「文章视觉语言卡」（色板 + 排版尺度 + 组件形态）
- [ ] Step 5: 输出 article.html + 追加样式历史
```

---

### Step 1：资料采集（按输入模式分支）

先读取 Step 0 的 `input_mode`，再选择以下分支。不要把 `custom_topic` 请求误走成全局新闻 Top 10。

#### 1A：`auto_news` 新闻采集（国际 + 国内并重）

仅当 `input_mode = auto_news` 时，用 `WebSearch` 并行发起 14 条基线查询，覆盖官方源 + 中英文媒体 + 开发者社区 + 通用科技维度；必要时追加 2-3 条补漏查询。重大新闻要优先补一手证据：模型 / 芯片 / 云服务查官方公告，财报查 IR / SEC，监管查 FTC / DOJ / EU Commission / 网信办 / 工信部，安全事件查 NVD / CISA / vendor advisory。查询语法与源清单参考 [news-sources.md](news-sources.md)。

**采集范围**：覆盖大模型、AI 新能力 / 新技能（推理 / 多模态 / image / video / voice / agent / coding / 工具调用）、AI 产品功能发布、开发者工具生态（Cursor / Windsurf / Replit / GitHub Copilot / Claude Code / OpenCode 等）、热门 MCP / MCP servers、热门 agent skills / Cursor skills / Claude skills、GitHub Trending / Hacker News / Reddit 等社区热项目、新工程术语（如 `harness engineering` / `context engineering` / `eval harness` / `agent harness`）、芯片硬件、云平台与开发平台、企业动态（财报 / 并购 / 战略投资 / 创始人动态 / 人事 / 旗舰产品发布）、新技术（开源项目 / 论文突破 / 行业标准）、安全事件、监管裁决、官方公告 / 财报文件 / 监管文件等全科技维度。**国际新闻与国内新闻同等重要**，不允许只覆盖一侧。

**并行查询模板**（一次性发起，不要串行）——5 条国际 AI / 产品 + 1 条国内 AI + 3 条开发者生态 / 社区趋势 + 2 条国际科技 / 交易 + 2 条国内科技 + 1 条硬件：

- `latest AI model release this week anthropic OR openai OR google OR meta OR deepseek OR mistral OR qwen`
- `OpenAI image model OR Image 2 OR image generation release this week site:openai.com OR site:techcrunch.com OR site:theverge.com`
- `AI product feature launch image video voice agent this week OpenAI Google Anthropic Meta xAI`
- `new LLM benchmark OR agent capability release this week site:arxiv.org OR site:huggingface.co OR SWE-bench OR HELM`
- `AI product launch OR new feature this week site:techcrunch.com OR site:theverge.com`
- `最新 AI 大模型 OR AI 新能力 发布 本周 机器之心 OR 量子位 OR 智东西 OR 百度文心 OR 腾讯混元`
- `Cursor Windsurf Replit GitHub Copilot Claude Code OpenCode product launch funding acquisition this week`
- `MCP server OR Model Context Protocol OR agent skills OR Cursor skills GitHub trending this week`
- `harness engineering OR context engineering OR eval harness OR agent harness AI software engineering this week`
- `latest tech news this week chips OR earnings OR M&A site:bloomberg.com OR site:ft.com OR site:theinformation.com`
- `Elon Musk xAI buys OR acquires OR investment Cursor this week Bloomberg Reuters The Information`
- `new hardware OR chip launch this week NVIDIA OR AMD OR Intel OR TSMC OR Qualcomm OR Apple Silicon`
- `科技 本周 重磅 大厂 OR 财报 OR 并购 36kr OR 虎嗅 OR 钛媒体`
- `国产 大模型 OR 国产 芯片 OR 国产 智能硬件 发布 本周 百度文心 OR 腾讯混元 OR MiniMax OR 阶跃星辰 OR 华为盘古`

**补漏查询**：完成 14 条基线后，如果候选池里没有「AI 产品功能发布 / 开发者工具 / 开发者生态社区趋势 / 并购交易 / 一手官方或监管财报证据」五类中的任意一类，必须追加 1-3 条补漏搜索后再进入 Step 2：

- `AI startup acquisition OR strategic investment this week OpenAI Microsoft xAI Google Anthropic`
- `developer tools AI coding agent Cursor Windsurf Replit Copilot funding acquisition this week`
- `MCP server Model Context Protocol agent skills Cursor skills Claude Code GitHub trending Hacker News this week`
- `new AI engineering terminology harness engineering context engineering eval harness agent workflow this week`
- `site:sec.gov OR investor relations OR FTC OR DOJ OR European Commission OR 网信办 OR 工信部 AI tech this week`

**重大交易专项核验（防漏检）**：任一搜索结果出现以下信号时，必须在进入 Step 2 前追加 1-2 条专项检索，不能只并入“AI 基础设施投资潮 / 行业资本开支 / 大厂动态”等综合项：

- 金额信号：`$10B+`、`10 billion`、`100 亿美元`、`400 亿美元`、`up to $40 billion`、`commitment`
- 交易信号：`strategic investment`、`acquisition`、`merger`、`term sheet`、`cash and compute`、`milestone payments`
- 主体信号：OpenAI / Microsoft / Google / Alphabet / Anthropic / xAI / Nvidia / Amazon / Meta 等头部 AI 与云厂商之间的投资、收购、算力承诺

专项检索格式示例：

- `[公司A] invest OR acquire OR commitment [公司B] $[金额] Reuters Bloomberg CNBC WSJ NYT TechCrunch`
- `[公司A] [公司B] strategic investment cash compute milestone payments`

如果 `auto_news` 模式中用户额外补充了轻微偏好（如“最近偏 OpenAI 也可以看看”），可在 14 条之外**额外**追加 1-2 条专搜，但不要替换上述基线 14 条。若用户请求本身已经给出明确主题，则应改走 `custom_topic`，不要继续执行全局 14 条基线查询。

**采集目标**：聚集 **20-30 条候选新闻**，确保 Step 2 能稳定排出 Top 10。每条记录：标题、来源、发布时间 `published_at`、一句话摘要、URL、地域（国际 / 国内 / 全球）、分类。`published_at` 要尽量记录到具体日期和时间，并保留时区或来源本地时间（如 `2026-04-28 09:30 UTC` / `2026-04-28 17:30 北京时间`）；如果来源只给日期，写成 `YYYY-MM-DD date-only`；时间不明标为 `unknown`。交易 / 投资 / 并购类还必须记录：金额口径（一次性到账 / 最高承诺 / 里程碑付款 / 算力承诺）、交易双方、是否获得 ≥2 家权威媒体交叉验证。

**软约束（选题平衡）**：

- 最终候选清单里 AI 占比建议 ≥ 50%，但允许 30-50% 是非 AI 但同等重磅的科技新闻（NVIDIA 新一代 GPU、TSMC 重大事故、Apple/Microsoft 重大产品发布、重大安全漏洞、监管裁决、巨型并购、头部开发工具收购、GitHub 爆火开发工具或新工程范式等）
- 当周若 AI 平淡而硬件/并购/财报爆发，允许 Top 1 选非 AI 选题
- Top 10 候选必须满足：**AI 类 ≥ 5 条**（含大模型 / AI 新能力 / AI 产品功能 / 论文 / AI 开发者生态）、**国际 ≥ 3 条 且 国内 ≥ 3 条**、**同一公司同周内最多 2 条**；不满足时从候选池里替换补齐，宁可降一档分数也要满足配比

**硬约束**：

- 只收 7 天内的；时间不明的标为 `unknown` 并降权处理；只有日期没有具体时间的标为 `date-only`，按日期参与 7 天判断但不冒充具体发布时间
- 遇到明显重复事件合并为一条，汇总所有报道源
- 不信任单源小道消息，除非 ≥2 家独立源交叉验证
- ≥100 亿美元的 AI 战略投资 / 收购 / 算力承诺，如果获得 Reuters / Bloomberg / WSJ / NYT / CNBC / FT / TechCrunch 中任意 2 家以上报道，必须作为独立候选进入排序，不得只作为综合背景项处理

#### 1B：`custom_topic` 定向主题资料采集

当 `input_mode = custom_topic` 时，围绕用户给出的主题直接调研，不展示全局 Top 10。采集目标是形成一个可写作的「主题资料包」，不是硬凑最近 7 天新闻列表。

**时间规则**：
- 如果用户说了「最近 / 本周 / 刚发布 / 最新」，搜索词必须带时间限定，优先 7 天内资料；不足时可补更早的一手背景，但正文要标明发布时间
- 如果用户没有要求时效，不强制 7 天限制；优先选择最新、权威、仍然有效的资料，并在资料包里记录发布日期或更新时间

**定向查询模板**（根据主题选 3-6 条并行查询，必要时补 1-2 条）：

- `[主题] official announcement OR documentation OR blog`
- `[主题] benchmark OR evaluation OR case study OR comparison`
- `[主题] GitHub OR Hacker News OR Reddit OR developer discussion`
- `[主题] site:arxiv.org OR site:huggingface.co OR site:github.com`
- `[主题] 最新 OR 发布 OR 评测 OR 实测 OR 教程`
- `[主题] 风险 OR limitation OR pricing OR migration OR adoption`

**资料包必须记录**：
- `topic`：用户给出的原始主题，以及必要时收窄后的写作角度
- `source_scope`：资料时间范围，是否按「最近 7 天」限制
- `key_sources`：至少 3 条官方 / 权威 / 一手或高可信资料；技术主题优先官方文档、论文、GitHub、benchmark、主流媒体交叉报道
- `core_angle`：本文主线，例如产品体验、技术拆解、产业事件、开发者工作流或商业判断
- `news_type` / `content_profile`：进入 Step 3 前的初判
- `uncertainty`：哪些信息仍是传闻、单源、未验证或可能过时

**主题过宽时必须先问**：如果主题只有「AI」「科技」「大模型」「芯片」这类大类词，且无法形成 `core_angle`，先用 `AskQuestion` 给出少量方向让用户选择，例如「产业趋势 / 开发者工具 / 产品体验 / 投资商业」。用户选定后再采集资料。

#### 1C：`direct_link` 链接资料采集

当 `input_mode = direct_link` 时，先用 `WebFetch` 读取用户给出的链接原文；如果链接不可访问，说明阻塞并请用户提供可访问来源或正文摘录。

读取原文后仍需补 1-2 条交叉验证搜索：
- 官方公告 / 文档 / 论文优先补外部解读、benchmark 或社区讨论
- 媒体报道优先补官方源或另一家权威媒体
- 单源传闻必须在正文中标注可信度边界，不得写成已确认事实

---

### Step 2：热度排序与 Top 10 候选确认（仅 `auto_news`）

只有 `input_mode = auto_news` 时执行本步骤。`custom_topic` 和 `direct_link` 模式跳过 Top 10 展示，不调用 `AskQuestion` 让用户二次选题，直接带着 Step 1B / 1C 的资料包进入 Step 3。

#### 打分规则

每条新闻按 3 个维度打分，满分 9：

| 维度 | 3 分 | 2 分 | 1 分 | 0 分 |
| --- | --- | --- | --- | --- |
| 时效性 | ≤24h | ≤72h | ≤7 天 | >7 天 |
| 多源覆盖 | ≥3 家报道 | 2 家 | 1 家 | 小道消息 |
| 影响力 | 旗舰 AI 模型/产品发布 / 重大芯片或硬件发布 / 头部大厂季报或财务大变 / 重大并购或反垄断裁决 / ≥100 亿美元 AI 战略投资、收购承诺或算力承诺 / 爆发式开发者生态趋势（如热门 MCP、agent skills、GitHub 趋势项目或新工程范式被多源讨论） | benchmark 突破 / 重要论文 / 重大安全事件 / 关键开源项目或开发者工具发布 / 重大行业标准或监管出台 / 新工程术语进入主流开发者讨论 / 10-100 亿美元 AI 投资、收购或算力合作 | 融资 / 人事变动 / 一般性开源 / 产品迭代小更新 | 观点评论 / 营销稿 / 未经验证的小道消息 |

#### 准入与排序

- 总分 **≥ 6** 进入候选池（原阈值 7 放宽到 6，以保证能选出 10 条）
- **漏检保护**：正式排序前，先检查候选池是否至少包含 1 条「AI 产品功能发布」、1 条「开发者工具生态」、1 条「开发者生态社区趋势（MCP / skills / GitHub trending / 新工程术语）」、1 条「并购 / 交易 / 战略投资」、1 条「Reuters / Bloomberg / WSJ / NYT / CNBC / FT / TechCrunch 报道的 ≥100 亿美元 AI 交易或投资」。如果任一类为空，必须回到 Step 1 追加对应补漏查询，再重新合并去重和打分
- **重大单体事件不可合并**：有明确主体、金额、交易结构和独立影响的事件，必须作为单独候选。例如「Google 向 Anthropic 投资至多 400 亿美元」不能只合并进「全球 AI 基础设施投资潮」；综合项可保留为背景，但不得吞掉单体事件
- **交易摘要口径**：如果交易结构包含“先期现金 + 里程碑付款 / 算力承诺 / 最高承诺”，候选摘要必须写清“最高承诺”和“一次性到账”的区别，避免把 `up to` 误写成全额到账
- 如果补漏后仍没有合格候选，在 Top 10 前标注该类别「本轮未发现 ≥2 源交叉验证的 7 天内新闻」，不要用低可信单源传闻硬凑
- 候选池按总分降序排序，取**前 10** 作为 Top 10
- 若 ≥ 6 分的不足 10 条，从 5 分档按「多源覆盖维度高 → 影响力维度高 → 时效性维度高」顺序递补补齐到 10 条
- Top 10 必须满足 Step 1 的配比硬约束（AI ≥ 5、国际 ≥ 3、国内 ≥ 3、同公司 ≤ 2），不满足时把超额条目替换为同分档里能补齐配比的下一条
- 每次展示 Top 10 后，在 Agent 上下文维护 `shown_candidates`（至少记录 title / URL / source / published_at）。如果用户选择「换一换」，下一轮排序必须先排除已展示过的候选，再从未展示候选里取新的 Top 10；刷新后的新候选也要继续追加到 `shown_candidates`

#### 候选呈现

先以纯文本一次性列出 Top 10，每条紧凑 2 行：

```
Top 1：[标题] (8/9 · 国际 · AI 模型)
  时间：2026-04-28 09:30 UTC   |   一句话看点：...   |   主源：...

Top 2：[标题] (8/9 · 国内 · 芯片)
  时间：2026-04-28 date-only   |   一句话看点：...   |   主源：...

... 直到 Top 10
```

然后用 `AskQuestion` 让用户挑出本次写作主题：

- 默认为单选（写一篇深度长文）
- 每个新闻选项的标题或说明必须带上对应 `published_at`（例如 `Top 1：标题｜时间：2026-04-28 09:30 UTC`），让用户在 `AskQuestion` 里也能直接判断时效性
- 允许用户选 1-2 条；选 2 条时，分数高的那条作为正文主线，另一条作为正文末尾的「相关动态」简述段并入，**不另出第二篇文章**
- 固定追加一个「换一换：重新获取一批其他新闻」选项。用户选择它时，不进入 Step 3；回到 Step 1 / Step 2，补采或重排其他新闻，并排除 `shown_candidates` 里已经展示过的候选；刷新后重新展示的 Top 10 和 `AskQuestion` 新闻选项同样必须带上 `published_at`
- 如果用户同时选择新闻和「换一换」，以「换一换」为准，继续刷新候选，不开始写作
- 如果未展示候选不足 10 条，追加 2-3 条补漏查询后重新合并、去重、打分；仍不足时可以展示少于 10 条，但必须说明「已排除上一批候选，本轮只找到 N 条新的合格新闻」。不能为了凑满 10 条放宽 7 天、多源可信度、配比和重大交易独立候选等硬约束
- 如果用户在 Top 10 之外另行点名，切换为 `custom_topic`，按用户点名的选题写

**不要自作主张挑第一条写**，必须等用户显式选择。

---

### Step 3：写作策略、内容画像与篇幅自适应

先按新闻类型标记 `news_type`，再自动选择 `content_profile`；除非用户明确指定风格，否则不要让用户手动选择内容画像。

当 `input_mode = custom_topic` 且主题不是单条新闻事件时，也必须标记 `news_type`。映射原则：开发者工具、MCP、skills、工程范式归 `developer_ecosystem`；模型、论文、benchmark、底层能力归 `paper_breakthrough` 或 `flagship_release`；产品体验、工具对比、上手指南归 `flagship_release` 或 `developer_ecosystem`；投资、并购、公司战略归 `industry_event`；单源传闻或未确认消息归 `rumor_funding`。

| `news_type` | 新闻类型 | 默认 `content_profile` | 文章模板 | 目标字数 |
| --- | --- | --- | --- | --- |
| `flagship_release` | 旗舰 AI 模型 / 主力硬件 / 主力软件版本发布 | `tech_deep_dive` 或 `product_experience` | 结论前置 + 痛点方案表 + benchmark 表 + 能力拆解 + 上手路径 / 示例用法 + 迁移指南 + 决策矩阵 | 3000-3800 |
| `paper_breakthrough` | 重要论文 / 技术突破 / 重大安全披露 | `tech_deep_dive` | 原理拆解 + 类比解释 + 它解决的旧问题 + 能不能试 / 怎么试 + 应用场景 + 行业影响 | 2000-2800 |
| `industry_event` | 行业大事件（并购 / 开源 / 监管 / 巨型财报 / 重大事故） | `business_narrative` | 故事开头 + 事件梳理 + 商业矛盾 + 趋势判断 | 1500-2400 |
| `developer_ecosystem` | 热门 MCP / skills / GitHub trending / 开发者工具范式 / 新工程术语 | `product_experience` 或 `tech_deep_dive` | 场景解释 + 当前开发痛点 + 社区来源 + 安装 / 配置 / 工作流示例 + 工具链影响 + 上手建议 + 风险边界 | 1800-2800 |
| `rumor_funding` | 小道消息 / 融资 / 人事 | `fast_take` | 先说结论 + 背景 + 三点判断 + 风险提示 | 800-1400 |
| `practice_methodology` | 第一人称"我"的技术 / 工程 / 产品方法论实战复盘（仅技术层面） | `personal_practice` | 自我介绍 → 主线项目 / 产品 → 时代或阶段对比表 → 痛点 - 解 - 新痛点循环 → 失败迭代 → 三层架构或方法论拆解 → 轻重取舍表 → 给同行的清单 | 2800-4200 |
| `product_evolution` | 技术产品 / 工程项目 / 团队工作流从 V1 → Vn 的迭代复盘（仅技术层面） | `retrospective` | 项目背景 → 版本时间线一张图 → V1 致命问题 → 迭代一 / 二 / 三 → 收获与教训 → 给后来者的避坑清单 → 是否值得复制 | 2400-3500 |

#### 内容画像自动路由

| `content_profile` | 适用主题 | 内容形式 | 典型问题 |
| --- | --- | --- | --- |
| `tech_deep_dive` | 模型、论文、benchmark、底层能力升级 | 技术解释 + 痛点诊断 + 实战用法 + 白话翻译 + 表格 + 取舍建议 + 延伸阅读 | “它到底强在哪，解决了什么旧问题，我该怎么试？” |
| `business_narrative` | 并购、融资、创始人动态、大厂战略、组织调整 | 故事钩子 + 商业矛盾 + 多方受益/受损 + 趋势判断 | “谁在下注，谁被改变，行业会往哪走？” |
| `product_experience` | AI 产品功能、OpenAI Image 2、Cursor/Claude 对比、开发者工具、消费级 AI | 使用场景 + 痛点方案表 + 对比表 + 快速上手 + 清单 + 决策矩阵 | “我该不该用，适合谁，怎么选，第一步怎么做？” |
| `developer_ecosystem` | 热门 MCP / skills / GitHub trending / 开发者工具范式 / 新工程术语 | 场景解释 + 当前开发痛点 + 社区来源 + 安装 / 工作流示例 + 工具链影响 + 上手建议 + 风险边界 | “这工具或范式真值得跟吗，怎么跟最省力？” |
| `fast_take` | 政策、突发安全、争议传闻、小道融资、人事变动 | 结论先行 + 3 点判断 + 风险边界 + 后续观察 | “这事短期怎么看，哪些还不能下结论？” |
| `personal_practice` | **仅技术层面**：第一人称"我"的技术 / 工程 / 产品方法论实战复盘 | 自我介绍 + 主线项目 + 痛点 - 解 - 新痛点循环 + 失败迭代故事 + 三层架构 / 方法论拆解 + 轻重取舍表 + 给同行的清单 | "我从踩坑到跑顺，做对了什么、做错了什么、你能直接抄哪几招？" |
| `retrospective` | **仅技术层面**：技术产品 / 工程项目 / 团队工作流的迭代复盘 | 项目背景 + 版本时间线 + V1 致命问题 + 迭代一/二/三 + 收获与教训 + 给后来者的避坑清单 + 是否值得复制 | "这个东西从 V1 到 Vn 是怎么一步步成形的，哪些路别人不用再走？" |

**路由规则**：
- 工具/产品对比（如 Cursor vs Claude）默认 `product_experience`
- 热门 MCP / MCP servers / agent skills / Cursor skills / Claude skills / GitHub trending 工具默认 `developer_ecosystem` + `product_experience`；如果核心是协议、架构、benchmark 或工程范式，再升级为 `tech_deep_dive`。必须说明它缓解了开发者链路里的哪些摩擦，例如上下文搬运、工具配置、评测复现、多人协作或上线验证
- `harness engineering` / `context engineering` / `eval harness` / `agent harness` 这类新工程术语默认 `developer_ecosystem`；必须解释术语来源、解决的问题、适用边界、可落地工作流和是否只是旧概念换名
- AI 图像、视频、语音、agent UI、消费功能默认 `product_experience`；如果有充分 benchmark 和架构资料，可升级为 `tech_deep_dive`
- 收购、投资、创始人买入、平台合作默认 `business_narrative`
- 论文、模型架构、推理/多模态能力突破默认 `tech_deep_dive`；除非还没有公开代码、产品或复现路径，否则必须写清楚开发者 / 产品团队可以怎么试、先试哪个最小场景、失败时看什么指标
- 单源传闻、政策快讯、安全突发默认 `fast_take`，并明确可信度边界
- 自定义主题不是新闻时，不要强行套「发生了什么」；改成「为什么现在值得写 → 旧痛点是什么 → 资料显示的新方法 / 新判断 → 读者怎么行动」。仍然必须保留参考资料和可信度边界
- 用户给出"我用 X 做了 Y / 复盘 / 实践心得 / 经验分享 / 我们怎么做 X"等关键词，**且 X 属于技术 / 工程 / 产品方法论范畴** → 默认 `personal_practice`，进入 Step 3.1 二选一确认
- 用户给出"V1 → Vn / 进化史 / 迭代过程 / 从零到一 / 项目复盘"等关键词，**且对象是技术产品 / 工程项目 / 团队工作流** → 默认 `retrospective`，进入 Step 3.1 二选一确认
- `harness engineering` / `context engineering` 这种"工程范式 + 个人 / 团队实证"复合主题 → 优先 `personal_practice`，其次 `developer_ecosystem`
- **非技术层面的复盘**（创业心路 / 财务总结 / 个人成长 / 投资感悟）→ 不进入 `personal_practice` / `retrospective`，按 `business_narrative` 处理
- 第三方爆款公众号长文转写 / 二次解读类 → 必须降级为 `tech_deep_dive` 或 `business_narrative`，**不允许冒充 personal_practice**（防止"假装是我亲历"）
- `auto_news` 模式下，无论关键词如何匹配，**禁止**自动路由到 `personal_practice` / `retrospective`（新闻不可能是 AI 亲历），命中时直接降级为对应技术画像

**字数是目标不是上限**。如果话题厚度不够，不要灌水；如果话题足够厚，可以超出上限 20%。

**默认可读性模式**：`readability_mode = viral_readable`。字数里「可读性段落」（先说结论、开篇故事、生活类比、白话翻译、小钩子、章节导语、读者利益段、行动建议）应占 ≥ 30%。宁可砍掉 200 字额外 benchmark 详解，去换一段读者一秒就能 get 的类比。

---

### Step 3.1：personal_practice / retrospective 命中后人工二选一（关键防守）

**触发条件**：仅当 Step 3 自动路由命中 `personal_practice` 或 `retrospective`，**且 `input_mode ∈ {custom_topic, direct_link}`** 时执行本步。`auto_news` 模式跳过本步（新闻不可能是 AI 亲历，已在 Step 3 路由层禁止命中）。

不允许 skill 自作主张直接以第一人称"我亲历过"开写，必须先用 `AskQuestion` 二选一让用户拍板：

**对话固定 2 个选项**：

- **是，按当前画像（personal_practice 或 retrospective）写** → 进入 Step 3.5，按 personal_practice / retrospective 的全字段要求设计叙事骨架
- **否，降级为非亲历技术画像** → 自动按下表降级，仍走 Step 3.5 但按"其他技术画像"分级要求

| 命中画像 | "否"降级目标 |
| --- | --- |
| `personal_practice` | 优先 `tech_deep_dive`；如果主题是工具 / 范式 / 社区趋势，降到 `developer_ecosystem` |
| `retrospective` | 优先 `developer_ecosystem`；如果主题是单个产品的能力变化，降到 `tech_deep_dive` 或 `product_experience` |

**硬约束**：
- 用户选"否"后，**禁止**用第一人称"我亲历过 / 我做过 / 我们团队当时" 写技术亲历；可以用"本文 / 据 X 所述 / 作者自述"间接陈述
- `auto_news` 模式即使用户选了一条复盘类标题作为主线，也按 `tech_deep_dive` / `developer_ecosystem` 处理，不触发本步
- 用户选"是"但后续无法提供真实身份背景（行业 / 角色 / 年限）或可分享的真实细节（项目名 / 文件名 / 命令 / 数字）→ 自动回退到"否"分支并提醒用户

---

### Step 3.5：叙事骨架设计（仅技术层面主题触发）

**触发条件**：当且仅当 `content_profile ∈ {tech_deep_dive, developer_ecosystem, 技术型 product_experience, personal_practice, retrospective}` 时执行本步。

**跳过条件**：`business_narrative` / `fast_take` / 消费功能型 `product_experience`（例如纯消费图像 app 体验、纯娱乐功能）**直接进入 Step 4**，不必产出叙事骨架 JSON。

#### 6 个字段按画像分级

把选好的叙事骨架写成一个 JSON 块放入 Agent 上下文，Step 4 直接读取并兑现：

```json
{
  "content_profile": "personal_practice",
  "narrative_spine": "evolution",
  "pain_chain": [
    { "old": "...", "fix": "...", "new": "..." },
    { "old": "...", "fix": "...", "new": "..." },
    { "old": "...", "fix": "...", "new": "..." }
  ],
  "failure_loops": [
    { "version": "v1", "problem": "...", "iteration": "..." }
  ],
  "assets": [
    { "type": "prompt", "title": "...", "snippet": "..." },
    { "type": "checklist", "title": "...", "snippet": "..." },
    { "type": "directory_tree", "title": "...", "snippet": "..." }
  ],
  "tradeoff_table": { "axes": ["任务规模", "推荐方案"], "rows": [...] },
  "reader_action_per_section": ["...", "...", "..."]
}
```

| 字段 | 含义 | `personal_practice` / `retrospective` | 其他技术画像 |
| --- | --- | --- | --- |
| `narrative_spine` | 4 选 1：`single_thread`（单一主线）/ `evolution`（V1 → Vn 时间线）/ `parallel_compare`（A 方案 vs B 方案）/ `concept_unfold`（从一个术语层层剥开） | 必填 | 必填 |
| `pain_chain` | 痛点递进链，每段 `旧痛点 → 解 → 新痛点` | ≥3 段 | ≥2 段 |
| `failure_loops` | 失败 / 翻车 / 迭代记录（参考 Harness Engineering 文章 3.3 节"第一版的致命问题 + 迭代一/二/三"） | ≥1 个 | 可选 |
| `assets` | 可复制资产（prompt / 命令 / 配置 / checklist / 目录树 / 决策矩阵 / 取舍表，独立块呈现） | ≥3 个 | ≥1 个 |
| `tradeoff_table` | 轻重取舍表（什么场景用什么方案 / 什么强度的流程） | 必填 1 个 | 可选 |
| `reader_action_per_section` | 每个大章节至少 1 句"如果你是 X，下一步该 Y" | 必填 | 必填 |

#### `narrative_spine` 选用建议

- `personal_practice` 默认 `single_thread`（一个主线项目贯穿全文），主题强调阶段演化时改用 `evolution`
- `retrospective` 默认 `evolution`
- `tech_deep_dive` 论文 / 架构默认 `concept_unfold`；新模型 vs 旧模型对比改 `parallel_compare`
- `developer_ecosystem` 默认 `parallel_compare`（新工具 vs 旧做法）；单个工具深挖时改 `concept_unfold`
- 技术型 `product_experience` 默认 `parallel_compare`（A 工具 vs B 工具 / 新功能 vs 旧做法）

未产出此 JSON 块禁止进入 Step 4（**仅对触发本步的画像有效**；跳过本步的画像不受此约束）。

---

### Step 4：写作执行

完整的文章结构骨架参考 [article-examples.md](article-examples.md)。不要照抄任何具体公众号的标题句式、口头禅或段落表达，只抽象其内容节奏：强钩子、结论前置、短段落、信息卡、故事线、场景化解释、读者决策段。

#### 硬性规范

- **爆款易读结构（默认）**：
  1. **先说结论**：文首用 3-5 条短判断告诉读者“这事到底意味着什么”
  2. **故事钩子**：用一个场景、对比、冲突或反直觉数据开篇，不用空泛背景
  3. **读者利益翻译**：明确“这和开发者 / 产品经理 / 投资人 / 普通用户有什么关系”
  4. **三段式主体**：发生了什么 → 为什么重要 → 该怎么判断/行动
  5. **行动建议**：文末给出“谁该立刻关注、谁可以观望、下一步看什么”
- **首屏留存规则**：前 300 字必须完成 4 件事：抛出一个具体冲突或反直觉场景、说明至少 2 类读者的利益关系、给出本文最大判断、承诺继续读下去会拿到什么。禁止用泛泛背景、行业大词或“这很重要”占据首屏
- **标题承诺规则**：文首仍保留 **5 个备选标题**，但正文前三分之一必须兑现标题里最大的承诺。如果标题主打“实测 / 落地 / 避坑 / 对比 / 选型”，正文前段就必须出现对应证据、场景或判断，不能等到文末才补
- **开篇 3 段引子**（取代原"开篇钩子三选一"，三段必须齐全、按顺序出现）：
  1. **钩子**：实战对比 / 反直觉数据 / 名场面切入。不要用「近日」「大家好」这类陈词
  2. **利益相关者翻译**：用一段话告诉读者「这事儿跟你（开发者 / 产品经理 / 投资人 / 普通用户）有什么关系」，至少点出 2 类受益或受冲击人群
  3. **路线图**：一句话告诉读者「往下读会看到什么」，例如「先看 3 个实测对比，再讲背后的架构改动，最后给出 4 类人的升级建议」
- **痛点方案层必出（技术类主题强制）**：当 `content_profile` 是 `tech_deep_dive`、`product_experience` 或 `developer_ecosystem` 时，正文必须列出 2-4 个当前真实痛点，并逐条回答「现有做法哪里卡住」「这次新方案怎么缓解」「适合谁用」「落地难度」「仍然解决不了什么」。优先用短表或信息卡，不要散落在长段落里
- **落地实施模块必出（技术类主题强制）**：当主题涉及模型、工具、框架、论文、benchmark、MCP、skills、开发者工具或新工程范式时，正文必须有一个独立小节或信息卡，标题可用「今天怎么落地」「最小试用路径」「从 0 到跑通」等，不能散落在正文段落里。这个模块必须回答：
  - **适合谁用**：新手 / 一线开发者 / 产品经理 / 架构或团队负责人分别该怎么看
  - **第一步怎么试**：选一个低风险、高重复、结果可验证的最小场景，避免一上来全量迁移
  - **怎么接入**：API / CLI / 配置 / 工作流 / prompt / eval / 数据权限中至少覆盖 2 项
  - **怎么判断有效**：给出 2-4 个验收指标，例如耗时、准确率、成本、人工返工率、稳定性、失败可恢复性
  - **常见坑与不适用场景**：写清成本、权限、数据安全、上下文污染、benchmark 与真实业务差距等边界
- **可复制资产门槛升级（技术类主题强制）**：至少提供 1 个读者能直接拿走的资产；`personal_practice` / `retrospective` **必须 ≥ 3 个**。资产类型：prompt 全文、命令模板、配置片段、目录树、评测表、选型 checklist、迁移 checklist、排障清单、最小工作流、决策矩阵、轻重取舍表。资产必须放在独立块中，短小可复制，不能只是抽象建议
- **痛点递进链强制（仅技术与实战类主题）**：当 `content_profile ∈ {tech_deep_dive, developer_ecosystem, 技术型 product_experience, personal_practice, retrospective}` 时，正文必须出现 Step 3.5 `pain_chain` 中的 ≥3 段（其他技术画像 ≥2 段）痛点递进，且每段都要写"我（或文中主角）当时是怎么发现的 / 这个痛点为什么不显眼"
- **失败与迭代模块强制**：`personal_practice` / `retrospective` 必出独立小节呈现 Step 3.5 的 `failure_loops`，标题示例「第一版的致命问题」「踩过的 3 个大坑」「我们绕了多少弯路」。其他画像若有公开失败案例，**强烈建议**加
- **章节标题钩子规则**：每个一级章节标题必须是下列 4 类句式之一 — **疑问句**（"为什么不能只用一个 Agent？"）/ **反差句**（"破局：能用机器查的就别靠 AI 记"）/ **时间或版本标签**（"Prompt 时代（V3.0~V3.3）"）/ **角色标签**（"PM 怎么控制流程"）。空标题"背景 / 技术 / 总结 / 概述 / 介绍"一律不通过
- **真实小细节配额**：`personal_practice` / `retrospective` 全文需出现 ≥5 处具体到"文件名 / 函数名 / 行号 / 命令参数 / 具体数字 / 时间点"的真实细节。参考粒度：OTLP 属性键名 `service.name`、`ProjectGuid` 重复、`MessageBox.Show`、`--username`、"1010 行砍到 275 行"、"V3.5 是个转折点"。模糊表述（"性能大幅提升 / 改了不少地方"）不算
- **段落短化**：每段 ≤ 4 行（约 120 字），技术段尤其要切碎；超过就拆
- **节奏密度**：每 600-800 字必须插入一个节奏点：小标题、金句、反问、短表、信息卡、读者决策提示之一。正文前 1000 字最多出现 1 个表格，避免首屏像报告
- **章节钩子**：每个大章节结尾用 1 句话把读者带到下一节，可以是反问、悬念、判断反转或行动提示。不要让章节以资料罗列自然停止
- **节奏控制——硬核段后必接白话**：连续 ≥ 2 段技术内容（参数 / 公式 / 架构 / benchmark）后，必须接一段「白话翻译」或「生活类比」，用 `> ` 引述块或独立段落呈现，让读者喘口气
- **技术段后的读者动作句**：每个关键技术解释后，补一句「如果你是开发者 / 产品经理 / 团队负责人，现在该看什么指标、试什么场景或避开什么坑」。硬核内容必须落到读者下一步动作
- **术语首次出现规则**：
  - 第一次提到的英文缩写或专业术语（MoE / RLHF / context length / attention / quantization / agent / fine-tune 等）必须用括号一句话解释，解释 ≤ 25 字
  - 解释优先级：**类比 > 功能描述 > 严格定义**（能用类比说就别甩定义）
  - 全文 ≥ 3 处生活类比（餐厅 / 流水线 / 考试 / 厨房 / 交通 / 球队 / 装修 / 快递…），且类比之间不重复
- **小钩子频率**：每 800 字插一个「小钩子」——反问 / 数据冲击 / 反直觉 / 故事拐点 / 一句金句，防止读者掉队
- **主语具体化**：避免「系统会…」「模型可以…」「算法实现了…」这类抽象主语，改用「开发者打开 Cursor 输入第一行 prompt 时，模型会…」这种带场景的具体主语
- **可选阅读层（"延伸阅读"小节）**：benchmark 完整表、源码细节、数学公式、调参细节这类「硬核可跳过」内容，用「**延伸阅读**」标题包裹，配 [style-template.md](style-template.md) Section C 的 accent 浅灰底色块组件，让普通读者一看标题就知道可以跳过；标题示例：「延伸阅读：完整 benchmark 表」「延伸阅读：架构图与公式推导」「延伸阅读：调参与复现脚本」
- **章节序号**：用「一、二、三、...」中文序号，标题句式要有信息密度
- **关键数据**：能上表格的不用文字段落，Markdown 表格到 HTML 阶段自动转内联样式；正文表格 ≤ 5 行 ≤ 4 列，超出部分进「延伸阅读」
- **加粗策略**：只在核心论点、关键数字、破坏性变化处加粗；一段 ≤ 1 处加粗
- **必出元素**：
  - 最终 HTML 文首可见 **5 个备选标题**，分类标签包含「吸睛实证 / 数据冲击 / 专业判断 / 特性罗列 / 决策导向」五类
  - 文末参考资料链接（至少 3 条），每条带官方或权威源
  - 可选：决策矩阵（"该不该升级" 类场景强烈建议）
  - 可选：迁移指南 / 踩坑提示（破坏性变化类场景强烈建议）

#### 可读性自检表（写完正文必须逐条勾选）

- [ ] 开篇 3 段引子齐全（钩子 + 利益相关者翻译 + 路线图）
- [ ] 文首有「先说结论」信息卡或等价段落，包含 3-5 条关键判断
- [ ] 前 300 字已经交代具体冲突、读者利益、核心判断和继续阅读回报，没有用泛泛背景拖慢首屏
- [ ] 5 个备选标题已保留，正文前三分之一兑现了标题里的最大承诺
- [ ] 已根据选题自动标记 `content_profile`，且正文结构与画像一致
- [ ] 至少有 1 段“这和你有什么关系 / 谁受益谁受冲击 / 该不该行动”
- [ ] 技术类主题已列出 2-4 个当前痛点，并逐条给出对应方案、适用人群、落地难度和仍然解决不了的问题
- [ ] 技术类主题已有独立「落地实施模块」，包含适合谁用、第一步怎么试、怎么接入、怎么验收、常见坑与不适用场景
- [ ] 技术类主题至少提供 1 个可复制资产，例如 prompt、命令、配置片段、评测表、选型 checklist、迁移 checklist、排障清单或最小工作流
- [ ] 关键技术解释后有读者动作句，告诉不同读者下一步该看什么指标、试什么场景或避开什么坑
- [ ] 全文 ≥ 3 处生活类比，且类比之间不重复
- [ ] 没有连续 3 段以上未接白话翻译的技术内容
- [ ] 所有英文缩写 / 专业术语首次出现都有括号解释（且解释 ≤ 25 字）
- [ ] 段落最长 ≤ 4 行（约 120 字）
- [ ] 全文 ≥ 4 个节奏点（反问 / 反转 / 冲击数据 / 金句 / 信息卡 / 决策提示）
- [ ] 每 600-800 字至少有一个小标题、信息卡或读者提示，避免长篇平铺
- [ ] 每个大章节结尾都有一句章节钩子，把读者自然带到下一节
- [ ] 正文前 1000 字最多 1 个表格，没有让首屏变成报告
- [ ] benchmark 大表 / 公式 / 源码细节都收进「延伸阅读」小节，正文表格 ≤ 5 行 ≤ 4 列
- [ ] 没有连续 2 段以上抽象主语开头（"系统"/"模型"/"算法"）

##### 读者代入度（高阶可读性，5 题）

- [ ] 文章前 500 字内是否出现一次"我也遇到过 / 我也踩过 / 这就是我现在的状态"级别的共鸣点？（共鸣点可以是场景、痛点描述、反直觉数据、行业心理，不限于第一人称）
- [ ] 是否有至少 1 段写"作者（或文中主角）当时是怎么想的 / 怎么发现的 / 怎么犯的错"？
- [ ] 是否承认了至少 1 次失败、走弯路或方案翻车？（technique / business / fast_take 类型若无公开失败案例可跳过本题）
- [ ] 读者读完是否清楚知道"现在第一步该做什么"？（行动建议必须具体到场景或命令，不能是"建议关注"）
- [ ] 文末是否给了一个"如果只能记一句话"的总结？（不超过 30 字，不带空话）

任意一条不达标就回去补，不要直接进 Step 4.5。

#### 禁用词与风格雷区

- 不用「震惊」「逆天」「碾压」「吊打」这类夸张词
- 不用「小编」「笔者」，用「本文」或直接陈述
- 不用空心套话（"具有重要意义"/"值得关注"）—— 要么给出具体数据，要么删掉
- 不要 emoji，不要颜文字
- 不入术语不解释。反例「采用 MoE 架构」→ 正例「采用 MoE 架构（也就是把模型拆成多个专家小组，每次只点几个上场，省算力）」
- 不连续放 3 段以上纯数据 / 纯参数 / 纯术语，必须穿插白话翻译或生活类比
- 不写「读者应该都知道…」「众所周知…」「这就不用解释了」这类排他性表达；写公众号就当读者第一次接触这个领域
- **不写无源头表述**：避免「业内人士透露 / 据悉 / 据消息称 / 有消息表明」这类没有具体来源的转述。每个事实声明都必须能追溯到 Step 1 资料包里的某条来源
- **禁止冒充亲历**：不允许把别人写的内容、第三方公众号长文、社区讨论用第一人称"我做过 / 我们团队当时"重写。`personal_practice` 必须有真实身份背景交代（行业、角色、年限、当前在做什么），缺失任一条就退化为 `tech_deep_dive`，转用第三人称或"作者自述 / 据 X 文章"等间接表述

---

### Step 4.5：文章视觉语言卡（核心避同质化环节）

这一步借鉴 `/design-html` 的「设计分析 + 风格路由」思路：**每篇文章先独立决定正文排版 token，再据此生成 HTML**。不做这一步，Step 5 就会回退到固定模板，结果必然相似。

#### 6 个字段要产出

| 字段 | 可选值 | 选择依据 |
| --- | --- | --- |
| `content_profile` | `tech_deep_dive` / `business_narrative` / `product_experience` / `developer_ecosystem` / `fast_take` / `personal_practice` / `retrospective` | Step 3 自动路由 + Step 3.1 用户确认结果 |
| `readability_mode` | 默认 `viral_readable` | 用户未指定时固定使用爆款易读模式 |
| `palette_id` | `P1`-`P8`（见 [style-template.md](style-template.md) Section A） | 话题类型 + 避重 |
| `layout_id` | `L1`-`L4`（见 [style-template.md](style-template.md) Section B） | 话题类型 + 避重 |
| `component_variant` | 章节标题 / 子标题 / 表格 / 强调块 / 引导块 的 5 个形态（见 Section C） | 与 palette 和 layout 搭配协调 |
| `style_philosophy` | 一个独立命名的设计哲学短语（如 `Editorial Current`） | 本篇正文气质 + 避重，仅作为档案标签 |

#### 生成步骤

1. **读历史**：查看 `~/wechat-articles/.design-history.json`，按下面规则取出「禁用名单」：
   - 最近 3 条的 `palette_id` 禁用
   - 最近 2 条的 `layout_id` 禁用
   - 最近 3 条完全相同的 `component_variant` 组合禁用
   - 最近 5 条的 `style_philosophy` 或旧字段 `canvas_philosophy` 名称禁用（大小写不敏感）
   - 文件不存在就视为空历史（首次运行不会报错）
   - 若旧历史里有 `archetype_id` / `lineage_id` / `cover_*` 字段，**全部忽略并原样保留**，不参与避重
2. **按 `news_type` + `content_profile` 查询推荐池**：
   - palette / layout：从 [style-template.md](style-template.md) Section D「话题→风格推荐矩阵」取出该类型的优先池
   - component：优先采用 Section D 的代表组合，再按 Section E 的 `viral_readable` 推荐组合和 Section C.6 的搭配建议微调
3. **过滤禁用**：
   - palette / layout：从推荐池中剔除历史禁用项
   - component：如果代表组合与最近 3 条完全重复，换同 palette/layout 下的相邻推荐变体
4. **做选择**：
   - palette / layout：剩余优先池按「与话题气质最契合」排序，取第 1 个；若优先池全被禁用，从全集（P1-P8 / L1-L4）中随机挑一个不在禁用名单的
   - component：先保证 `viral_readable` 的导语卡 / 信息卡 / 决策矩阵表达能力，再保证搭配协调且不与最近文章完全同款
5. **命名 `style_philosophy`**：根据本篇正文气质起一个 1-2 个英文词的短语（首字母大写），与最近 5 条历史不重复。例如 `Data Broadsheet` / `Calm Signal` / `Market Ledger`。

#### 输出到上下文

把选好的文章视觉语言卡写成一个 JSON 块放入 Agent 上下文，Step 5 直接读取：

```json
{
  "content_profile": "product_experience",
  "readability_mode": "viral_readable",
  "palette_id": "P6",
  "layout_id": "L3",
  "component_variant": {
    "h2": "divider-double",
    "h3": "dotted-prefix",
    "table": "zebra-light",
    "accent": "full-frame",
    "intro": "giant-quote"
  },
  "style_philosophy": "Data Broadsheet"
}
```

---

### Step 5：输出 article.html

#### 5.1 确定输出目录

目标路径：`~/wechat-articles/{YYYY-MM-DD}-{slug}/`

- 日期用文章写作当天
- slug 从文章主角提取，英文小写 + 短横线，示例：`gpt-5-5-launch`、`deepseek-v4-benchmark`、`gemini-3-2-vision`

在 Windows 下对应 `C:\Users\Administrator\wechat-articles\`。如果目录不存在用 PowerShell 创建：

```powershell
New-Item -ItemType Directory -Path "C:\Users\Administrator\wechat-articles\{YYYY-MM-DD}-{slug}" -Force
```

#### 5.2 生成 article.html（按视觉语言卡组装，不套固定模板）

依据 Step 4.5 的视觉语言卡，从 [style-template.md](style-template.md) 的 A/B/C 三个 section 中各取一套，**参数化拼装**出本篇专属的组件库，再生成完整 HTML。

操作顺序：

1. 从 Section A 取 `palette_id` 对应的色板，把 8 个色值（primary/warn/ok/text/muted/bg-soft/bg-warn/bg-ok）展开到一张「本篇 token 表」
2. 从 Section B 取 `layout_id` 对应的排版尺度，拿到字号层级、行高、段落间距、边框圆角
3. 从 Section C 取 5 个组件（h2/h3/table/accent/intro）各自对应的 `component_variant` 模板
4. 把 token 表代入模板，每个组件都把颜色、字号、间距替换成本篇专属值
5. 按 Section A 末尾的「文件骨架」拼成完整 HTML

**关键约束（继承自公众号编辑器限制）**：

- 100% 内联样式（`style="..."` 写在每个标签上）；不出现 `<style>` 块、`<script>`、`<link>`、`class`、`id`
- 外层包 `<section style="max-width:677px; margin:0 auto; ...">`
- 字体系统栈：`-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif`（极简瑞士风 L3 可切换为 `Georgia,'Times New Roman',serif`）
- 所有颜色用十六进制，不用 `rgb()` / 不用 CSS 变量
- 表格每个 `<td>` 单独写完整 style
- 文件顶部加 HTML 注释说明「浏览器打开 → 全选复制 → 粘贴公众号」操作步骤

生成完成后，照 [style-template.md](style-template.md) 末尾的「拼装检查清单」逐条自查。

#### 5.3 校验 article.html

生成完成后必须校验：

- `article.html` 存在
- 顶部 HTML 注释写明公众号复制步骤和本篇视觉语言
- 没有 `<style>` 块、`<script>`、`<link>`、`class`、`id`
- 外层包为 `<section style="max-width:677px; margin:0 auto; ...">`
- 所有颜色是十六进制具体值，不用 `rgb()` / CSS 变量
- 表格每个 `<td>` 都单独写完整 style
- 备选标题 5 条覆盖 5 类
- 文末参考资料至少 3 条，含官方或权威源

#### 5.4 追加样式历史（必做，否则避重失效）

把本篇文章视觉语言卡追加到 `~/wechat-articles/.design-history.json`。字段：

- `date`：今天
- `slug`：本篇 slug
- `news_type`：Step 3 标记的值
- `content_profile` / `readability_mode`
- `palette_id` / `layout_id` / `component_variant`
- `style_philosophy`：本篇起的正文设计哲学短语（档案标签）

追加完成后，**最多保留最近 30 条**，超出的从头部删除。如果 `~/wechat-articles/.design-history.json` 不存在，先新建为 `{ "version": 4, "entries": [] }` 再追加。若读到 v1/v2/v3 旧版本，原地把 `version` 改成 4；老条目里的 `lineage_id` / `archetype_id` / `canvas_philosophy` 保留不动，但不再写入新条目。

实际操作建议用 Python 直接做（PowerShell 处理嵌套 JSON 容易丢字段）。

#### 5.5 交付清单

输出完成后，向用户报告：

```
已生成：
  C:\Users\Administrator\wechat-articles\{dir}\article.html            ({字数}字, palette={P?}/layout={L?})

视觉语言：palette={P?} / layout={L?} / component={...}

已更新历史：~/wechat-articles/.design-history.json（共 N 条）

操作：
  1) 双击 article.html 浏览器打开 → Ctrl+A 全选 → Ctrl+C → 粘贴到公众号编辑器
```

---

## 常见问题速查

**Q：用户只给了一个主题方向（比如"写一篇关于 OpenAI 的"），怎么办？**
A：只要方向足以写作，就进入 `custom_topic`，围绕 OpenAI 定向采集资料并直接写，不再展示 Top 10。若主题过宽或角度不清，例如只说「AI」，先用 `AskQuestion` 让用户收窄。

**Q：用户没有给主题，只说"/wechat-ai-article"或"写 AI 周报"，怎么办？**
A：进入 `auto_news`，按原 Step 1A / Step 2 采集最近 7 天新闻、打分排序，并展示 Top 10 让用户选择。

**Q：Top 10 里我想合并写两条相关的怎么办？**
A：以分数最高的那条作为正文主线（决定 news_type、模板与正文视觉语言），另一条作为正文末尾「相关动态」段落简述并入，**不出第二份 article.html**。两条若主题差异过大（例如一条 AI 模型 + 一条芯片并购），不建议合并，请分两次跑 skill。

**Q：用户直接给了新闻链接让我写？**
A：进入 `direct_link`，按 Step 1C 用 `WebFetch` 读取链接原文，并补充 1-2 条交叉验证搜索；跳过 Step 2 的 Top 10，直接进入 Step 3。Step 4.5 照常跑。

**Q：HTML 粘贴到公众号后某段样式丢失？**
A：通常是公众号把段落重置为默认样式。建议用户在编辑器内选中该段重新设置字号，不需要重新生成 HTML。

**Q：设计历史文件损坏或想清空？**
A：可以直接删除 `~/wechat-articles/.design-history.json`，下一次 skill 运行会按空历史处理，不会报错。

**Q：想强制某篇用指定 palette / layout / philosophy？**
A：在 Step 4.5 前告诉 Agent，手动覆盖视觉语言卡即可。避重只是默认行为，用户显式要求优先级更高。

**Q：用户反馈文章读起来还是太硬核 / 像 paper 怎么办？**
A：先回 Step 4 的「可读性自检表」逐条核对。常见漏项与补救手段：
（1）每章节开头补一句「为什么你该关心这一段」，给读者一个继续读下去的理由；
（2）把 benchmark 大表挪到「延伸阅读」小节，正文只保留 3-5 行精简对比；
（3）连续技术段后塞 1 个生活类比（餐厅 / 流水线 / 球队 / 装修都行）；
（4）把最长段落拆成 2-3 段，每段 ≤ 4 行。
**只动 article.html 的正文 HTML 即可，不需要重跑 Step 4.5 / Step 5**，视觉语言卡不受影响。

**Q：技术文章读起来全是理论，没有使用方式或当前痛点怎么办？**
A：不要继续堆参数、论文细节或行业判断，先补两块正文：（1）「它解决的 2-4 个当前痛点」短表，逐条写清旧做法卡在哪里、新方案怎么缓解、适合谁、还有什么边界；（2）「今天就能试的最小场景」或「实战工作流」段落，让读者知道第一步怎么做、怎么判断效果、常见坑在哪里。技术类主题缺这两块时，不允许进入 Step 4.5 / Step 5。

## 参考文件

- 新闻源与查询语法：[news-sources.md](news-sources.md)
- HTML 内联样式组件库（色板/排版/组件 三维）：[style-template.md](style-template.md)
- 文章骨架范本：[article-examples.md](article-examples.md)
- 样式历史读写规则：见本文 Step 4.5 / Step 5.4
