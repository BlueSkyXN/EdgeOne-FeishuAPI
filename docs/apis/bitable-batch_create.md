# 多维表单行新增（batch_create）

## 接口

POST /open-apis/bitable/apps/{app_token}/tables/{table_id}/records/batch_create

说明：

- 代理飞书 `batch_create` 接口，但限制单条新增。
- 路径不含 `v1`，其余保持飞书风格。

## 路径参数

- `app_token`：多维表 App 的唯一标识
- `table_id`：数据表唯一标识

## 查询参数

- `user_id_type`：`open_id` | `union_id` | `user_id`
- `client_token`：幂等键（uuidv4）
- `ignore_consistency_check`：`true` | `false`

若未提供 `user_id_type`，使用 `DEFAULT_USER_ID_TYPE`。

## 请求体

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
- `records[0].fields`：map，key 为字段名，value 结构与飞书字段类型一致。

## 成功响应

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

## 错误响应

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

## 示例（curl）

```bash
curl -X POST \
  "https://<your-domain>/open-apis/bitable/apps/appbcbWCzen6D8dezhoCH2RpMAh/tables/tblsRc9GRRXKqhvW/records/batch_create?user_id_type=open_id" \
  -H "Authorization: Bearer <API_AUTH_TOKEN>" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "records": [
      {
        "fields": {
          "文本": "Hello"
        }
      }
    ]
  }'
```
