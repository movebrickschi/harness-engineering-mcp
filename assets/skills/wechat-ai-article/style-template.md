# WeChat Inline Style Design System Library

本文件是一个**三维设计系统库**：色板（A）× 排版尺度（B）× 组件形态（C），任意组合生成不重复的视觉语言。Step 4.5 从里面挑，Step 5.2 据此参数化拼装。不是固定模板，不要照搬。

**不变量**：公众号编辑器过滤 `<style>` 块与 class 选择器，所以所有样式都必须内联（`style="..."` 直接写在标签上）。

---

## Section A：8 套色板库

每套色板提供 8 个 token：`primary` / `warn` / `ok` / `text` / `muted` / `divider` / `bg-soft` / `bg-warn` / `bg-ok`。选 palette 时考虑与话题气质是否契合，并结合避重规则（Step 4.5）。

### P1 深蓝暖橙（严肃技术报道 / 默认）
| token | 值 |
| --- | --- |
| primary | `#1f6feb` |
| warn | `#d97706` |
| ok | `#16a34a` |
| text | `#3f3f3f` |
| muted | `#888888` |
| divider | `#eef0f3` |
| bg-soft | `#f7f8fa` |
| bg-warn | `#fffaf2` |
| bg-ok | `#f0f9f4` |

### P2 墨绿金（学术 / 沉稳）
| token | 值 |
| --- | --- |
| primary | `#0f766e` |
| warn | `#b45309` |
| ok | `#15803d` |
| text | `#2d3748` |
| muted | `#718096` |
| divider | `#e6e9ea` |
| bg-soft | `#f5f7f6` |
| bg-warn | `#fdf6ec` |
| bg-ok | `#eef7f1` |

### P3 酒红米白炭黑（警示 / 大事件）
| token | 值 |
| --- | --- |
| primary | `#b91c1c` |
| warn | `#92400e` |
| ok | `#166534` |
| text | `#1f2937` |
| muted | `#6b7280` |
| divider | `#eadfd5` |
| bg-soft | `#fef3c7` |
| bg-warn | `#fef2f2` |
| bg-ok | `#ecfdf5` |

### P4 电紫湖蓝粉（创意 / 消费级产品）
| token | 值 |
| --- | --- |
| primary | `#6d28d9` |
| warn | `#ea580c` |
| ok | `#0891b2` |
| text | `#334155` |
| muted | `#94a3b8` |
| divider | `#ece7f3` |
| bg-soft | `#faf5ff` |
| bg-warn | `#fff7ed` |
| bg-ok | `#ecfeff` |

### P5 炭黑金铜雾青（高奢 / 旗舰发布）
| token | 值 |
| --- | --- |
| primary | `#a16207` |
| warn | `#b45309` |
| ok | `#64748b` |
| text | `#1a1a1a` |
| muted | `#6b6b6b` |
| divider | `#e5e0d8` |
| bg-soft | `#faf7f2` |
| bg-warn | `#fbf1e0` |
| bg-ok | `#f1f3f5` |

### P6 靛蓝沙金（深度分析）
| token | 值 |
| --- | --- |
| primary | `#1e3a8a` |
| warn | `#ca8a04` |
| ok | `#0e7490` |
| text | `#1f2937` |
| muted | `#64748b` |
| divider | `#e5e8ef` |
| bg-soft | `#f5f7fb` |
| bg-warn | `#fefce8` |
| bg-ok | `#ecfeff` |

### P7 青蓝橙红（行业观察 / 新闻质感）
| token | 值 |
| --- | --- |
| primary | `#0e7490` |
| warn | `#ea580c` |
| ok | `#047857` |
| text | `#374151` |
| muted | `#6b7280` |
| divider | `#e2e8ec` |
| bg-soft | `#f0f9fa` |
| bg-warn | `#fff7ed` |
| bg-ok | `#ecfdf5` |

### P8 纯白单蓝（瑞士极简 / 论文解读）
| token | 值 |
| --- | --- |
| primary | `#1d4ed8` |
| warn | `#374151` |
| ok | `#065f46` |
| text | `#111111` |
| muted | `#9ca3af` |
| divider | `#e5e7eb` |
| bg-soft | `#fafafa` |
| bg-warn | `#f9fafb` |
| bg-ok | `#f9fafb` |

---

## Section B：4 套排版尺度

每套提供：字号层级（h1/h2/h3/body/caption）、行高、段落间距、边框圆角、字体栈。

### L1 紧凑新闻（现状，信息密度高）
| 维度 | 值 |
| --- | --- |
| font-stack | `-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif` |
| h1 | 22px / bold / line-height 1.4 |
| h2 | 18px / bold / line-height 1.5 |
| h3 | 16px / bold / line-height 1.5 |
| body | 15px / line-height 1.85 |
| caption | 13px / line-height 1.6 |
| para-gap | margin 16px 0 |
| section-gap | margin 36-40px 0 18px 0 |
| radius | 2px |
| outer-padding | 32px 24px |

### L2 杂志级（大字号对比，视觉强烈）
| 维度 | 值 |
| --- | --- |
| font-stack | `-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif` |
| h1 | 28px / bold / line-height 1.3 |
| h2 | 22px / bold / line-height 1.4 |
| h3 | 17px / bold / line-height 1.5 |
| body | 16px / line-height 1.9 |
| caption | 13px / line-height 1.6 |
| para-gap | margin 20px 0 |
| section-gap | margin 48px 0 22px 0 |
| radius | 4px |
| outer-padding | 40px 28px |

### L3 极简瑞士（大量留白，小字精致）
| 维度 | 值 |
| --- | --- |
| font-stack | `-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC',sans-serif` |
| h1 | 24px / 500 / line-height 1.35 / letter-spacing 0.2px |
| h2 | 17px / 600 / line-height 1.5 |
| h3 | 14px / 700 / line-height 1.5 / uppercase / letter-spacing 1px |
| body | 14px / line-height 1.95 |
| caption | 12px / line-height 1.6 |
| para-gap | margin 18px 0 |
| section-gap | margin 56px 0 20px 0 |
| radius | 0 |
| outer-padding | 48px 32px |

### L4 编辑部厚重（衬线体，文学气质）
| 维度 | 值 |
| --- | --- |
| font-stack | `Georgia,'Times New Roman','Songti SC','STSong',serif` |
| h1 | 26px / 700 / line-height 1.35 |
| h2 | 20px / 700 / line-height 1.5 |
| h3 | 17px / 700 / italic / line-height 1.5 |
| body | 16px / line-height 1.95 |
| caption | 13px / italic / line-height 1.7 |
| para-gap | margin 20px 0 |
| section-gap | margin 44px 0 20px 0 |
| radius | 2px |
| outer-padding | 40px 28px |

---

## Section C：5 个组件 × 5 个形态变体

每个位置选一个变体，组合数 = 5^5 = 3125，足够避免重复。下面的 `{primary}` / `{body-size}` 等占位符在 Step 5.2 用 A/B 的 token 替换。

### C.1 章节标题 h2 —— 5 变体

**`left-bar`（现状，通用）**
```html
<h2 style="margin:{section-gap}; padding-left:10px; font-size:{h2-size}; font-weight:700; line-height:1.5; color:{text}; border-left:4px solid {primary};">{章节标题}</h2>
```

**`divider-double`（上下双线，杂志感）**
```html
<h2 style="margin:{section-gap}; padding:10px 0 8px 0; font-size:{h2-size}; font-weight:700; line-height:1.4; color:{text}; border-top:2px solid {primary}; border-bottom:1px solid {divider};">{章节标题}</h2>
```

**`giant-numeral`（大号数字前缀，数据感）**
```html
<h2 style="margin:{section-gap}; padding:0; font-size:{h2-size}; font-weight:700; line-height:1.35; color:{text};"><span style="display:inline-block; margin-right:12px; font-size:{h1-size}; font-weight:800; color:{primary}; vertical-align:-2px;">{01}</span>{章节标题}</h2>
```

**`color-block`（整块色底白字，强烈视觉）**
```html
<h2 style="margin:{section-gap}; padding:12px 16px; font-size:{h2-size}; font-weight:700; line-height:1.4; color:#ffffff; background:{primary}; border-radius:{radius};">{章节标题}</h2>
```

**`symmetric-dash`（左右短线居中，优雅）**
```html
<h2 style="margin:{section-gap}; padding:0; font-size:{h2-size}; font-weight:700; line-height:1.5; color:{text}; text-align:center;"><span style="display:inline-block; width:24px; height:2px; background:{primary}; vertical-align:middle; margin-right:14px;"></span>{章节标题}<span style="display:inline-block; width:24px; height:2px; background:{primary}; vertical-align:middle; margin-left:14px;"></span></h2>
```

### C.2 子章节 h3 —— 5 变体

**`bottom-line`（底部浅线，通用）**
```html
<h3 style="margin:28px 0 14px 0; padding:0 0 6px 0; font-size:{h3-size}; font-weight:700; line-height:1.5; color:{primary}; border-bottom:1px solid {divider};">{子章节}</h3>
```

**`dotted-prefix`（圆点前缀）**
```html
<h3 style="margin:28px 0 14px 0; padding:0; font-size:{h3-size}; font-weight:700; line-height:1.5; color:{text};"><span style="display:inline-block; width:8px; height:8px; background:{primary}; border-radius:50%; margin-right:10px; vertical-align:middle;"></span>{子章节}</h3>
```

**`indent-color`（缩进 + 色字，克制）**
```html
<h3 style="margin:26px 0 12px 24px; padding:0; font-size:{h3-size}; font-weight:700; line-height:1.5; color:{primary};">{子章节}</h3>
```

**`bracket-prefix`（中括号编号，杂志）**
```html
<h3 style="margin:28px 0 14px 0; padding:0; font-size:{h3-size}; font-weight:700; line-height:1.5; color:{text};"><span style="color:{muted}; font-weight:500; margin-right:8px;">[ {01} ]</span>{子章节}</h3>
```

**`small-caps`（小号大写，极简）**
```html
<h3 style="margin:30px 0 10px 0; padding:0; font-size:{caption-size}; font-weight:700; line-height:1.5; color:{primary}; text-transform:uppercase; letter-spacing:1.5px;">{子章节}</h3>
```

### C.3 表格 —— 5 变体

所有变体共用外层：`<table border="0" cellspacing="0" cellpadding="0" style="width:100%; margin:20px 0; border-collapse:collapse; font-size:13px; line-height:1.6;">`。每个 `<td>` 单独写完整 style。

**`dark-header`（深色表头，现状）**
- thead td：`padding:10px 8px; background:{primary}; color:#ffffff; font-weight:700; border:1px solid {primary};`
- tbody 奇数行 td：`padding:10px 8px; background:#ffffff; border:1px solid #e5e7eb;`
- tbody 偶数行 td：`padding:10px 8px; background:#fafbfc; border:1px solid #e5e7eb;`

**`zebra-light`（无表头背景 + 斑马纹）**
- thead td：`padding:10px 8px; background:{bg-soft}; color:{text}; font-weight:700; border-bottom:2px solid {primary};`
- tbody 奇数行 td：`padding:10px 8px; background:#ffffff; border-bottom:1px solid {divider};`
- tbody 偶数行 td：`padding:10px 8px; background:{bg-soft}; border-bottom:1px solid {divider};`

**`full-border`（全边框方格）**
- thead td：`padding:10px 8px; background:#ffffff; color:{primary}; font-weight:700; border:2px solid {primary};`
- tbody td：`padding:10px 8px; background:#ffffff; border:1px solid {divider};`

**`minimal-bottom`（极简只剩底线）**
- thead td：`padding:12px 8px; background:transparent; color:{muted}; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid {text};`
- tbody td：`padding:12px 8px; background:transparent; border-bottom:1px solid {divider};`

**`card-rows`（卡片化行，圆角）**
- thead td：`padding:12px 10px; background:{primary}; color:#ffffff; font-weight:700;`（外层 table 加 `border-radius:{radius}; overflow:hidden;`）
- tbody 奇数行 td：`padding:12px 10px; background:#ffffff;`
- tbody 偶数行 td：`padding:12px 10px; background:{bg-soft};`

**强调数据统一规则**（任何变体都适用）：
- 关键数据：`color:{primary}; font-weight:700`
- 提升幅度：`color:{ok}; font-weight:700`
- 下降数据：`color:{warn}; font-weight:700`

### C.4 强调块（警示 / 迁移指南）—— 5 变体

**`left-bar`（左侧色条，现状）**
```html
<section style="margin:16px 0; padding:14px 16px; background:{bg-warn}; border-left:3px solid {warn}; border-radius:{radius};">
<p style="margin:0 0 10px 0; line-height:1.85;"><strong style="color:{warn};">{要点}</strong> {描述}</p>
</section>
```

**`full-frame`（全框色卡）**
```html
<section style="margin:18px 0; padding:14px 16px; background:{bg-warn}; border:1px solid {warn}; border-radius:{radius};">
<p style="margin:0; font-weight:700; color:{warn}; font-size:13px; text-transform:uppercase; letter-spacing:1px;">{标签}</p>
<p style="margin:8px 0 0 0; line-height:1.85; color:{text};">{描述}</p>
</section>
```

**`ribbon-tag`（色带标签，顶部角标）**
```html
<section style="margin:18px 0; padding:14px 16px; background:{bg-warn}; border-radius:{radius}; position:relative;">
<span style="display:inline-block; padding:3px 10px; background:{warn}; color:#ffffff; font-size:12px; font-weight:700; border-radius:2px; margin-bottom:8px;">{标签}</span>
<p style="margin:0; line-height:1.85; color:{text};">{描述}</p>
</section>
```

**`icon-less-bar`（无 icon 的纯色竖条 + 色字加粗）**
```html
<section style="margin:16px 0; padding:0 0 0 14px; border-left:5px solid {warn};">
<p style="margin:0; line-height:1.85; color:{text};"><strong style="color:{warn}; margin-right:8px;">{要点}：</strong>{描述}</p>
</section>
```

**`quote-block`（左引号大号色字，文学感）**
```html
<section style="margin:20px 0; padding:12px 18px; background:{bg-warn}; border-radius:{radius};">
<span style="display:block; font-size:28px; font-weight:700; color:{warn}; line-height:1; margin-bottom:4px;">&ldquo;</span>
<p style="margin:0; line-height:1.85; color:{text};">{描述}</p>
</section>
```

**`timeline-card`（时间线卡片，专为 retrospective / evolution 骨架）**
```html
<section style="margin:18px 0; padding:14px 16px 14px 18px; background:{bg-soft}; border-left:4px solid {primary}; border-radius:{radius};">
<p style="margin:0 0 6px 0; font-size:12px; font-weight:700; color:{primary}; letter-spacing:1px; text-transform:uppercase;">{版本号 / 阶段名} · {时间}</p>
<p style="margin:0 0 6px 0; font-weight:700; color:{text}; line-height:1.6;">{这一版的关键变化}</p>
<p style="margin:0; font-size:{caption-size}; color:{muted}; line-height:1.7;">{当时的痛点或决策原因}</p>
</section>
```

### C.5 引导块（文首简介）—— 5 变体

**`gray-bar`（灰底左色条，现状）**
```html
<section style="margin:0 0 28px 0; padding:14px 16px; background:{bg-soft}; border-left:3px solid {primary}; border-radius:{radius};">
<p style="margin:0; font-size:{caption-size}; color:{muted}; line-height:1.7;">{开篇引导}</p>
</section>
```

**`giant-quote`（巨号左引号，文学化）**
```html
<section style="margin:0 0 32px 0; padding:8px 0 8px 40px; position:relative;">
<span style="position:absolute; left:0; top:-6px; font-size:48px; font-weight:700; color:{primary}; line-height:1;">&ldquo;</span>
<p style="margin:0; font-size:{body-size}; color:{text}; line-height:1.85; font-style:italic;">{开篇引导}</p>
</section>
```

**`center-caption`（居中金句，极简）**
```html
<p style="margin:0 0 32px 0; text-align:center; font-size:{body-size}; color:{muted}; line-height:1.8; font-weight:500;">{开篇引导}</p>
```

**`bordered-card`（全框卡片）**
```html
<section style="margin:0 0 30px 0; padding:16px 18px; background:#ffffff; border:1px solid {divider}; border-top:3px solid {primary}; border-radius:{radius};">
<p style="margin:0; font-size:{caption-size}; color:{text}; line-height:1.75;">{开篇引导}</p>
</section>
```

**`meta-line`（副标题信息条 + 分隔线）**
```html
<p style="margin:0 0 8px 0; text-align:center; font-size:12px; color:{muted}; letter-spacing:1.5px; text-transform:uppercase;">{分类} · {字数} · {阅读时间}</p>
<hr style="border:none; border-top:1px solid {divider}; margin:0 0 28px 0;">
```

---

### C.6 搭配建议（避免灾难性组合）

某些 palette × layout × variant 的组合会水土不服。选 variant 时参考下表：

| palette | 推荐 layout | h2 推荐 | table 推荐 | 避免 |
| --- | --- | --- | --- | --- |
| P1 深蓝暖橙 | L1 / L2 | left-bar / giant-numeral | dark-header | color-block（过艳） |
| P2 墨绿金 | L1 / L4 | divider-double | zebra-light | color-block |
| P3 酒红米白 | L1 / L4 | giant-numeral / divider-double | zebra-light / card-rows | symmetric-dash（太轻） |
| P4 电紫湖蓝 | L2 | color-block / giant-numeral | card-rows / dark-header | minimal-bottom（过素） |
| P5 炭黑金铜 | L2 / L4 | symmetric-dash / divider-double | minimal-bottom | color-block（俗） |
| P6 靛蓝沙金 | L1 / L2 | left-bar / divider-double | dark-header / zebra-light | giant-numeral（太张） |
| P7 青蓝橙红 | L1 | left-bar / giant-numeral | zebra-light | quote-block（突兀） |
| P8 纯白单蓝 | L3 | symmetric-dash / small-caps | minimal-bottom | color-block（破极简） |

---

## Section D：话题 → 风格推荐矩阵（Step 4.5 的优先池）

| `news_type` | palette 优先池 | layout 优先池 | 代表 component_variant 组合 |
| --- | --- | --- | --- |
| `flagship_release`（旗舰发布） | P1, P5, P4 | L2, L1 | h2=giant-numeral, h3=bottom-line, table=card-rows, accent=ribbon-tag, intro=giant-quote |
| `paper_breakthrough`（论文突破） | P6, P8, P2 | L3, L4 | h2=symmetric-dash, h3=small-caps, table=minimal-bottom, accent=full-frame, intro=meta-line |
| `industry_event`（行业大事件） | P3, P7, P6 | L1, L4 | h2=divider-double, h3=bracket-prefix, table=zebra-light, accent=quote-block, intro=bordered-card |
| `developer_ecosystem`（开发者生态） | P4, P1, P7 | L1, L2 | h2=left-bar, h3=dotted-prefix, table=card-rows, accent=full-frame, intro=bordered-card |
| `rumor_funding`（小道消息） | P7, P4, P1 | L1 | h2=left-bar, h3=dotted-prefix, table=dark-header, accent=icon-less-bar, intro=center-caption |
| `practice_methodology`（个人实战复盘） | P5, P3, P7 | L2, L4 | h2=giant-numeral, h3=bracket-prefix, table=zebra-light, accent=full-frame, intro=giant-quote |
| `product_evolution`（项目 / 产品迭代复盘） | P2, P6, P1 | L1, L4 | h2=divider-double, h3=small-caps, table=zebra-light, accent=timeline-card, intro=meta-line |

**用法**：Step 4.5 先从这张表查出优先池，然后按避重规则剔除最近 3 条已用过的 palette、最近 2 条的 layout，剩下的取第 1 个。

---

## Section E：readability_mode 推荐组合

`readability_mode` 控制文章的阅读节奏和组件密度。默认使用 `viral_readable`：更强导语卡、更短段落、更频繁的信息卡和更明确的决策段。它仍然只使用 Section A/B/C 的内联组件，不引入 `<style>`、`class`、外链图片或脚本。

### `viral_readable`（默认）

适合：大多数科技公众号文章，尤其是产品对比、AI 功能发布、行业热点、工具选择、并购解读。

| 位置 | 推荐组件 | 用法 |
| --- | --- | --- |
| 文首“先说结论” | `intro=bordered-card` / `intro=gray-bar` | 3-5 条短判断，放在主标题后、正文故事钩子前 |
| 章节标题 | `h2=left-bar` / `h2=giant-numeral` / `h2=divider-double` | 每个标题都带判断，不写“背景/影响/总结”空标题 |
| 小节标题 | `h3=dotted-prefix` / `h3=bottom-line` | 每 600-800 字插一次，用来打断长阅读 |
| 信息卡 / 风险提示 | `accent=full-frame` / `accent=ribbon-tag` / `accent=icon-less-bar` / `accent=timeline-card` | 包装“这和你有什么关系”“该不该行动”“风险边界”；版本 / 阶段卡片选 `timeline-card` |
| 对比表 / 决策矩阵 | `table=zebra-light` / `table=card-rows` | 控制在 5 行以内，列名直接服务读者决策 |

推荐组合：

| `content_profile` | palette 倾向 | layout 倾向 | component_variant 建议 |
| --- | --- | --- | --- |
| `tech_deep_dive` | P1 / P6 / P8 | L1 / L2 | h2=giant-numeral, h3=bottom-line, table=zebra-light, accent=full-frame, intro=gray-bar |
| `business_narrative` | P3 / P7 / P5 | L1 / L4 | h2=divider-double, h3=bracket-prefix, table=zebra-light, accent=quote-block, intro=bordered-card |
| `product_experience` | P4 / P1 / P7 | L2 / L1 | h2=left-bar, h3=dotted-prefix, table=card-rows, accent=ribbon-tag, intro=bordered-card |
| `developer_ecosystem` | P4 / P1 / P7 | L1 / L2 | h2=left-bar, h3=dotted-prefix, table=card-rows, accent=full-frame, intro=bordered-card |
| `fast_take` | P7 / P3 / P1 | L1 | h2=left-bar, h3=dotted-prefix, table=minimal-bottom, accent=icon-less-bar, intro=gray-bar |
| `personal_practice`（仅技术层面，需 Step 3.1 用户确认） | P5 / P3 / P7 | L2 / L4 | h2=giant-numeral, h3=bracket-prefix, table=zebra-light, accent=full-frame, intro=giant-quote |
| `retrospective`（仅技术层面，需 Step 3.1 用户确认） | P2 / P6 / P1 | L1 / L4 | h2=divider-double, h3=small-caps, table=zebra-light, accent=timeline-card, intro=meta-line |

### `viral_readable` 拼装规则

- 主标题后先放“先说结论”卡片；如果还需要故事钩子，再用正文段落承接，不要把两者揉成一大段。
- 正文段落优先使用 80-120 字短段；同一段最多一个加粗点。
- 每个 h2 标题要带信息量，例如“二、真正变化不是画质，而是创作链路变短了”，不要写“二、产品体验”。
- “这和你有什么关系”“谁受益/谁受冲击”“该不该行动”优先用强调块或短表呈现。
- 决策矩阵最多 5 行、4 列；超过 5 行放到“延伸阅读”。
- 技术深度文可以保留硬核段，但必须把大表、公式、复现细节放进浅灰强调块或“延伸阅读”。

---

## 文件骨架（Section A/B/C/E 选完后拼装）

```html
<!--
  使用方法：双击此文件用浏览器打开 → Ctrl+A 全选 → Ctrl+C →
  进入公众号后台图文编辑器 → Ctrl+V 粘贴，样式保留
  本篇视觉语言：content_profile={...} / readability_mode={viral_readable} / palette={P?} / layout={L?} / component={...}
-->
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>{文章标题}</title></head>
<body style="margin:0; padding:24px 0; background:#f4f5f7;">

<section style="max-width:677px; margin:0 auto; padding:{outer-padding}; background:#ffffff; font-family:{font-stack}; font-size:{body-size}; line-height:1.85; color:{text}; word-break:break-word;">

<!-- 1. 主标题 h1 -->
<h1 style="margin:0 0 12px 0; padding:0; font-size:{h1-size}; font-weight:700; line-height:1.4; color:{text}; text-align:center;">{主标题}</h1>

<!-- 2. 先说结论 / 引导块（选 C.5 中一个变体，viral_readable 默认放 3-5 条关键判断） -->

<!-- 3. 备选标题区 + 章节（h2 用 C.1、h3 用 C.2） -->

<!-- 4. 正文段落：<p style="margin:{para-gap}; line-height:1.85;">...</p> -->

<!-- 5. 强调加粗：<strong style="color:{primary};">...</strong>（警示用 {warn}，正向用 {ok}） -->

<!-- 6. 列表：
  <ul style="margin:{para-gap}; padding-left:24px;">
    <li style="margin-bottom:8px; line-height:1.85;"><strong style="color:{primary};">{要点}</strong>：{描述}</li>
  </ul>
-->

<!-- 7. 表格（选 C.3 中一个变体） -->

<!-- 8. 强调块（选 C.4 中一个变体） -->

<!-- 9. 分隔线：<hr style="border:none; border-top:1px dashed {divider}; margin:32px auto; width:60%;"> -->

<!-- 10. 结尾金句：<p style="margin:24px 0 16px 0; line-height:1.85; text-align:center; font-size:{h3-size}; font-weight:700; color:{primary};">{金句}</p> -->

<!-- 11. 参考资料：
  <ul style="margin:{para-gap}; padding-left:24px;">
    <li style="margin-bottom:8px; line-height:1.85;">{来源}：<a href="{URL}" style="color:{primary}; text-decoration:none;">{标题}</a></li>
  </ul>
-->

<!-- 12. 免责声明（斜体灰字块）：
  <section style="margin:24px 0 0 0; padding:14px 16px; background:{bg-soft}; border-left:3px solid {muted}; border-radius:{radius};">
    <p style="margin:0; font-size:{caption-size}; color:{muted}; line-height:1.75; font-style:italic;">{免责}</p>
  </section>
-->

<!-- 13. END：<p style="margin:32px 0 0 0; text-align:center; font-size:{caption-size}; color:{muted};">— END —</p> -->

</section>
</body>
</html>
```

---

## 拼装检查清单（Step 5.2 完成后逐条自查）

- [ ] 本篇使用的 `content_profile` / `readability_mode` / `palette_id` / `layout_id` / `component_variant` 写在了文件顶部 HTML 注释
- [ ] 所有 `style` 属性使用双引号，内部用单引号
- [ ] 所有颜色用十六进制具体值（不是 `{primary}` 等占位符，也不是 `rgb()` / CSS 变量）
- [ ] 表格每个 `<td>` 都单独写完整 style
- [ ] 链接 `<a>` 加 `text-decoration:none`
- [ ] 没有 `<style>` 块、`<script>`、`<link>`、`class`、`id` 选择器
- [ ] 没有外链图片
- [ ] 段落间距统一使用本篇 layout 的 `para-gap`
- [ ] 强调色统一使用本篇 palette 的 `primary` / `warn` / `ok`，不混用多套
- [ ] 备选标题 5 条覆盖 5 类（吸睛实证 / 数据冲击 / 专业判断 / 特性罗列 / 决策导向）

---

## 常见踩坑

**坑 1：粘贴后表格塌陷**
原因：`<td>` 没写独立样式，依赖了 `<table>` 上的 class。解决：每个 `<td>` 都内联。

**坑 2：加粗色全部变黑**
原因：`<strong>` 没加 `style="color:..."`。解决：所有强调都写完整内联颜色。

**坑 3：段落间距消失**
原因：公众号把 `<p>` 重置为默认样式。解决：`<p>` 内联 `margin:16-20px 0`，并确保上下空行。

**坑 4：列表项变成实心圆点且挤压**
原因：`<ul>` 没设 padding，`<li>` 没设 margin。解决：`<ul style="padding-left:24px">` + `<li style="margin-bottom:8px">`。

**坑 5：L3/L4 切换字体栈后公众号没认**
原因：公众号对衬线字体支持有限。解决：衬线 fallback 要写全 `Georgia,'Times New Roman','Songti SC','STSong',serif`，让公众号在各平台都能降级。

**坑 6：color-block（色块底白字）在 L1 / L3 下显得过于张扬**
原因：紧凑和极简排版配大面积色底不协调。解决：遵守 C.6 搭配建议表，P5/P8 配 color-block 属于灾难组合。
