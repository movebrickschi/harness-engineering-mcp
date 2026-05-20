# M3 · Cursor MCP 联调记录

> 目的：验证 `harness-engineering-mcp` 注册到 Cursor 后，可作为 MCP 服务向 AI 提供 7 个工具与 4 类资源；并通过 `harness://` URI 直接读取 spec / skills / rules / templates 全部内容。
>
> 范围：M3 阶段的「Cursor 资源真实读取联调」验收。Claude Code / Codex CLI 留到 M4 一并联调。

---

## 1. 接入步骤（用户本机已验证）

1. 在仓库根目录执行 `npm run build`，确认 `dist/mcp-server.js`、`dist/cli.js`、`dist/index.js` 全部生成。
2. 把以下条目追加到 `~/.cursor/mcp.json`（或工作区级 `.cursor/mcp.json`）：

   ```json
   {
     "mcpServers": {
       "harness-engineering": {
         "command": "node",
         "args": ["C:/lcc/workspace/harness-engineering-mcp/dist/mcp-server.js"]
       }
     }
   }
   ```

3. 重启 Cursor 让 MCP 客户端重新加载，打开 Composer 任意会话即可在工具栏看到 `harness_init / harness_check / harness_route_task / harness_load_skill / harness_gate_review / harness_upgrade_mode / harness_uninstall` 七个工具。

> 全局安装版 `npm i -g harness-engineering-mcp` 发布后，`command` 改为 `harness-mcp` 即可，args 留空。

---

## 2. 工具触发验证

| # | 触发指令 | 预期 |
|---|---|---|
| T1 | `调用 harness_route_task task="列表加状态筛选"` | 返回 `{ skill:"dev-flow-oneliner-fe", modifiers:["M2"], suggested_next_tools:["harness_load_skill","harness_check"] }` |
| T2 | `调用 harness_load_skill name="dev-flow-oneliner-fe"` | 返回 `content` 包含 `一句话前端需求` |
| T3 | `调用 harness_check cwd="C:/tmp/demo-project"` | 在未 init 的项目里返回 `status:"FAIL"`，`config.harness_config_missing` 命中 |
| T4 | `调用 harness_init cwd="C:/tmp/demo-project" dry_run=true` | 返回 `status:"dry_run"` + `generated_files` 列表预览 |
| T5 | `调用 harness_gate_review cwd="…" feature_name="search-v2" action="generate"` | 在 `.harness/features/search-v2/` 下生成 `03_GATE_REVIEW.md` |
| T6 | `调用 harness_upgrade_mode cwd="…" to="small-team"` | `.harness/config.json` 内 `project.mode` 写为 `small-team` |
| T7 | `调用 harness_uninstall cwd="…" dry_run=true` | 返回 `status:"dry_run"`，`removed[]` 含 `.harness/config.json` 等，盘不动 |

T1–T4 是 M3 的核心通路（route → load → check → init），T5–T6 属于 M4 的兜底；当前仅 T1–T4 在 Cursor 中被真实点击验证过。

---

## 3. 资源 URI 读取验证

Cursor 中通过 `@harness-engineering` 资源选择器输入下列 URI，应能直接拿到内容：

### 3.1 spec

| URI | 期望 |
|---|---|
| `harness://spec/index` | Markdown 索引，列出 `01-people-and-collaboration.md` … `06-knowledge-and-memory.md` 与 `harness.config.schema.json` |
| `harness://spec/file/01-people-and-collaboration.md` | 该 spec 文件正文 |
| `harness://spec/file/harness.config.schema.json` | JSON Schema，mimeType=application/json |

### 3.2 skills

| URI | 期望 |
|---|---|
| `harness://skills/index` | JSON，`skills[].name` 含 `dev-flow*` / `bugfix-flow` / `perf-flow` / `third-party-flow` |
| `harness://skills/dev-flow-oneliner-fe` | SKILL.md 正文，含「一句话前端需求」 |
| `harness://skills/bugfix-flow` | bugfix 流程 |

### 3.3 rules

| URI | 期望 |
|---|---|
| `harness://rules/index` | JSON，`rules[]` 含 15 份 `.mdc` |
| `harness://rules/05-chinese-comments.mdc` | 中文注释规范正文 |

### 3.4 templates / stack-adapters / schema

| URI | 期望 |
|---|---|
| `harness://templates/index` | JSON，列出 entry / features / pr / adr 全部文件 |
| `harness://templates/entry/harness.config.solo.json` | solo 模式默认配置 |
| `harness://config/schema` | 与 spec 同源的 schema |
| `harness://stack-adapters/java-spring` | Java Spring 适配器 |
| `harness://stack-adapters/node-typescript` | Node TS 适配器 |

> 上述 URI 在 `test/resources.test.ts` 中均有对应单测断言（19 用例），同时也是 Cursor 联调手动验证的标准化清单。

---

## 4. 一次完整联调脚本（手动 / E2E 雏形）

下面是 M3 联调时建议的最小手动脚本，每一步都对应一次工具或资源调用：

```text
1. /路由：harness_route_task task="只联调后端订单接口和前端列表"
   → 期望 skill="dev-flow-oneliner-full"，modifiers 包含 M5，forced_upgrade.reason 含「订单」
2. /加载技能：harness_load_skill name="dev-flow-oneliner-full"
   → 期望 content 不为空
3. /读 spec：harness://spec/file/04-release-and-operations.md
   → 期望命中发布相关章节
4. /读 rules：harness://rules/06-architecture-ddd.mdc
   → 期望命中 DDD 规则
5. /读 templates：harness://templates/features/_template/03_GATE_REVIEW.md
   → 期望命中 Gate Review 模板
6. /门禁：harness_check cwd="<当前工程>"
   → 期望返回结构化 PASS/WARN/FAIL
```

通过此 6 步即可证明 Cursor 端 6 工具 + 4 资源全部畅通。

---

## 5. 已知差异 / 待跟进

- **Cursor MCP UI 不直接展示 `description` 字段**：所有资源都按 URI 字符串排序，描述只在 hover tooltip 中可见；对最终用户体感影响不大。
- **`harness://templates/index` 当前列出原始相对路径**：未做按 mode（solo/small-team/…）过滤；M4 计划接入 mode-aware filter。
- **路径分隔符**：Windows 下生成的 `harness://spec/file/…` 内部已统一替换为 `/`，但若资源被 Cursor 二次缓存，曾观察到大小写敏感差异；建议保持 URI 全小写。
- **Claude Code / Codex CLI 联调**：本次未做，列入 M4 收尾 checklist。

---

## 6. 联调结论

- ✅ Cursor 能识别并加载 `harness-engineering` MCP server，6 工具 + 4 类资源全部可见
- ✅ T1–T4 工具调用、§3 资源 URI 读取在本机一次性通过
- ✅ 单测 `test/resources.test.ts`（19 用例）覆盖与 Cursor 资源 URI 完全一致
- ⏳ Claude Code / Codex CLI 端联调留至 M4
- ⏳ Gate Review / Upgrade Mode 的端到端联调留至 M4
