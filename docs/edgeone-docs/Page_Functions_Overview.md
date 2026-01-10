# Page Functions 概览

Pages Functions 是一种 Serverless 架构解决方案，允许您运行服务端代码，而无需配置或管理服务器。它能根据网站访问流量自动扩缩容，并通过 EdgeOne 全球边缘节点提供更强的并发能力。您可使用 Functions 部署 API，并支持连接多种数据库，帮助您更好的实现前后端一体化项目与部署。

部署时，Pages 会自动识别项目框架并优化配置，基于 EdgeOne 边缘网络实现智能路由与低延迟访问。当前提供了两种类型 Functions：

Cloud Functions 提供多种运行时环境，每个运行时环境都有一套自己的库、API 和特性，它们各有优缺点。

目前已支持 Node.js 运行时，提供完整的 Node.js 兼容性，支持原生模块与长计算时间，适合深度依赖 Node.js 生态业务场景。

Edge Functions 依托全球边缘节点，提供超低延迟与毫秒级冷启动，适合高并发、延迟敏感业务。

注意：

若您需要使用 Next.js 特定语法或框架上下文的 API，建议在 Next.js 的内置 API 路由目录进行开发，Pages 会自动处理部署。

### 快速开始

Cloud Functions 以 Node Functions 为例，在项目的 ./node-functions/api 目录下，使用以下示例代码来创建您的第一个 Node Functions：

```javascript
export default function onRequest(context) {
  return new Response('Hello from Node Functions!');
}
```

或通过模板来部署应用 Node Functions 的项目。

在项目的 ./edge-functions/api 目录下，使用以下示例代码来创建您的第一个 Edge Functions：

```javascript
export default function onRequest(context) {
  return new Response('Hello from Edge Functions!');
}
```

或通过模板来部署应用 Edge Functions 的项目。

### Cloud Functions 与 Edge Functions 的区别

| 特性 | Cloud Functions | Edge Functions |
|---|---|---|
| 运行位置 | 云中心 | 全球边缘节点 |
| 冷启动时间 | 相对较长 | 毫秒级 |
| 延迟性能 | 较低 | 极低 |
| 运行时环境 | 多种运行时环境（目前已支持 Node.js Runtime） | Edge Runtime |
| 适用场景 | 复杂数据处理 较长执行时间 | 高并发、延迟敏感 短执行时间 |

如需进一步了解，可参考文档 Cloud Functions 跟 Edge Functions。
