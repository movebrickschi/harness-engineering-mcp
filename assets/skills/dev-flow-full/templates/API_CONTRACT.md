# 接口契约文档

> ⚠️ 用业务语言描述接口，**不要绑定具体框架**（不写 NestJS / Express / FastAPI 代码）。
> 实际实现时由开发者按 B 项目的框架适配。

## 接口清单

| ID | 业务含义 | 方法 | 路径 | 鉴权 |
|----|---------|------|------|------|
| API-001 | 获取供应商列表 | GET | /admin/api/suppliers | admin |
| API-002 | 创建供应商 | POST | /admin/api/suppliers | admin |
| API-003 | 批量审核供应商 | POST | /admin/api/suppliers/batch-approve | admin |

---

## API-001：获取供应商列表

**业务含义**：管理员查询所有供应商，支持分页、筛选、搜索。

**请求**：
```
GET /admin/api/suppliers?page=1&size=20&status=pending&keyword=张三
```

**Query 参数**：
| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| page | int | 否 | 1 | 页码，从 1 开始 |
| size | int | 否 | 20 | 每页条数，最大 100 |
| status | enum | 否 | - | pending/approved/rejected |
| keyword | string | 否 | - | 名称/联系人模糊搜索 |

**响应（200）**：
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "供应商名称",
      "contact": "联系人",
      "status": "pending",
      "created_at": "2026-04-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100
  }
}
```

**错误码**：
| HTTP | code | 含义 | 处理建议 |
|------|------|------|---------|
| 401 | UNAUTHORIZED | 未登录 | 跳转登录 |
| 403 | FORBIDDEN | 无权限 | 提示无权限 |

**幂等性**：是（GET 请求天然幂等）

**性能要求**：P95 < 200ms（数据量 < 10w）

---

## API-002：[下一个接口...]

（按上述模板继续）

---

## 通用约定

### 鉴权
- 所有 admin 接口需带 token，header: `Authorization: Bearer xxx`
- token 失效返回 401

### 错误响应格式
```json
{
  "code": "ERROR_CODE",
  "message": "用户可见的错误描述",
  "details": {}
}
```

### 时区
- 所有时间字段统一 ISO 8601 UTC 格式
- 前端展示时转本地时区

### 分页
- 统一使用 `page` + `size` 参数
- 响应统一返回 `pagination` 对象
