# 健康检查

## 接口

GET /health

说明：

- 通过 `tenant_access_token` 获取接口验证凭证可用性。
- 不返回 token，本地仅回传状态与剩余有效期（秒）。

## 认证

请求头需携带 `API_AUTH_TOKEN`（参考 `docs/README.md` 统一约定）。

## 成功响应

```json
{
  "request_id": "req_123",
  "data": {
    "status": "ok",
    "token_expires_in": 7200
  }
}
```

字段说明：

- `status`：固定为 `ok`。
- `token_expires_in`：token 剩余有效期（秒）。

## 错误响应

```json
{
  "request_id": "req_123",
  "error": {
    "code": "upstream_error",
    "message": "Failed to fetch token",
    "details": {
      "feishu_status": 400,
      "feishu_code": 99991663,
      "feishu_msg": "app_id or app_secret invalid"
    }
  }
}
```

## 示例（curl）

```bash
curl -X GET \
  "https://<your-domain>/health" \
  -H "Authorization: Bearer <API_AUTH_TOKEN>"
```
