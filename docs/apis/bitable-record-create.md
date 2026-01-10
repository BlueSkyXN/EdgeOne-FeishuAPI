# 多维表单记录新增（records）

## 接口

POST /open-apis/bitable/apps/{app_token}/tables/{table_id}/records

说明：

- 代理飞书“新增记录”接口，请求与响应保持一致，仅替换鉴权 token。
- 路径不含 `v1`，其余保持飞书风格。
- 批量新增请使用 `POST /open-apis/bitable/apps/{app_token}/tables/{table_id}/records/batch_create`。

## 路径参数

- `app_token`：多维表 App 的唯一标识
- `table_id`：数据表唯一标识

## 查询参数

- `user_id_type`：`open_id` | `union_id` | `user_id`
- `client_token`：幂等键（uuidv4）
- `ignore_consistency_check`：`true` | `false`

说明：参数与飞书一致，网关不做默认值覆盖，所有 query 直接透传。

## 请求体

```json
{
  "fields": {
    "文本": "Hello",
    "数字": 100,
    "日期": 1674206443000
  }
}
```

内容格式定义：

- `fields`：map，key 为字段名，value 结构与飞书字段类型一致。

## 成功响应

```json
{
  "code": 0,
  "data": {
    "record": {
      "fields": {
        "任务名称": "维护客户关系",
        "创建日期": 1674206443000,
        "截止日期": 1674206443000
      },
      "id": "recusutYZm4ulo",
      "record_id": "recusutYZm4ulo"
    }
  },
  "msg": "success"
}
```

## 错误响应

```json
{
  "code": 1254000,
  "msg": "WrongRequestJson"
}
```

说明：飞书侧错误响应原样透传；仅当 API_AUTH_TOKEN 缺失或无效时，返回 401/403 的网关错误格式。

## 示例（curl）

```bash
curl -X POST \
  "https://<your-domain>/open-apis/bitable/apps/appbcbWCzen6D8dezhoCH2RpMAh/tables/tblsRc9GRRXKqhvW/records?user_id_type=open_id" \
  -H "Authorization: Bearer <API_AUTH_TOKEN>" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "fields": {
      "文本": "Hello"
    }
  }'
```
