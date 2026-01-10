# 文档结构与导航

本目录按“总览 + 导航 + 接口明细”组织。

## 总览

- `docs/README.md`：项目总体说明、统一约定、认证与响应格式。

## 接口文档

每个接口一份文档，放在 `docs/apis/`。

- `docs/apis/health.md`：健康检查（获取 tenant_access_token 以验证可用性）。
- `docs/apis/bitable-batch_create.md`：多维表单记录新增（批量 batch_create）。
- `docs/apis/bitable-record-create.md`：多维表单记录新增（单条 records）。

## EdgeOne 文档

- `docs/edgeone-docs/Edge_Functions.md`：Edge Functions 文档。
- `docs/edgeone-docs/Page_Functions_Overview.md`：Page Functions 概览。

## 约定

- 新增接口时：在 `docs/apis/` 增加对应文档，并更新本导航。
