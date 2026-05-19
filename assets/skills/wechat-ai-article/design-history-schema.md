# Design History Schema

`~/wechat-articles/.design-history.json` 是本 skill 跨文章去重的唯一状态文件。Step 4.5 读它决定禁用名单，Step 5.4 往里追加本篇记录。文件不存在就当空历史处理（Step 5.4 会自动初始化）。

对应 Windows 路径：`C:\Users\Administrator\wechat-articles\.design-history.json`

---

## 文件结构（当前版本 v3）

```json
{
  "version": 3,
  "entries": [
    {
      "date": "2026-04-23",
      "slug": "claude-opus-4-7-launch",
      "news_type": "flagship_release",
      "palette_id": "P1",
      "layout_id": "L2",
      "component_variant": {
        "h2": "giant-numeral",
        "h3": "bottom-line",
        "table": "card-rows",
        "accent": "ribbon-tag",
        "intro": "giant-quote"
      },
      "archetype_id": "A02",
      "canvas_philosophy": "Vertical Gravity"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `version` | int | 当前固定 `3`。v1 无 `lineage_id` / `archetype_id`；v2 有 `lineage_id`；v3 把 `lineage_id` 替换为 `archetype_id` |
| `entries` | array | 按时间升序（旧→新），最多保留 30 条，新记录 append 到末尾 |
| `entries[].date` | string | `YYYY-MM-DD` |
| `entries[].slug` | string | 文章 slug，如 `gpt-5-5-launch` |
| `entries[].news_type` | string | 见 SKILL.md Step 3，四选一 |
| `entries[].palette_id` | string | `P1`-`P8` |
| `entries[].layout_id` | string | `L1`-`L4` |
| `entries[].component_variant` | object | 5 个键：h2 / h3 / table / accent / intro，值来自 style-template.md Section C |
| `entries[].archetype_id` | string | `A01`-`A06`，本篇封面采用的 archetype（见 cover-template.md） |
| `entries[].canvas_philosophy` | string | 本篇起的设计哲学短语，如 `Vertical Gravity`（仅档案标签，不影响生成） |
| `entries[].lineage_id` | string (deprecated) | v2 遗留字段，v3 写入时**不再包含**；读入时若存在视为历史信息，不参与避重 |

---

## 读写时机

| 时机 | 操作 |
| --- | --- |
| Step 4.5 开始 | 读文件 → 取最近 N 条 → 得到禁用名单（含 `archetype_id`） |
| Step 5.3.1 | 再次确认 3 张候选对应的 `archetype_id` 各不相同且不在最近 5 条历史里 |
| Step 5.4 | 把本篇**冠军候选**的视觉语言卡 append 到 `entries`，超过 30 条时从头部删除 |

---

## 避重规则（Step 4.5 使用）

```
禁用 palette_id        = 最近 3 条 entries 的 palette_id（去重）
禁用 layout_id         = 最近 2 条 entries 的 layout_id（去重）
禁用 archetype_id      = 最近 5 条 entries 的 archetype_id（去重）
禁用 canvas_philosophy = 最近 5 条 entries 的 canvas_philosophy（大小写不敏感去重）
```

其余字段（component_variant / news_type / slug / lineage_id）不参与去重，可以重复。

`lineage_id` 作为 v2 遗留字段被读入时忽略，不转换为 archetype_id（两套编号体系不一一对应，强行映射反而容易误伤）。

### 示例：连续 6 篇文章的 archetype 选择

假设 Step 4.5 读到的最近 5 条 entries 的 archetype 依次是：

```
[..., A03, A02, A05, A01, A04]
```

那么 `banned_archetypes = {A01, A02, A03, A04, A05}`，剩余可选 = `{A06}`。

如果当前 `news_type = flagship_release`，cover-template.md 给的优先序列是 `A02 → A01 → A04 → A06 → A03 → A05`：
- 前 3 个全在 banned 里，跳过
- 第 4 个 `A06` 不在 banned，选定 `archetype_id = A06`

**三张候选**：需要 3 个不同 archetype，但 candidates 只剩 1 个时：
- 先取 `A06` 做候选 1
- 候选 2 / 候选 3 在 A06 archetype 内走不同 material_variant（V2 / V3）
- 即 3 张候选全部都是 A06，但视觉素材各异

如果 candidates ≥ 3（正常情况），取前 3 个 archetype 分别做候选。

### 执行伪代码

```
history = read_json("~/wechat-articles/.design-history.json")
if history is None or history.entries is empty:
    banned_palettes = banned_layouts = banned_archetypes = banned_philosophies = []
else:
    banned_palettes     = unique([e.palette_id for e in history.entries[-3:]])
    banned_layouts      = unique([e.layout_id for e in history.entries[-2:]])
    banned_archetypes   = unique([e.archetype_id for e in history.entries[-5:] if e.archetype_id])
    banned_philosophies = unique_ci([e.canvas_philosophy for e in history.entries[-5:]])

palette_pool   = PRIORITY_POOL[news_type].palettes
layout_pool    = PRIORITY_POOL[news_type].layouts
archetype_pool = ARCHETYPE_PRIORITY[news_type]   # 见 cover-template.md 末尾

palette_candidates   = [p for p in palette_pool   if p not in banned_palettes]   or \
                       [p for p in ALL_PALETTES   if p not in banned_palettes]
layout_candidates    = [l for l in layout_pool    if l not in banned_layouts]    or \
                       [l for l in ALL_LAYOUTS    if l not in banned_layouts]
archetype_candidates = [a for a in archetype_pool if a not in banned_archetypes] or \
                       [a for a in ALL_ARCHETYPES if a not in banned_archetypes]

chosen_palette       = palette_candidates[0]
chosen_layout        = layout_candidates[0]
chosen_archetype     = archetype_candidates[0]   # 冠军候选的 archetype

# 3 张候选
if len(archetype_candidates) >= 3:
    candidate_archetypes = archetype_candidates[:3]
else:
    # 不足 3 个就在同一 archetype 内走 3 个不同 material_variant
    candidate_archetypes = [archetype_candidates[0]] * 3
```

---

## 写入示例（Step 5.4）

只写入**冠军候选**的 archetype_id，不记录 3 张候选的全部：

```
entry = {
  "date": today(),
  "slug": article_slug,
  "news_type": chosen_news_type,
  "palette_id": chosen_palette,
  "layout_id": chosen_layout,
  "component_variant": chosen_component_variant,
  "archetype_id": winner_archetype,     # rubric 选出的那张
  "canvas_philosophy": philosophy_label
}

if file not exists:
    history = { "version": 3, "entries": [] }
else:
    history = read_json(file)
    if history.version in (1, 2):
        history.version = 3   # 自动升级；老条目 lineage_id 保留但不读

history.entries.append(entry)

# 最多保留最近 30 条
if len(history.entries) > 30:
    history.entries = history.entries[-30:]

write_json(file, history)
```

---

## 版本迁移规则

| 读入版本 | 处理 |
| --- | --- |
| `version: 1` | 老条目缺 `lineage_id` / `archetype_id`，跳过 archetype 避重（banned_archetypes = []），palette/layout 避重仍生效 |
| `version: 2` | 老条目有 `lineage_id` 但无 `archetype_id`，两者不跨版本映射，banned_archetypes = [] |
| `version: 3` | 读 `archetype_id` 做 banned_archetypes |
| `version: >=4` | 当前 skill 版本不支持，按空历史处理并提醒用户升级 skill |

**升级时机**：首次追加 v3 新条目时，把 `version` 原位改成 `3`，老条目保持不动。

---

## 首次运行自动初始化

`~/wechat-articles/.design-history.json` 不存在时，**Step 5.4 直接以下面这个空结构创建文件**：

```json
{ "version": 3, "entries": [] }
```

如果 `~/wechat-articles/` 目录本身也不存在，先用 PowerShell 创建：

```powershell
$histDir = "$env:USERPROFILE\wechat-articles"
if (-not (Test-Path $histDir)) {
  New-Item -ItemType Directory -Path $histDir -Force | Out-Null
}

$historyFile = Join-Path $histDir ".design-history.json"
if (-not (Test-Path $historyFile)) {
  '{ "version": 3, "entries": [] }' | Set-Content $historyFile -Encoding UTF8
}
```

Step 4.5 读文件时若发现不存在，**不报错**，直接以空历史进入避重流程（所有禁用名单都为空）。

---

## PowerShell 操作示例

**读取历史（PowerShell 片段）**：

```powershell
$historyFile = "$env:USERPROFILE\wechat-articles\.design-history.json"
if (Test-Path $historyFile) {
  $history = Get-Content $historyFile -Raw | ConvertFrom-Json
  $recent = $history.entries | Select-Object -Last 5
  $bannedPhilosophies = $recent | ForEach-Object { $_.canvas_philosophy }
  $bannedArchetypes   = $recent | ForEach-Object { $_.archetype_id } | Where-Object { $_ }
} else {
  $bannedPhilosophies = @()
  $bannedArchetypes   = @()
}
```

**追加新记录（建议用 Python 做，PowerShell 处理嵌套对象容易丢字段）**：

```powershell
python -c "
import json, os, datetime
p = os.path.expanduser('~/wechat-articles/.design-history.json')
os.makedirs(os.path.dirname(p), exist_ok=True)
try:
    hist = json.load(open(p, encoding='utf-8'))
except (FileNotFoundError, json.JSONDecodeError):
    hist = {'version': 3, 'entries': []}
if hist.get('version', 1) in (1, 2):
    hist['version'] = 3
hist['entries'].append({
    'date': datetime.date.today().isoformat(),
    'slug': 'claude-opus-4-7-launch',
    'news_type': 'flagship_release',
    'palette_id': 'P1',
    'layout_id': 'L2',
    'component_variant': {'h2':'giant-numeral','h3':'bottom-line','table':'card-rows','accent':'ribbon-tag','intro':'giant-quote'},
    'archetype_id': 'A02',
    'canvas_philosophy': 'Vertical Gravity',
})
hist['entries'] = hist['entries'][-30:]
json.dump(hist, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
"
```

---

## 错误恢复

| 故障 | 处理 |
| --- | --- |
| 文件不存在 | 当作空历史，Step 5.4 时按本文「首次运行自动初始化」创建 |
| 文件存在但 JSON 损坏 | 备份为 `.design-history.json.bak-{时间戳}`，重建为空历史，提醒用户 |
| `version` 字段是 1 | 兼容读取（仅 palette/layout 避重生效，老条目不参与 archetype 避重），写入时升级为 3 |
| `version` 字段是 2 | 同上，`lineage_id` 读入时忽略，不映射为 archetype_id |
| `version` 字段 ≥ 4 | 当前 skill 版本不支持，按空历史处理并提醒用户升级 skill |
| `entries` 不是数组 | 按空历史处理 |
| 某条 `entries[i].archetype_id` 缺失 | 视为无该字段，不参与 archetype 避重（兼容老历史） |

绝不因历史文件问题阻塞文章生成流程。历史是避重优化项，不是生成必需项。

---

## 用户级操作

| 需求 | 操作 |
| --- | --- |
| 强制下一篇用某 palette / archetype | 手动覆盖 Step 4.5 的视觉语言卡输出，避重是默认行为可绕过 |
| 清空历史重来 | 删除 `~/wechat-articles/.design-history.json` |
| 查看最近用过哪些风格 | 打开该 JSON 文件查看 `entries` 末尾几条 |
| 归档某个月的历史 | 把 `.design-history.json` 改名为 `.design-history-2026-04.json`，下一次运行会自动重建 |
