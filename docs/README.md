# EdgeOne-FeishuAPI 总体文档

本项目是飞书 OpenAPI 的代理中转层，部署在腾讯云 EdgeOne Pages。
通过环境变量配置自建应用凭证，对外提供与飞书路径风格一致的接口，
以便其他程序无需直接对接飞书 API。

## 目标与范围

- 仅支持自建应用的 `tenant_access_token`。
- 当前实现：健康检查、多维表单行新增（代理 `batch_create`，但限制单条）。
- 通过 `API_AUTH_TOKEN` 进行接口鉴权。

## 统一约定

### 基础路径

接口路径尽量贴近飞书原路径，但本代理移除了 `v1` 前缀：

- 代理入口：`/open-apis/bitable/apps/{app_token}/tables/{table_id}/records/batch_create`
- 上游飞书：`/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create`

### 认证

必须设置环境变量 `API_AUTH_TOKEN`，请求时使用以下任一方式：

- `Authorization: Bearer <token>`
- `X-Api-Token: <token>`
- `X-Api-Key: <token>`

### 环境变量

- `API_AUTH_TOKEN`（必填）
- `FEISHU_APP_ID`（必填）
- `FEISHU_APP_SECRET`（必填）
- `FEISHU_BASE_URL`（可选，默认 `https://open.feishu.cn`）
- `DEFAULT_USER_ID_TYPE`（可选，默认 `open_id`）

说明：当前不使用 KV；token 仅在实例内存中缓存。

### 响应格式

成功响应：

```json
{
  "request_id": "req_123",
  "data": { }
}
```

错误响应：

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

## EdgeOne 文档

- `docs/edgeone-docs/Edge_Functions.md`：Edge Functions 文档。
- `docs/edgeone-docs/Page_Functions_Overview.md`：Page Functions 概览。

## 文档导航

详见 `docs/STRUCTURE.md`。
