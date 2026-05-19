# 复用审计文档

> 目的：在新建任何代码前，先扫描 B 项目已有能力，最大化复用，减少重复造轮子。

## 1. 可复用清单

| 需求点 | 复用项 | 文件位置 | 复用方式 | 备注 |
|--------|--------|---------|---------|------|
| 列表分页 | PaginationDto | src/common/dto/pagination.dto.ts | 直接引入 | |
| 列表搜索 | KeywordSearchPipe | src/common/pipes/keyword.pipe.ts | 装饰器形式 | |
| Admin 鉴权 | @AdminGuard | src/admin/guards/admin.guard.ts | Controller 装饰器 | |
| 操作日志 | LogService | src/common/services/log.service.ts | 注入 | |
| 软删除 | SoftDeleteMixin | src/common/mixins/soft-delete.ts | model 继承 | |
| 列表组件 | AdminTable | src/components/admin/AdminTable.vue | 直接引入 | 支持分页/搜索/操作列 |
| 表单组件 | AdminForm | src/components/admin/AdminForm.vue | schema 驱动 | |
| 确认弹窗 | useConfirmDialog | src/composables/useConfirmDialog.ts | composable | |

## 2. 部分可复用清单

| 需求点 | 现有项 | 缺什么 | 处理方式 |
|--------|--------|--------|---------|
| 批量操作 | useBatchSelect composable | 缺批量审核的业务逻辑 | 在新模块封装业务逻辑，UI 复用 |
| 状态枚举 | StatusEnum 通用枚举 | 没有 supplier 特有状态 | 扩展现有枚举或新建 |

## 3. 必须新建清单

| 需求点 | 原因 | 建议位置 |
|--------|------|---------|
| Supplier 实体 | 项目无类似领域 | src/admin/suppliers/ |
| Supplier 业务规则 | 全新业务 | src/admin/suppliers/suppliers.service.ts |

## 4. 命名规范参考

参考 B 项目已有同类模块（如 `src/admin/users/`）：
- 文件命名：kebab-case（`suppliers.controller.ts`）
- 类命名：PascalCase（`SuppliersController`）
- 方法命名：camelCase（`findAll`、`batchApprove`）
- 数据库字段：snake_case（`contact_name`、`created_at`）

## 5. 潜在重复风险

⚠️ 以下情况需特别注意：
- [ ] 不要新建已有的工具函数（搜索 `src/utils/` 确认）
- [ ] 不要新建已有的类型定义（搜索 `src/types/` 确认）
- [ ] 不要重复定义已有的常量（搜索 `src/constants/` 确认）
