# Tech News Sources Reference

给 Step 1 新闻采集用的信息源清单与 WebSearch 查询语法。本 skill 覆盖**整个科技领域**，AI 是其中权重最高的子方向，但同时关注芯片/硬件、大厂财报、开发者工具、GitHub 热门项目、MCP 与 agent skills 生态、新工程术语、安全事件、监管与并购等。

## 使用方式

在 Step 1 里**并行**发起 14 条基线 WebSearch 查询（不是串行），每条查询覆盖不同来源或角度；如果产品功能、开发者工具、开发者生态社区趋势、并购交易、一手官方 / 监管 / 财报信源任一类别为空，再追加 1-3 条补漏查询。WebSearch 会自动返回聚合结果，不需要逐个 URL 抓取。

默认配比：**14 条基线查询 = 5 条国际 AI / 产品 + 1 条国内 AI + 3 条开发者生态 / 社区趋势 + 2 条国际科技 / 交易 + 2 条国内科技 + 1 条硬件**。国际新闻与国内新闻同等重要，不允许只覆盖一侧。当周若 AI 平淡而硬件/财报/并购爆发，可追加科技泛搜，但必须保留至少 5 条 AI / AI 产品 / 开发工具相关查询，且保留至少 2 条开发者生态 / 社区趋势查询。

---

## A. AI 维度源

### A1：AI 厂商官方公告（最高可信度）

| 厂商 | 官方渠道 | 建议查询语法 |
| --- | --- | --- |
| Anthropic | anthropic.com/news | `site:anthropic.com/news this week` |
| OpenAI | openai.com/blog, openai.com/index | `site:openai.com blog this week release` |
| Google DeepMind | deepmind.google/discover/blog | `site:deepmind.google blog latest model` |
| Google AI | blog.google/technology/ai | `site:blog.google AI announcement this week` |
| Meta AI | ai.meta.com/blog | `site:ai.meta.com blog latest release` |
| Microsoft AI | blogs.microsoft.com/blog/category/ai | `Microsoft AI announcement this week` |
| Mistral | mistral.ai/news | `site:mistral.ai news release` |
| xAI | x.ai/news, x.ai/blog | `xAI Grok release this week` |
| DeepSeek | deepseek.com/news | `DeepSeek new model release this week` |
| Qwen（阿里） | qwenlm.github.io | `Qwen new model release this week` |
| Moonshot | kimi.moonshot.cn/news | `Kimi Moonshot release this week` |
| Zhipu | zhipuai.cn, chatglm.cn | `智谱 GLM 发布 本周` |
| 百度文心 / 飞桨 | wenxin.baidu.com, paddlepaddle.org.cn | `百度 文心 OR 飞桨 发布 本周` |
| 腾讯混元 | hunyuan.tencent.com | `腾讯 混元 发布 本周` |
| MiniMax | minimax.io, hailuoai.com | `MiniMax OR 海螺 AI 发布 本周` |
| 阶跃星辰 | stepfun.com | `阶跃星辰 StepFun 发布 本周` |
| 百川智能 | baichuan-ai.com | `百川智能 大模型 发布 本周` |
| 商汤日日新 | sensetime.com | `商汤 日日新 大模型 发布 本周` |
| 讯飞星火 | xfyun.cn, sparkdesk.xfyun.cn | `讯飞星火 发布 本周` |
| 华为盘古 | huawei.com, huaweicloud.com | `华为 盘古 大模型 发布 本周` |

**并行查询建议**：一次选 2-3 家当期最活跃的厂商并发查询，不必全量轮询。

### A2：AI 中文专业媒体

| 媒体 | 特点 | 查询模板 |
| --- | --- | --- |
| 机器之心 | 技术深度、论文解读强 | `机器之心 最新 AI 大模型 本周` |
| 量子位 | 行业动态快、产品评测 | `量子位 AI 模型 发布 本周` |
| 极客公园 | 产业与创业视角 | `极客公园 AI 大模型 本周` |
| 36kr AI | 投融资、大厂动态 | `36kr AI 本周 发布` |
| AI科技评论 | 学术 + 产业结合 | `AI科技评论 论文 模型 本周` |
| InfoQ 中国 | 工程落地视角 | `InfoQ AI 大模型 本周` |

### A3：AI 英文行业媒体

| 媒体 | 特点 | 查询模板 |
| --- | --- | --- |
| TechCrunch AI | 创业 + 产品发布 | `techcrunch AI this week` |
| The Verge AI | 消费级视角 | `theverge AI model this week` |
| The Information | 独家、付费墙多 | `theinformation AI this week scoop` |
| Ars Technica AI | 技术深度 | `arstechnica AI this week` |
| Semafor Tech | 行业内幕 | `semafor tech AI this week` |
| Platformer | 深度分析 | `platformer newsletter AI this week` |
| Stratechery | 战略分析 | `stratechery AI this week` |

### A4：研究与开源生态

| 平台 | 用途 | 查询模板 |
| --- | --- | --- |
| arXiv | 最新论文 | `arxiv AI LLM this week cs.CL` |
| Hugging Face | 开源模型发布 | `huggingface model release this week` |
| Papers With Code | 有代码的论文 | `paperswithcode LLM benchmark this week` |
| GitHub Trending | 开源项目动向 | `github trending AI LLM this week` |
| LMArena | 大模型竞技场排名 | `lmarena chatbot arena leaderboard latest` |
| Stanford HELM | 模型系统评测 | `Stanford HELM LLM evaluation latest` |
| Epoch AI | 模型、算力、产业数据 | `Epoch AI report model compute this week` |
| MLPerf | 训练 / 推理 benchmark | `MLPerf AI benchmark results latest` |
| SWE-bench | coding agent 能力评测 | `SWE-bench leaderboard agent coding latest` |
| Artificial Analysis | 模型价格、速度、质量对比 | `Artificial Analysis AI model leaderboard latest` |

### A5：开发者生态与社区趋势

| 平台 / 主题 | 用途 | 查询模板 |
| --- | --- | --- |
| GitHub Trending | 捕捉突然爆火的 AI coding、agent、MCP、workflow 项目 | `github trending AI agent MCP coding tools this week` |
| Hacker News | 捕捉开发者社区最早讨论的新工具和新概念 | `Hacker News MCP server agent skills context engineering this week` |
| Reddit / X 聚合 | 捕捉还未进入媒体报道的社区热词 | `Reddit OR X AI developer tools MCP skills this week` |
| MCP 生态 | Model Context Protocol、MCP server、工具接入生态 | `Model Context Protocol MCP server GitHub trending this week` |
| Agent skills / workflows | Cursor skills、Claude skills、agent workflow、自动化开发流 | `Cursor skills Claude skills agent workflow GitHub this week` |
| 新工程术语 | harness engineering、context engineering、eval harness、agent harness 等 | `harness engineering context engineering eval harness agent harness AI software engineering` |
| GitHub Blog / Changelog | 平台功能、Copilot、Actions、Security 官方动态 | `site:github.blog Copilot OR Actions OR security this week` |
| Stack Overflow Blog | 开发者趋势、语言和工具生态 | `site:stackoverflow.blog developer survey AI tools this week` |
| npm / PyPI 趋势 | JS / Python 包生态热度 | `npm trends OR PyPI downloads AI agent tools this week` |
| Docker / Kubernetes / CNCF | 容器、云原生、平台工程趋势 | `Docker Kubernetes CNCF AI developer tools this week` |
| Vercel / Cloudflare / Supabase / Neon | 前端云、边缘、数据库开发平台 | `Vercel Cloudflare Supabase Neon AI developer platform this week` |

**判断规则**：社区趋势类新闻可以先进入候选池，但进 Top 3 前必须至少满足「官方 repo / 作者博客 / HN 高热讨论 / 主流媒体报道」中的 2 类证据，避免把单篇营销帖当作趋势。

---

## B. 通用科技维度源

覆盖 AI 之外的硬件、财报、并购、监管、安全等。本 skill 把这些视为 AI 的**对等维度**，不是补充。

### B0：一手官方源（硬件 / 云 / 平台）

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| NVIDIA Newsroom | GPU、数据中心、AI 芯片、GTC | `site:nvidia.com/en-us/about-nvidia/blog OR site:nvidianews.nvidia.com this week` |
| AMD Newsroom | CPU / GPU / AI 加速卡 | `site:amd.com/en/newsroom this week AI OR GPU OR CPU` |
| Intel Newsroom | CPU、Foundry、数据中心芯片 | `site:intel.com/content/www/us/en/newsroom this week` |
| TSMC Newsroom | 晶圆代工、制程、产能 | `site:tsmc.com english news this week` |
| Apple Newsroom | Apple Silicon、设备、系统功能 | `site:apple.com/newsroom this week` |
| Qualcomm Newsroom | 移动 SoC、端侧 AI | `site:qualcomm.com/news this week AI OR Snapdragon` |
| Samsung Newsroom | 存储、手机、半导体 | `site:news.samsung.com semiconductor OR AI this week` |
| ASML Press | 光刻机、半导体设备 | `site:asml.com/en/news/press-releases this week` |
| AWS / Azure / Google Cloud | 云 AI、GPU、数据库、平台服务 | `AWS OR Azure OR Google Cloud AI service launch this week` |
| 阿里云 / 腾讯云 / 华为云 | 国内云 AI、模型服务、算力平台 | `阿里云 OR 腾讯云 OR 华为云 AI 服务 发布 本周` |

### B1：英文一级（财报 / 并购 / 监管）

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| Bloomberg Tech | 大厂财报、独家并购 | `site:bloomberg.com tech this week earnings OR acquisition` |
| Reuters Tech | 监管、政府动作 | `site:reuters.com technology this week` |
| FT Tech | 欧洲监管、深度报道 | `site:ft.com technology this week` |
| WSJ Tech | 美股、华尔街视角 | `site:wsj.com tech this week` |
| The Information | 独家、付费墙多 | `theinformation tech scoop this week` |
| SEC filings / Investor Relations | 财报、10-K/10-Q/8-K、业绩会材料 | `site:sec.gov OR investor relations earnings AI chip cloud this week` |
| FTC / DOJ / EU Commission | 反垄断、隐私、平台监管 | `FTC OR DOJ OR European Commission tech antitrust AI this week` |
| 国家网信办 / 工信部 / 市监总局 | 国内 AI、数据、平台和半导体监管 | `网信办 OR 工信部 OR 市监总局 AI OR 科技 监管 本周` |

### B2：英文二级（硬件 / 芯片 / 工程深度）

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| Ars Technica | 跨硬件 / 安全 / 科学的技术深度 | `arstechnica tech this week` |
| The Register | 企业 IT、云、服务器、芯片 | `theregister tech this week` |
| Tom's Hardware | 消费 / 工作站硬件评测 | `tomshardware new release this week` |
| AnandTech / Chips and Cheese | 芯片架构深度 | `chipsandcheese new chip review this week` |
| Wccftech | 显卡 / CPU 泄露与发布 | `wccftech GPU OR CPU launch this week` |
| The Verge | 消费电子、设计 | `theverge tech this week launch` |
| Engadget | 消费电子、汽车科技 | `engadget tech this week launch` |

### B3：英文社区与垂直

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| Hacker News（top stories） | 开发者关注热点的实时风向 | `news.ycombinator top stories this week tech` |
| Lobsters | 开发者深度讨论 | `lobste.rs hot this week` |
| GitHub Trending | 热门 repo、AI 工具、MCP servers、agent workflow | `github trending developer tools AI agents this week` |
| Reddit Programming / LocalLLaMA | 早期工具体验与社区热词 | `reddit programming LocalLLaMA AI developer tools this week` |
| Krebs on Security | 重大安全事件首发 | `site:krebsonsecurity.com this week` |
| SecurityWeek | 漏洞披露、CVE | `securityweek vulnerability disclosure this week` |
| BleepingComputer | 安全事件、勒索软件 | `bleepingcomputer breach OR vulnerability this week` |
| MIT Technology Review | 长尾科技、政策 | `technologyreview tech this week` |

### B4：中文综合

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| 36kr | 投融资、大厂动态 | `36kr 本周 重磅 大厂` |
| 虎嗅 | 商业评论、产业分析 | `虎嗅 本周 科技 大厂` |
| 钛媒体 | 产业、政策、出海 | `钛媒体 本周 科技` |
| 智东西 | 智能硬件、AI、汽车 | `智东西 本周 发布` |
| 雷锋网 | AI、智能硬件 | `雷锋网 本周 AI 硬件` |
| 极客公园 | 产业与创业 | `极客公园 本周 科技` |

### B5：中文垂直

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| IT 之家 | 消费电子、Windows/手机生态 | `IT之家 本周 发布 上架` |
| 少数派 | 工具、效率、Apple 生态 | `少数派 本周 工具 评测` |
| 集微网 | 半导体、芯片产业 | `集微网 本周 芯片 半导体` |
| 半导体行业观察 | 芯片、晶圆厂、设备 | `半导体行业观察 本周` |
| 安兔兔 | 移动芯片性能 | `安兔兔 本周 跑分 芯片` |
| 汽车之家 / 36kr 出行 | 智能汽车 / 自动驾驶 | `36kr 出行 本周 智能汽车` |

### B6：安全一手源与漏洞数据库

| 源 | 主战场 | 查询模板 |
| --- | --- | --- |
| NVD / CVE | CVE 编号、漏洞基础信息 | `site:nvd.nist.gov CVE AI cloud vulnerability this week` |
| CISA KEV | 已被利用漏洞、政府预警 | `site:cisa.gov known exploited vulnerabilities this week` |
| GitHub Security Advisories | 开源依赖安全公告 | `site:github.com/advisories AI OR developer tools this week` |
| Google Project Zero | 高质量漏洞研究 | `site:googleprojectzero.blogspot.com this week vulnerability` |
| Microsoft MSRC | Windows / Azure / Microsoft 安全公告 | `site:msrc.microsoft.com update guide vulnerability this week` |
| Cloudflare Radar / Blog | 互联网流量、安全事件、DDoS | `site:blog.cloudflare.com security OR radar this week` |

---

## 并行查询套餐模板

Step 1 可直接套用下面的套餐，根据当天情况选 1 套：

### 套餐 A：常规周更（14 条基线查询，国际 + 国内并重，**默认推荐**）

5 条国际 AI / 产品 + 1 条国内 AI + 3 条开发者生态 / 社区趋势 + 2 条国际科技 / 交易 + 2 条国内科技 + 1 条硬件：

1. `latest AI model release this week anthropic OR openai OR google OR meta OR deepseek OR mistral OR qwen`
2. `OpenAI image model OR Image 2 OR image generation release this week site:openai.com OR site:techcrunch.com OR site:theverge.com`
3. `AI product feature launch image video voice agent this week OpenAI Google Anthropic Meta xAI`
4. `new LLM benchmark OR agent capability release this week site:arxiv.org OR site:huggingface.co OR SWE-bench OR HELM`
5. `最新 AI 大模型 OR AI 新能力 发布 本周 机器之心 OR 量子位 OR 智东西 OR 百度文心 OR 腾讯混元`
6. `Cursor Windsurf Replit GitHub Copilot Claude Code acquisition funding partnership this week`
7. `MCP server OR Model Context Protocol OR agent skills OR Cursor skills GitHub trending this week`
8. `harness engineering OR context engineering OR eval harness OR agent harness AI software engineering this week`
9. `latest tech news this week chips OR earnings OR M&A site:bloomberg.com OR site:ft.com OR site:theinformation.com`
10. `Elon Musk xAI buys OR acquires OR investment Cursor this week Bloomberg Reuters The Information`
11. `new hardware OR chip launch this week NVIDIA OR AMD OR Intel OR TSMC OR Qualcomm OR Apple Silicon`
12. `科技 本周 重磅 大厂 OR 财报 OR 并购 36kr OR 虎嗅 OR 钛媒体`
13. `国产 大模型 OR 国产 芯片 OR 国产 智能硬件 发布 本周 百度文心 OR 腾讯混元 OR MiniMax OR 阶跃星辰 OR 华为盘古`
14. `GitHub trending AI agent tools OR Hacker News MCP skills this week`

### 套餐 B：硬件 / 芯片专搜（4 条并行查询）

1. `new GPU OR CPU OR chip launch this week NVIDIA OR AMD OR Intel OR Qualcomm OR Apple Silicon`
2. `site:nvidia.com OR site:amd.com OR site:intel.com OR site:tsmc.com newsroom this week`
3. `集微网 OR 半导体行业观察 本周 芯片 量产 良率`
4. `data center hardware launch this week site:theregister.com OR site:tomshardware.com OR site:anandtech.com`

### 套餐 C：大厂财报 / 并购 / 监管（4 条并行查询）

1. `big tech earnings this week site:bloomberg.com OR site:reuters.com OR site:ft.com`
2. `site:sec.gov OR investor relations big tech earnings AI cloud chip this week`
3. `EU OR FTC OR DOJ OR 网信办 OR 工信部 tech antitrust AI ruling this week`
4. `36kr OR 虎嗅 本周 大厂 财报 收购 监管`

### 套餐 D：安全事件 / 漏洞披露（3 条并行查询）

1. `site:krebsonsecurity.com OR site:securityweek.com this week breach OR vulnerability`
2. `site:cisa.gov OR site:nvd.nist.gov OR site:github.com/advisories vulnerability this week`
3. `major CVE OR zero-day disclosure this week Microsoft MSRC OR Google Project Zero OR Cloudflare`

### 套餐 E：纯中文语境（3 条并行查询）

1. `最新科技新闻 本周 36kr OR 虎嗅 OR 钛媒体`
2. `国产芯片 OR 国产硬件 OR 国产大模型 发布 本周`
3. `AI OR 半导体 OR 智能汽车 行业 本周 融资 OR 开源 OR benchmark`

### 套餐 G：AI 产品与开发工具生态（5 条并行查询）

用于补抓 OpenAI Image 2、视频/语音能力、agent UI、Cursor / Windsurf / Replit / Copilot、MCP servers、agent skills、GitHub 热门工具等开发者工具生态新闻。

1. `OpenAI image model OR Image 2 OR image generation release this week site:openai.com OR site:techcrunch.com OR site:theverge.com`
2. `AI product feature launch image video voice agent this week OpenAI Google Anthropic Meta xAI`
3. `Cursor Windsurf Replit GitHub Copilot Claude Code OpenCode product launch this week`
4. `developer tools AI coding agent Cursor Windsurf Replit Copilot Vercel Cloudflare Supabase funding acquisition this week`
5. `MCP server Model Context Protocol agent skills Cursor skills Claude Code GitHub Blog Hacker News this week`

### 套餐 I：开发者生态 / 社区趋势 / 新工程术语（6 条并行查询）

用于补抓尚未进入主流媒体、但已经在开发者社区发酵的热门 repo、MCP server、skills、agent workflow 和新术语。适合用户问“最近开发者圈有什么新东西”“MCP/skills/GitHub 热门项目有没有覆盖”。

1. `GitHub trending AI agent tools MCP server this week`
2. `Model Context Protocol popular MCP servers GitHub this week`
3. `Cursor skills Claude skills agent skills workflow GitHub this week`
4. `Hacker News MCP server agent workflow AI coding tools this week`
5. `harness engineering context engineering eval harness agent harness AI software engineering`
6. `热门 MCP OR AI 开发工具 OR GitHub 热门项目 OR agent workflow 本周`

### 套餐 H：并购交易 / 创始人动态（5 条并行查询）

用于补抓收购、战略投资、创始人买入、组织调整等不一定出现在模型发布检索里的大新闻。

1. `AI startup acquisition OR strategic investment this week OpenAI Microsoft xAI Google Anthropic`
2. `Elon Musk xAI buys OR acquires OR investment Cursor this week Bloomberg Reuters The Information`
3. `tech founder buys startup acquisition AI developer tools this week`
4. `site:bloomberg.com OR site:reuters.com AI startup acquisition funding this week`
5. `马斯克 OR xAI OR OpenAI OR 微软 收购 投资 Cursor Windsurf 本周`

### 套餐 J：一手官方 / 监管 / 财报补强（5 条并行查询）

用于避免只依赖媒体摘要。适合 Top 3 候选涉及财报、监管、芯片发布、云平台发布、重大安全事件时补强一手证据。

1. `site:sec.gov OR investor relations earnings AI cloud chip this week`
2. `site:nvidia.com OR site:amd.com OR site:intel.com OR site:tsmc.com newsroom this week`
3. `FTC OR DOJ OR European Commission OR 网信办 OR 工信部 AI tech regulation this week`
4. `AWS OR Azure OR Google Cloud OR 阿里云 OR 腾讯云 OR 华为云 AI service launch this week`
5. `site:cisa.gov OR site:nvd.nist.gov OR site:github.com/advisories vulnerability this week`

### 套餐 F：深追一个热点（用户已指定话题时，4 条并行）

1. `"{话题关键词}" site:bloomberg.com OR site:reuters.com OR site:theinformation.com`
2. `"{话题关键词}" benchmark OR review OR teardown`
3. `"{话题关键词}" 机器之心 OR 量子位 OR 36kr OR 虎嗅`
4. `"{话题关键词}" technical deep dive analysis`

---

## 采集产物格式

每条候选新闻在 Step 1 结束时应整理成结构化数据：

```
标题: ...
来源: [AI 官方/AI 中文媒体/AI 英文媒体/芯片硬件官方/云与开发平台官方/财报监管官方/科技英文一级/科技英文二级/科技中文综合/科技中文垂直/开发者社区/安全一手源/安全媒体/硬件/开发者工具/交易动态]
分类: [AI 模型 / AI 新能力 / AI 产品功能 / 硬件 / 芯片 / 财报 / 并购 / 战略投资 / 创始人动态 / 人事 / 监管 / 安全 / 开发者工具 / 开发者生态 / MCP / agent skills / GitHub trending / 新工程术语 / 开源 / 论文 / 智能汽车 / 其他]
地域: [国际 / 国内 / 全球]
发布时间: YYYY-MM-DD（或 unknown）
一句话摘要: 不超过 40 字
URL: ...
交叉报道: [列出其他报道源]
```

`分类` 字段供 Step 2 平衡候选清单（确保 AI 占比 ≥ 50% 同时给非 AI 重磅留位置）和 Step 3 选 news_type 时参考。
`地域` 字段供 Step 2 校验「国际 ≥ 3 条、国内 ≥ 3 条」配比硬约束；跨境议题（如全球性监管或多国同步发布）标 `全球`，不计入国际/国内任一侧的最低条数。

---

## 注意事项

- **不要轮询所有源**，并行发 14 条基线查询；只有当「AI 产品功能 / 开发者工具 / 开发者生态社区趋势 / 并购交易 / 一手官方或监管财报证据」候选为空时才追加 1-3 条补漏查询
- **国际 / 国内必须双覆盖**：14 条基线里至少 3 条针对中文源、至少 5 条针对英文源，避免 Top 10 全是英文新闻或全是国内新闻
- **AI、产品、科技泛搜、开发者社区并重**：默认套餐 A 已经覆盖模型、产品功能、开发者工具、MCP/skills/GitHub trending、新工程术语、硬件/财报/交易。不要全 14 条都打模型，否则 OpenAI Image 2、Cursor 交易、消费级 AI 功能、热门 MCP、harness engineering 这类新闻会漏掉
- **重大新闻优先找一手源**：模型 / 芯片 / 云服务发布优先交叉官方公告；财报和监管优先查 IR / SEC / 监管机构；安全事件优先查 NVD / CISA / vendor advisory，再用媒体做可读性补充
- **社区热词要做可信度分层**：GitHub / HN / Reddit / X 上的热词可以入候选，但进入 Top 3 前至少要有 repo、作者说明、主流社区讨论或媒体报道中的两类证据
- **不完全信任摘要**：如果某条要进入 Top 3，用 `WebFetch` 读一次原文，避免因摘要误判重要性
- **时间戳存疑时降权**：WebSearch 结果里不带明确发布日期的，打分时时效性维度算 0 分
- **付费墙内容**：The Information / WSJ / FT 等站点搜到的条目，如果 WebFetch 不到全文，不要当作主选题，可作为交叉验证
- **安全事件特殊处理**：Krebs / SecurityWeek 出独家时往往 24 小时内就有多家跟进；若只有单源，等 24 小时再决定是否进 Top 3
