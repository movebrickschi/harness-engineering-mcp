# 实施方案文档

## 1. A 概念 → B 实现 翻译表

| A 项目概念 | B 项目对应方案 | 文件位置 | 优先级 | 备注 |
|-----------|---------------|---------|--------|------|
| suppliers 表 | 新增 Prisma model `Supplier` | prisma/schema.prisma | 必做 | B 用 snake_case |
| GET /admin/api/suppliers | NestJS Controller + Service | src/admin/suppliers/* | 必做 | 参考 src/admin/users/ |
| 列表分页 page/size | 复用 PaginationDto | src/common/dto/pagination.dto.ts | 必做 | 已有 |
| 批量审核 | 新增 Service 方法 + Controller | src/admin/suppliers/ | 必做 | |
| 审核日志 | 新增 ApprovalLog model | prisma/schema.prisma | 应做 | 不影响主流程 |
| 操作通知 PM | - | - | 可选 | 二期 |

**优先级说明**：
- **必做**：MVP 必备，缺则不可上线
- **应做**：质量保证，应该一起做
- **可选**：增强功能，可以二期

## 2. 新建文件清单

```
src/admin/suppliers/
├── suppliers.controller.ts     [必做]
├── suppliers.service.ts        [必做]
├── suppliers.module.ts         [必做]
├── dto/
│   ├── create-supplier.dto.ts  [必做]
│   ├── update-supplier.dto.ts  [必做]
│   ├── query-supplier.dto.ts   [必做]
│   └── batch-approve.dto.ts    [必做]
└── suppliers.controller.spec.ts [必做]

prisma/migrations/[timestamp]_add_supplier/
└── migration.sql               [必做]
```

## 3. 修改文件清单

| 文件 | 修改内容 | 风险 |
|------|---------|------|
| prisma/schema.prisma | 新增 Supplier、ApprovalLog model | 低（纯新增） |
| src/admin/admin.module.ts | 导入 SuppliersModule | 极低 |
| src/admin/menu.config.ts | 增加菜单项 | 低 |

## 4. 数据库迁移

- [x] 需要迁移
- 迁移脚本：`prisma/migrations/[timestamp]_add_supplier/`
- 是否需要数据回填：否
- 是否需要灰度：否（纯新增表）

## 5. 依赖检查

| 需要的库 | B 项目是否有 | 处理方式 |
|---------|------------|---------|
| @nestjs/common | ✅ 已有 | 直接用 |
| class-validator | ✅ 已有 | 直接用 |
| prisma | ✅ 已有 | 直接用 |
| 无新增依赖 | - | - |

## 6. 关键决策记录

### 决策 1：是否复用现有 ApprovalLog
- **选项 A**：复用现有 ApprovalLog 表（如已有）
- **选项 B**：新建 SupplierApprovalLog 表
- **决定**：[填] 因为 [理由]

### 决策 2：批量操作的并发控制
- **选项 A**：串行处理
- **选项 B**：并行处理 + 失败回滚
- **决定**：[填] 因为 [理由]

## 7. 实施顺序

1. 数据库 schema + 迁移
2. 后端 Service 单元测试
3. 后端 Controller + 集成测试
4. 前端列表页（垂直切片验证候选）
5. 前端详情/操作页
6. 端到端 QA

## 8. 估算

| 任务 | 估时 |
|------|------|
| Schema + 迁移 | 0.5h |
| 后端实现 + 测试 | 4h |
| 前端实现 + 测试 | 6h |
| 联调 + QA | 2h |
| **总计** | **12.5h** |
