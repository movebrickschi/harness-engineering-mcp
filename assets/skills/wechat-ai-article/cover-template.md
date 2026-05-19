# Cover Image — Archetype Library

Step 5.3 的封面生成采用「**GenerateImage 做视觉素材 + PIL 做完整构图 + 中文主标题烘入**」三件套。10 个 lineage 已被 6 个 archetype 取代：

- 每个 archetype 是一套**完整的版式编排器**（背景 / hero 粘贴策略 / 渐变遮罩 / 色板 / 中文标题位置），由 [cover_archetypes.py](cover_archetypes.py) 实现
- GenerateImage 只负责出「视觉素材」——无构图约束，允许画面做满
- 中文主标题、英文角标、品牌短标全部由 PIL 精确绘制

---

## 硬约束（不可协商）

| 维度 | 要求 |
| --- | --- |
| 最终尺寸 | 严格 2350×1000（2.35:1） |
| 中间产物 | `hero_raw.png`（GenerateImage 原始输出，画面可做满） |
| 文字 | `hero_raw` 里**完全零文字**；中文主标题 + 英文角标全部由后处理脚本绘制 |
| 禁止元素 | 真实人脸、真实公司 logo、emoji、3D 渲染、霓虹光效、电路板纹、紫蓝科技渐变、中心发光球、AI 伪造字形 |
| 视觉方向 | 杂志级精修、museum-grade craftsmanship、不套「AI 科技海报」俗套 |

---

## 6 个 Archetype

每个 archetype 包含 4 个要素：
- `material_recipe`：喂给 GenerateImage 的 prompt 模板（**只描述视觉素材**，不提留白、不提文字、不控构图）
- `material_variants`：3 组变体填空，用于同一篇文章一次出 3 张候选
- `composition_recipe`：PIL 层的合成参数（渐变遮罩 / 色板 / 中文标题位置等）
- `palette_suggestion`：推荐配色（primary / accent / panel_color）

---

### A01 · Cinematic Hero

**气质**：电影级单主体特写，底部渐变暗幕托起中文主标题。

**material_recipe**：

```
A single studio-lit close-up photograph of {OBJECT}, shot with 85mm lens,
soft directional lighting from upper left, {MOOD_PALETTE} color grading,
shallow depth of field, film grain, in the style of {ART_REFERENCE}.
Ultra-wide 2.35:1 cinematic banner composition. Rich tonal range,
photographic realism, editorial magazine quality.
```

**material_variants**（按 news_type 填空，3 组）：

| variant | OBJECT | MOOD_PALETTE | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | a single obsidian black monolithic object resting on dark slate | moody cinematic teal and amber | Roger Deakins cinematography, Blade Runner 2049 |
| V2 | a polished brass cylinder partially submerged in water | warm dusk orange and deep blue | Wong Kar-wai cinematography, In the Mood for Love |
| V3 | a folded heavy linen cloth catching raking side light | cool overcast desaturated palette | Gregory Crewdson photographic tableau |

**composition_recipe**（PIL 层，写入 `cover_text.json`）：

```json
{
  "archetype": "A01",
  "palette": { "primary": "#0f172a", "accent": "#f6f2e8", "panel_color": "#c0241d" },
  "veil": { "enabled": true, "direction": "bottom", "from": "#00000000", "to": "#000000d0", "start_ratio": 0.42 },
  "headline_cn": { "text": "…", "max_size": 150, "min_size": 84, "color": "#f6f2e8", "shadow": "#00000088", "align": "left", "rect": { "x": 120, "y": 660, "w": 2110, "h": 280 } },
  "canvas": { "noise": 0.025, "vignette": 0.12 }
}
```

---

### A02 · Editorial Split

**气质**：编辑部风格左右分栏，左 38% 纯色板承载中文大标题，右 62% 展示 hero 素材。

**material_recipe**：

```
A minimal editorial still-life photograph of {OBJECT}, {MOOD_PALETTE}
color grading, shot at 50mm, clean composition with the subject placed
slightly right-of-center so the image carries well when cropped to a
vertical 1450×1000 panel. In the style of {ART_REFERENCE}. Photographic
realism, gallery-grade lighting.
```

> 注意：这里素材图会被裁到右 62%（约 1450×1000），所以主体置于右侧略偏中效果最好。

**material_variants**：

| variant | OBJECT | MOOD_PALETTE | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | a single ceramic sphere on a marble surface | warm neutral sand and cream | Kinfolk magazine still life |
| V2 | a precise cross-section of geometric stacked rings | cool slate and off-white | Apple product photography, Wired feature opener |
| V3 | a close-up of hand-bound leather book spines | rich oxblood and parchment cream | Aperture magazine editorial |

**composition_recipe**：

```json
{
  "archetype": "A02",
  "palette": { "primary": "#1c2e83", "accent": "#f6f2e8", "panel_color": "#1c2e83" },
  "headline_cn": { "text": "…", "max_size": 130, "min_size": 72, "color": "#f6f2e8", "align": "left", "rect": { "x": 90, "y": 320, "w": 713, "h": 460 } },
  "canvas": { "noise": 0.0, "vignette": 0.0 }
}
```

---

### A03 · Duotone Pressure

**气质**：全幅图经 duotone 滤镜压成两色调，中文标题居中偏下带投影。

**material_recipe**：

```
A high-contrast black and white photograph of {OBJECT}, strong directional
single light source, deep shadows and crisp highlights, {MOOD_ADJECTIVES},
in the style of {ART_REFERENCE}. Ultra-wide 2.35:1 composition. Treat the
image as if it will be printed in a single accent color — maximize tonal
range.
```

> 素材出黑白高反差后由 PIL 做两色映射，任何彩色都会被覆盖。

**material_variants**：

| variant | OBJECT | MOOD_ADJECTIVES | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | a lone architectural concrete structure at dusk | brutal, monumental, geometric | Hiroshi Sugimoto architecture series |
| V2 | a stormy cloud formation over a coastline | dramatic, weathered, elemental | Sebastião Salgado landscape photography |
| V3 | a tangle of industrial steel cables | mechanical, tense, tactile | Lewis Baltz industrial landscape |

**composition_recipe**：

```json
{
  "archetype": "A03",
  "palette": { "primary": "#1a1a1a", "accent": "#ffb84d" },
  "duotone": { "shadow": "#1a1a1a", "highlight": "#ffb84d" },
  "veil": { "enabled": true, "direction": "bottom", "from": "#00000000", "to": "#00000066", "start_ratio": 0.3 },
  "headline_cn": { "text": "…", "max_size": 140, "min_size": 80, "color": "#ffb84d", "shadow": "#00000099", "align": "center", "rect": { "x": 180, "y": 540, "w": 1990, "h": 360 } },
  "canvas": { "noise": 0.035, "vignette": 0.2 }
}
```

> duotone 的 shadow / highlight 由 palette 派生。常用对：深色+奶白、深蓝+砖红、墨黑+芥黄。

---

### A04 · Data Monolith

**气质**：纯色底 + 低透明度 hero 作为背景纹理，上下两条细线夹出「数据展板」感，中文标题放左列。

**material_recipe**：

```
An abstract geometric texture of {TEXTURE_SUBJECT}, {MOOD_PALETTE} palette,
flat graphic composition without realistic perspective, in the style of
{ART_REFERENCE}. Ultra-wide 2.35:1. Keep the composition evenly distributed
across the canvas so it reads well as a subtle background texture.
```

**material_variants**：

| variant | TEXTURE_SUBJECT | MOOD_PALETTE | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | stacked contour lines resembling a topographic map | midnight blue and cream | Josef Albers color studies, Massimo Vignelli Unimark |
| V2 | a grid of isometric geometric primitives | oxblood and warm cream | Bauhaus Herbert Bayer poster |
| V3 | overlapping translucent plane compositions | forest green and pale gold | Paul Rand IBM annual report |

**composition_recipe**：

```json
{
  "archetype": "A04",
  "palette": { "primary": "#0f172a", "accent": "#f6f2e8" },
  "headline_cn": { "text": "…", "max_size": 150, "min_size": 84, "color": "#f6f2e8", "align": "left", "rect": { "x": 140, "y": 360, "w": 1200, "h": 360 } },
  "canvas": { "noise": 0.0, "vignette": 0.0 }
}
```

> A04 适合带核心数字的选题（如「+11pt」「87.6%」）。把数字通过 `texts` 数组放右列会形成强数据感。

---

### A05 · Type Sculpture

**气质**：hero 图经重染做成纹理底，中文主标题放大到雕塑级尺寸（200-240px）占据画面主体。

**material_recipe**：

```
A moody atmospheric texture of {TEXTURE_SUBJECT}, {MOOD_PALETTE}, dramatic
low-key lighting, soft focus, in the style of {ART_REFERENCE}. Ultra-wide
2.35:1. The image will be used as a tinted backdrop behind large typography,
so lean into tonal depth and avoid hard focal points.
```

**material_variants**：

| variant | TEXTURE_SUBJECT | MOOD_PALETTE | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | fog rolling over dark mountains | inky blue-black gradient | Hiroshi Sugimoto seascape |
| V2 | a weathered copper metal plate | patinated green and bronze | Richard Serra sculpture surface |
| V3 | deep ink washed across rough paper | ink-black bleeding into cream | Chinese shanshui ink wash |

**composition_recipe**：

```json
{
  "archetype": "A05",
  "palette": { "primary": "#1a1a1a", "accent": "#f6f2e8" },
  "headline_cn": { "text": "…", "max_size": 240, "min_size": 140, "line_height": 1.0, "color": "#f6f2e8", "align": "left", "rect": { "x": 120, "y": 120, "w": 2110, "h": 760 } },
  "canvas": { "noise": 0.03, "vignette": 0.18 }
}
```

> A05 建议中文主标题 ≤ 10 字，最好 6-8 字，才能真正达到雕塑感。

---

### A06 · Magazine Index

**气质**：奶白底 + 左侧 720×720 画框（hero 嵌入）+ 中线细分隔 + 右侧中文标题层叠。

**material_recipe**：

```
A single refined object — {OBJECT} — photographed against a neutral warm
background, studio top-down or three-quarter view, in the style of
{ART_REFERENCE}, {MOOD_PALETTE}. Composition should crop cleanly to a
square 720×720 region. Magazine-quality editorial still life.
```

**material_variants**：

| variant | OBJECT | MOOD_PALETTE | ART_REFERENCE |
| --- | --- | --- | --- |
| V1 | a single precise mechanical wristwatch movement | warm brass and cream | Hodinkee watch photography |
| V2 | a folded origami paper sculpture | pale blue-grey on cream | Minimalist Japanese product editorial |
| V3 | a single shard of polished marble | warm stone and shadow | Apple 2010s product launch photography |

**composition_recipe**：

```json
{
  "archetype": "A06",
  "palette": { "primary": "#efe8d3", "accent": "#1a1a1a", "panel_color": "#efe8d3", "ink": "#1a1a1a" },
  "headline_cn": { "text": "…", "max_size": 120, "min_size": 64, "color": "#1a1a1a", "align": "left", "rect": { "x": 1000, "y": 260, "w": 1210, "h": 520 } },
  "canvas": { "border_px": 1, "border_color": "#1a1a1a", "noise": 0.015, "vignette": 0.0 }
}
```

> A06 适合「深度阅读」调性的选题（论文解读、长期观察、专题）。奶白底极限还原公众号阅读手感。

---

## 3 张候选生成策略

一篇文章出 3 张候选封面，不同 archetype + 不同 material variant，一次 PIL 合成，由 Agent 用鉴赏 rubric 自动选 1 落盘。

### 三段候选挑选规则

```
1. 读历史 → 得到 banned_archetypes（最近 5 条）
2. 按 news_type 优先序（见下表）去掉 banned，取前 3 个 archetype
   若剩余不足 3 个，同一 archetype 内走 3 个不同 material variant
3. 为每个候选分别：
   - 从 material_variants 里挑一组（尽量不同，保证多样）
   - 拼 material_recipe → GenerateImage → hero_raw_N.png
   - 拼 composition_recipe + 本篇 palette + 中文主标题 → cover_text_N.json
   - postprocess_cover.py → cover_candidate_N.png
4. Agent 按 rubric 打分，选最高分改名为 cover.png 落到根目录
```

### news_type → archetype 优先序列

| news_type | 优先序（高 → 低） | 简要理由 |
| --- | --- | --- |
| `flagship_release` | A02 → A01 → A04 → A06 → A03 → A05 | 旗舰发布需要权威克制，左右分栏和电影级特写最对味 |
| `paper_breakthrough` | A06 → A04 → A02 → A01 → A05 → A03 | 论文/突破重阅读深度，杂志索引 + 数据展板最合适 |
| `industry_event` | A01 → A03 → A05 → A02 → A04 → A06 | 大事件要头版感、新闻张力、戏剧性 |
| `rumor_funding` | A03 → A05 → A06 → A01 → A02 → A04 | 小道/融资要轻盈、信号感、不端着 |

---

## material_recipe 写作约束

1. **不提留白/负空间/无文字**——这些已经由 PIL 遮罩/裁切/分栏掩盖掉，提了只会让模型损失素材丰富度
2. **允许画面做满**——hero 可以做得像照片、插画、纹理都行，composer 会用 veil / 裁切 / duotone 做后期构图
3. **art_reference 必须具体**——不允许 "futuristic tech aesthetic" / "modern minimalist"
4. **禁止加「额外修饰」**——光晕 / 电路板 / 霓虹 / 3D / 粒子 / 发光球一律不加
5. **保留禁止元素清单**——每次 prompt 末尾追加：
   ```
   Avoid: AI-generated text artifacts, scribbled fake letterforms, real
   company logos, real human faces, emoji, watermarks, signatures,
   purple-blue tech gradients, central glowing orbs, hexagon overlays,
   circuit-board patterns, sci-fi HUD elements.
   ```

---

## 鉴赏 Rubric（Agent 自执行）

每张候选按 4 轴打分（0-3 分，满分 12）：

| 评审轴 | 3 分 | 2 分 | 1 分 | 0 分 |
| --- | --- | --- | --- | --- |
| 中文标题可读性 | 300px 缩略图仍清晰，对比度充足 | 可读但对比略弱 | 勉强可读 | 不可读 |
| 构图重心 | 主视觉 + 标题各司其位 | 略冲突但可接受 | 有冲突 | 完全乱 |
| archetype 辨识度 | 完全体现 archetype 气质 | 基本体现 | 有偏移 | 跑题 |
| 避免 AI 俗套 | 无紫蓝渐变/中心发光/电路板纹 | 轻微套路 | 明显套路 | 完全套路 |

- ≥ 9 分直选该张；
- 如果 3 张都 < 9，选最高分并在 `cover_judgement.md` 里标注「封面仅达可交付线，建议人工换图」。

鉴赏结果必写入 `cover_judgement.md`，格式：

```markdown
# Cover Judgement

| # | archetype | variant | 中文可读性 | 构图重心 | 辨识度 | 避俗套 | 总分 | 备注 |
| - | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A02 | V1 | 3 | 3 | 3 | 2 | 11 | … |
| 2 | A01 | V2 | 2 | 3 | 3 | 2 | 10 | … |
| 3 | A04 | V1 | 3 | 2 | 2 | 2 | 9  | … |

胜出：候选 1（A02/V1，11 分）

原因：中文主标题在奶白色 accent 上对比最强烈，左右分栏版式辨识度最高。
```

---

## 用户反馈迭代流程

封面生成后用户不满意时，**不要重抽 archetype 也不要重生整张 hero**。先定位维度：

| 用户反馈 | 调整位置 | 重做范围 |
| --- | --- | --- |
| 中文主标题字号/颜色/位置不对 | `cover_text.json` 的 `headline_cn` | 仅重跑 postprocess_cover.py |
| 英文角标不对 | `cover_text.json` 的 `texts` | 仅重跑 postprocess_cover.py |
| 遮罩太暗/太亮 | `cover_text.json` 的 `veil` | 仅重跑 postprocess_cover.py |
| 配色不对 | `cover_text.json` 的 `palette` + material_recipe 的 MOOD_PALETTE | 重跑 GenerateImage + postprocess |
| 主视觉主体不对 | material_recipe 的 OBJECT | 重跑 GenerateImage + postprocess |
| 整体调性不对 | 换 archetype（按避重规则挑下一候选） | 重跑 GenerateImage + postprocess |

每次只动一个维度，避免无法归因。

---

## 落盘要求

`~/wechat-articles/{YYYY-MM-DD}-{slug}/` 目录结构：

```
article.html
cover.png              ← 3 张候选中的冠军，由 rubric 选出
cover_text.json        ← 冠军候选对应的 postprocess 配置
cover_judgement.md     ← 3 张候选的打分记录
candidates/
  hero_raw_1.png       ← GenerateImage 原始输出 #1
  hero_raw_2.png
  hero_raw_3.png
  cover_candidate_1.png  ← PIL 合成后的候选 #1
  cover_candidate_2.png
  cover_candidate_3.png
  cover_text_1.json      ← 候选 #1 的 postprocess 配置
  cover_text_2.json
  cover_text_3.json
```

把最终采用的 `archetype_id` 写入 Step 5.4 的历史文件。

---

## 完整示例（Claude Opus 4.7 旗舰发布）

**视觉语言卡**（Step 4.5 输出）：

```json
{
  "palette_id": "P3",
  "layout_id": "L2",
  "component_variant": { "h2": "giant-numeral", "h3": "bottom-line", "table": "card-rows", "accent": "ribbon-tag", "intro": "giant-quote" },
  "archetype_id": "A02",
  "canvas_philosophy": "Vertical Gravity",
  "headline_cn": "重夺最强 LLM 王座",
  "brand_tag": "CLAUDE OPUS",
  "sub_tag": "BENCHMARK LEAP",
  "core_number": "+11 pt",
  "version_arrow": "4.6 → 4.7"
}
```

**候选 1（A02 + V1）material prompt**：

```
A minimal editorial still-life photograph of a single ceramic sphere on a marble surface,
warm neutral sand and cream color grading, shot at 50mm, clean composition with the
subject placed slightly right-of-center so the image carries well when cropped to a
vertical 1450×1000 panel. In the style of Kinfolk magazine still life. Photographic
realism, gallery-grade lighting.
Avoid: AI-generated text artifacts, scribbled fake letterforms, real company logos,
real human faces, emoji, watermarks, signatures, purple-blue tech gradients, central
glowing orbs, hexagon overlays, circuit-board patterns, sci-fi HUD elements.
```

**候选 1 对应 `cover_text_1.json`**：

```json
{
  "archetype": "A02",
  "palette": { "primary": "#1c2e83", "accent": "#f6f2e8", "panel_color": "#1c2e83" },
  "headline_cn": {
    "text": "重夺最强 LLM 王座",
    "font": "msyhbd.ttc",
    "max_size": 130, "min_size": 72,
    "color": "#f6f2e8", "align": "left",
    "rect": { "x": 90, "y": 320, "w": 713, "h": 460 }
  },
  "canvas": { "width": 2350, "height": 1000, "fit": "crop" },
  "texts": [
    { "text": "CLAUDE OPUS 4.7", "x": 90, "y": 140, "size": 34, "color": "#f6f2e8", "font": "arialbd.ttf", "tracking": 0.22, "anchor": "lt", "uppercase": true },
    { "text": "+11 pt", "x": 90, "y": 860, "size": 56, "color": "#f6f2e8", "font": "arialbd.ttf", "tracking": 0.04, "anchor": "lt" }
  ]
}
```

另外两个候选（比如 A01/V2 + A04/V1）各写一份独立的 `cover_text_2.json` / `cover_text_3.json`，headline_cn 保持相同，只变 archetype/palette/rect。

最后由 rubric 选出冠军，历史文件追加 `"archetype_id": "A02"`。
