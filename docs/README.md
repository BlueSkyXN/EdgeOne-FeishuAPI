# EdgeOne-FeishuAPI 总体文档

本项目是飞书 OpenAPI 的代理中转层，部署在腾讯云 EdgeOne Pages。
通过环境变量配置自建应用凭证，对外提供与飞书路径风格一致的接口，
以便其他程序无需直接对接飞书 API。

## 目标与范围

- 仅支持自建应用的 `tenant_access_token`。
- 当前实现：健康检查、多维表单记录新增（records、batch_create）。
- 通过 `API_AUTH_TOKEN` 进行接口鉴权。

## 统一约定

### 基础路径

接口路径尽量贴近飞书原路径，但本代理移除了 `v1` 前缀：

- 代理入口（批量）：`/open-apis/bitable/apps/{app_token}/tables/{table_id}/records/batch_create`
- 代理入口（单条）：`/open-apis/bitable/apps/{app_token}/tables/{table_id}/records`
- 上游飞书：`/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create`
- 上游飞书：`/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records`

### 认证

必须设置环境变量 `API_AUTH_TOKEN`，请求时使用：

- `Authorization: Bearer <token>`

### 环境变量

- `API_AUTH_TOKEN`（必填）
- `FEISHU_APP_ID`（必填）
- `FEISHU_APP_SECRET`（必填）
- `FEISHU_BASE_URL`（可选，默认 `https://open.feishu.cn`）
- `DEFAULT_USER_ID_TYPE`（可选，默认 `open_id`）

说明：当前不使用 KV；token 仅在实例内存中缓存；代理不再覆盖 `user_id_type` 默认值。

### 响应格式

飞书代理接口的响应体/状态码原样透传，仅追加 CORS 与 `X-Request-Id` 响应头。

健康检查接口保持自定义结构：

```json
{
  "request_id": "req_123",
  "data": {
    "status": "ok",
    "token_expires_in": 7200
  }
}
```

## EdgeOne 文档

- `docs/edgeone-docs/Edge_Functions.md`：Edge Functions 文档。
- `docs/edgeone-docs/Page_Functions_Overview.md`：Page Functions 概览。

## 文档导航

详见 `docs/STRUCTURE.md`。
