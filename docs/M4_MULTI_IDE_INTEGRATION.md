# M4 · 多 IDE 联调与发布手册

> 范围：把 `harness-engineering-mcp` 同时挂到 Cursor / Claude Code / Codex CLI 三个 IDE 上，给每个 IDE 提供一份**最小可复现联调脚本**；并列出从 `v0.1.0` npm 发布到 release 验证的完整流程。
>
> 上一阶段 `docs/M3_CURSOR_INTEGRATION.md` 仅覆盖 Cursor 端，本文档把范围扩到三家。

---

## 1. MCP server 入口

构建产物：`dist/mcp-server.js`。三种启动方式（任选其一）：

```bash
# A) 推荐：不安装，npx 自动从 npm 拉取
#   ⚠️ 必须 `-p <pkg> <bin>` 分别写；包名 ≠ bin 名，不能写 `npx -y harness-engineering-mcp`
npx -y -p harness-engineering-mcp@latest harness-mcp

# B) 全局安装后用裸命令
npm i -g harness-engineering-mcp
harness-mcp

# C) 本地仓库源码调试
node dist/mcp-server.js
```

stdin / stdout 走 MCP JSON-RPC，3 个 IDE 都按此接入。

---

## 2. Cursor

参见 `docs/M3_CURSOR_INTEGRATION.md`。要点（npx 写法，零依赖）：

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "harness-engineering": {
      "command": "npx",
      "args": ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
    }
  }
}
```

已全局安装可简化为 `{"command": "harness-mcp"}`。工具与资源 URI 全部可见。

---

## 3. Claude Code

Claude Code 通过同样的 MCP JSON-RPC 协议挂载 MCP server。配置示例（npx 写法，零依赖）：

```json
// ~/.config/claude-code/mcp.json
{
  "mcpServers": {
    "harness-engineering": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
    }
  }
}
```

已全局安装可简化为 `"command": "harness-mcp"` 并删除 `args`。

> Windows 上若 PATH 中找不到 `harness-mcp`，优先用上面的 npx 写法；仍要走本地源码就把 `command` 改为 `node` 并 `args` 指向 `dist/mcp-server.js` 绝对路径。

### 3.1 联调脚本

```text
1. /init 一个临时项目
   harness_init {"cwd":"C:\\tmp\\claude-demo","mode":"solo","stack":"node-typescript","project_type":"library","project_name":"claude-demo"}
2. /路由
   harness_route_task {"task":"列表加状态筛选"}
3. /加载技能
   harness_load_skill {"name":"dev-flow-oneliner-fe"}
4. /门禁
   harness_check {"cwd":"C:\\tmp\\claude-demo","run_tests":true}
5. /Gate Review
   harness_gate_review {"cwd":"C:\\tmp\\claude-demo","feature_name":"search-v2","action":"generate"}
6. /Upgrade Mode
   harness_upgrade_mode {"cwd":"C:\\tmp\\claude-demo","to":"small-team"}
```

### 3.2 已知差异

- Claude Code 对 MCP 资源默认走 `resources/read`；多数版本会渲染 `application/json` 为代码块。`harness://config/schema` 因为是大 JSON，在 Claude Code 中会自动折叠。
- 工具调用时 Claude Code 会自动把对象参数 JSON.stringify，无需手工转义；但 Cursor 直接吃 JSON 对象——这两者输入路径都已覆盖。

---

## 4. Codex CLI

Codex CLI 通过本地 MCP server 协议运行。配置文件位置：

```toml
# ~/.codex/config.toml
# 推荐：npx 写法（零依赖）
[[mcp_servers]]
name = "harness-engineering"
command = "npx"
args = ["-y", "-p", "harness-engineering-mcp@latest", "harness-mcp"]
```

已全局安装：

```toml
[[mcp_servers]]
name = "harness-engineering"
command = "harness-mcp"
```

本地仓库源码联调：

```toml
[[mcp_servers]]
name = "harness-engineering"
command = "node"
args = ["C:/lcc/workspace/harness-engineering-mcp/dist/mcp-server.js"]
```

### 4.1 联调脚本

Codex CLI 风格的输入：

```text
> 请用 harness_route_task 帮我路由这句需求：「页面加载太慢，做性能优化」
> 接着调用 harness_load_skill name=perf-flow
> 然后运行 harness_check cwd=. run_tests=true
> 完成后运行 harness_gate_review cwd=. feature_name=perf-page-load action=generate
```

### 4.2 已知差异

- Codex CLI 的 MCP 实现对**资源 URI** 支持不如 Cursor 完整：spec/skills 索引可读，但模板与 stack-adapter 通常需要工具调用 `harness_load_skill` 间接获取，而不是直接通过 URI 拉取。本仓库已通过 7 个工具兜底了所有资源场景，因此即便 URI 通道有限制也不影响功能。
- `output_format=json` 输出在 Codex CLI 中比 markdown 渲染更稳；建议 CI 场景统一用 `--json`。

---

## 5. 三 IDE 兼容性矩阵

| 能力 | Cursor | Claude Code | Codex CLI |
|---|---|---|---|
| 7 个工具调用（含 `harness_uninstall`）| ✅ | ✅ | ✅ |
| `harness://spec/*` 资源直读 | ✅ | ✅ | ⚠ 部分支持 |
| `harness://skills/*` 资源直读 | ✅ | ✅ | ⚠ 通过工具替代 |
| `harness://config/schema` 资源直读 | ✅ | ✅ | ✅ |
| `--run-tests` 真实执行测试 | ✅ | ✅ | ✅ |
| Gate Review 生成与检查 | ✅ | ✅ | ✅ |
| Upgrade Mode 增量文件 | ✅ | ✅ | ✅ |

⚠ 标记的项不影响功能，可经由工具兜底完成。

---

## 6. v0.1.0 发布流程（npm publish）

> ⚠️ 实际 `npm publish` 命令需要本机已 `npm login` 且持有 `harness-engineering-mcp` 包名（首次发布者需先 `npm owner` 占位或换 scope）。本节列流程，**不**自动执行。

### 6.1 发布前检查

```bash
# 1. 工作区干净
git status

# 2. 全部门禁
npm run typecheck
npm run lint
npm run build
npm test

# 3. CLI / MCP 入口冒烟
node dist/cli.js --version
node dist/cli.js check --cwd . --run-tests --test-timeout-ms 120000

# 4. 包内容预览
npm pack --dry-run
```

### 6.2 发布

```bash
# 5. 更新版本（如已是 0.1.0，使用 --no-git-tag-version 避免重复 tag）
npm version 0.1.0 --no-git-tag-version

# 6. 真发布（首次发布需要 OTP）
npm publish --access public

# 7. tag + push
git tag v0.1.0
git push origin v0.1.0
```

### 6.3 发布后冒烟

```bash
# 8. 在临时目录里验证 npm 链路
#    注意：包名 ≠ bin 名，必须用 `-p <pkg> <bin>` 写法
mkdir tmp-verify && cd tmp-verify
npx -y -p harness-engineering-mcp@0.1.0 harness --version
npx -y -p harness-engineering-mcp@0.1.0 harness init --mode=solo --stack=other --type=library --name=verify
npx -y -p harness-engineering-mcp@0.1.0 harness check --json

# 9. 三 IDE 重新指向已发布版（删除本地 dist/ 路径）
```

### 6.4 回滚

```bash
# 仅在 24 小时内可 unpublish
npm unpublish harness-engineering-mcp@0.1.0
```

24 小时后请改为发布 `0.1.1` 修正版而非 unpublish。

---

## 7. 验收清单（M4 / 发布）

- [x] `harness_gate_review` 使用 bundled 8 维度模板生成；BLOCKER 表格 + bullet 双语义解析
- [x] `harness_upgrade_mode` 累积生成各 tier 增量文件（small-team/mid-team/org）；已存在文件保留原内容
- [x] Cursor / Claude Code / Codex CLI 三家挂载方式 + 联调脚本明文记录
- [x] 三 IDE 兼容性矩阵
- [ ] 本机执行一次 §6.2 npm publish（需用户自行触发）
- [ ] 发布后跑 §6.3 冒烟 + tag push
