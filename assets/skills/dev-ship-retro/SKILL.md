---
name: dev-ship-retro
description: 双项目开发流程的"上线复盘"阶段（阶段 8-10）。包含 PM 验收材料准备、上线、监控、知识库沉淀。需要功能已开发完成且通过自查。Use when asked to "PM验收", "准备上线", "上线复盘", "/dev-ship-retro", or when feature is developed and ready for PM acceptance and deployment. Voice triggers: "上线复盘", "PM验收".
---

# Dev Ship & Retro - 上线复盘阶段

## 适用场景

完整开发流程的收尾阶段。前置条件：
- 功能已通过 `/dev-implement` 或手动开发完成
- 通过自查（QA、Review）
- 准备进入 PM 验收 → 上线 → 复盘

本阶段产出：PM demo 材料 + 上线 PR + 知识库沉淀。

## 核心原则

1. **PM 验收必须卡点**：技术 OK ≠ 业务认可
2. **上线后必须监控**：避免上线即出事
3. **知识必须沉淀**：每次复盘自动追加到 `_lessons.md`，下次自动加载

## 启动参数收集

使用 `AskQuestion` 工具收集：

1. **需求名称**（定位 `~/Projects/_requirements/[feature]/`）
2. **目标项目 B 路径**
3. **是否已通过 PM 验收**（决定是否跳过卡点 4）
4. **部署平台**（如未配置则提示先跑 `/setup-deploy`）

启动前**验证**：当前项目处于干净 git 状态、有未推送的 commits。

## 流程执行

### 前置：加载上下文

1. 加载 `~/Projects/_requirements/[feature]/` 全部文档
2. 加载 `~/Projects/_requirements/_lessons.md`
3. 检查 git 状态：当前分支、commits 数量、是否有未提交改动
4. 检查 B 项目部署配置（CLAUDE.md 中的 deploy 配置）

### 阶段 8：PM 验收 ⏸ 卡点

如果用户启动时已选"已通过 PM 验收"，跳过本阶段。否则：

1. 整理 demo 材料 `docs/demo-package.md`：
   - 主流程截图序列（用 `cursor-ide-browser` 自动截图分镜）
   - 关键操作录屏（如可能）
   - **与原型 A 的行为对比表**（哪些一致、哪些主动改了、哪些已知差异）
   - 已知限制说明
2. 如果 A 项目仍可运行，可同时打开 A 和 B 做最终对照截图
3. **调用 `AskQuestion` 阻塞等待**：
   ```
   prompt: "demo 材料已准备好（docs/demo-package.md）。PM 验收结果："
   options:
     - "PM 通过，进入上线"
     - "PM 提出小修改（请说明）"
     - "PM 不认可，需要回开发阶段"
   ```
4. 如有小修改：完成后再次 `AskQuestion` 确认

### 阶段 9：上线（Ship + Land + Canary）

1. **`/ship`** - 创建 PR：
   - 自动检测/合并 base 分支
   - 跑测试
   - bump VERSION + 更新 CHANGELOG
   - 中文 commit 提交（遵循用户 commit 规范）
   - 推送 + 创建 PR
2. **`/land-and-deploy`** - 合并 + 部署：
   - 合并 PR
   - 等待 CI
   - 等待部署
   - 验证生产健康
3. **`/canary`** - 上线后监控：
   - 监控 console errors
   - 性能基线对比
   - 关键页面截图对比
4. 输出 PR 链接、上线状态、监控结果

### 阶段 10：复盘 + 知识库沉淀

1. **更新 `~/Projects/_requirements/_lessons.md`**（如不存在则创建），追加格式：
   ```markdown
   ## [YYYY-MM-DD] [feature-name]

   ### PM 沟通踩坑
   - （这次 PM 沟通中哪些问题应该早问？比如某个边界场景理解错了，回头看应该提前问）

   ### B 项目隐性规范
   - （发现的、未文档化的约定，比如"所有 admin 接口都要加 audit log"）

   ### A 与 B 的差异
   - （A 用了什么 B 没有？反之？比如 A 用 Vue Composition，B 用 React Hooks）

   ### 架构决策
   - （这次为什么选 X 不选 Y？记录权衡过程）

   ### 复用机会
   - （下次类似需求可以复用这次的什么？比如新建的 BatchActionMixin 可复用）

   ### 踩过的坑
   - （技术上遇到的坑 + 解决方案）

   ### 实际耗时 vs 估算
   - 估算：N 小时 / 实际：M 小时
   - 主要超时原因：...
   ```

2. **更新本次需求的 `META.md`**：
   - 标记完成状态：`status: done`
   - 实际耗时：`actual_hours: N`
   - PR 链接：`pr_url: ...`
   - 上线时间：`deployed_at: ...`

3. **输出最终总结**：
   ```
   ✅ 需求 [feature-name] 已完成上线

   📊 数据：
     - 开发耗时：N 小时
     - commits：M 个
     - 改动文件：X 个
     - 新增代码：+A / 删除：-B

   🔗 链接：
     - PR：[url]
     - 监控：[url]

   📚 知识沉淀：
     - 已追加到 _lessons.md：N 条经验
     - 下次类似需求可复用：[列出关键复用点]

   🎉 完成！
   ```

## 错误处理

- 部署失败 → 自动回滚 + 调用 `/investigate`
- canary 监控发现严重 issue → 立即告警 + 建议回滚
- PM 不认可且改动较大 → 评估是回 `/dev-implement` 阶段 6 还是阶段 4
- git 状态不干净 → 提示用户先处理本地改动

## 文档模板位置

统一维护在 `~/.cursor/skills/dev-flow-full/templates/`：
- `_lessons.md` - 经验沉淀（位于 `~/Projects/_requirements/_lessons.md`，已存在则追加）

## 与其他 Skill 的关系

- 前置：`/dev-implement`（开发完成）或手动开发
- 完整流程：`/dev-flow-full`
- 上线后日常监控：`/canary`
