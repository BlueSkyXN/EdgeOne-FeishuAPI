# EdgeOne-FeishuAPI 设计规范

## 目标

EdgeOne 作为飞书 OpenAPI 的代理中转层，内部使用自建应用的凭证访问飞书，
对外暴露与飞书路径风格一致的接口，便于其他程序接入。

当前仅实现：多维表单行新增（代理 `batch_create`，但限制单条）。

## 路由与命名

- 路径尽量贴近飞书原始路径。
- JSON 字段使用 snake_case，字段名与飞书保持一致。

## 认证

必须通过环境变量 `API_AUTH_TOKEN` 进行鉴权，支持任一方式：

- `Authorization: Bearer <token>`
- `X-Api-Token: <token>`
- `X-Api-Key: <token>`

鉴权规则：

- 缺少凭证返回 401
- 凭证无效返回 403

## 环境变量

- `API_AUTH_TOKEN`（必填，对外接口鉴权）
- `FEISHU_APP_ID`（必填）
- `FEISHU_APP_SECRET`（必填）
- `FEISHU_BASE_URL`（可选，默认 `https://open.feishu.cn`）
- `DEFAULT_USER_ID_TYPE`（可选，默认 `open_id`）

说明：目前不使用 KV；token 缓存仅保存在内存实例中。

## 接口

### 健康检查

#### GET /health

说明：验证可否获取 `tenant_access_token`（必要时刷新），不返回 token 本身。

成功响应：

```json
{
  "request_id": "req_123",
  "data": {
    "status": "ok",
    "token_expires_in": 7200
  }
}
```

### 单行新增记录

#### POST /open-apis/bitable/apps/{app_token}/tables/{table_id}/records/batch_create

说明：保持飞书原路径，仅支持单条记录写入（`records` 长度必须为 1）。

路径参数：

- `app_token`：多维表 App 的唯一标识
- `table_id`：数据表唯一标识

查询参数（同飞书）：

- `user_id_type`：用户 ID 类型（`open_id` / `union_id` / `user_id`）
- `client_token`：幂等键（uuidv4）
- `ignore_consistency_check`：是否忽略一致性检查（`true` / `false`）

请求体：

```json
{
  "records": [
    {
      "fields": {
        "文本": "Hello",
        "数字": 100,
        "日期": 1674206443000
      }
    }
  ]
}
```

内容格式定义：

- `records`：数组，长度必须为 1。
- `records[0].fields`：map，key 为多维表字段名，value 结构与飞书字段类型一致。

成功响应：

```json
{
  "request_id": "req_123",
  "data": {
    "records": [
      {
        "record_id": "recusyQbB0fVL5"
      }
    ]
  }
}
```

错误响应（统一结构）：

```json
{
  "request_id": "req_123",
  "error": {
    "code": "invalid_request",
    "message": "Only one record is supported",
    "details": {
      "field": "records"
    }
  }
}
```

## 上游映射（飞书）

- 获取 tenant_access_token：
  - `POST /open-apis/auth/v3/tenant_access_token/internal`
  - Body：`{ "app_id": "...", "app_secret": "..." }`
  - 用途：健康检查、单行新增记录

- 新增记录（批量接口）：
  - `POST /open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_create`
  - Query：`user_id_type`、`client_token`、`ignore_consistency_check`
  - Body：`{ "records": [ ... ] }`
