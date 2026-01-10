# Edge Functions

### 概述

Edge Functions 提供了 EdgeOne 边缘节点的 Serverless 代码执行环境，您只需编写业务函数代码并设置触发规则，无需配置和管理服务器等基础设施，即可在靠近用户的边缘节点上弹性、安全地运行代码。

![](https://write-document-release-1258344699.cos.ap-guangzhou.myqcloud.com/100026466949%2F8482102771ad11f09e39525400454e06.png)

### 优势

分布式部署

EdgeOne 拥有超过 3200+ 边缘节点，边缘函数以分布式部署的方式运行在边缘节点。

超低延迟

客户端请求将自动被调度至靠近您用户最近的边缘节点上，命中触发规则触发边缘函数对请求进行处理并响应结果给客户端，可显著降低客户端的访问时延。

弹性扩容

边缘函数可以根据客户端请求数的突增，由近及远的将请求调度至有充足计算资源的边缘节点处理，您无需担忧突峰场景。

Serverless 架构

您无需再关心和维护底层服务器的内存、CPU、网络和其他基础设施资源，可以挪出精力更专注业务代码的开发。

### 快速开始

在项目的 ./edge-functions/api 目录下新建 hello.ts，使用以下示例代码创建您的第一个 Edge Functions：

```typescript
// 文件路径 ./edge-functions/api/hello.js
// 访问路径 example.com/api/hello
export default function onRequest(context) {
  return new Response('Hello from Edge Functions!');
}
```

注意：

在 ./edge-functions 目录下创建 index.js，访问根路径则会进入到该函数而非首页。

在 ./edge-functions 目录下创建 [[id]].js，除根路径外其他所有路径都会进入到该函数，需在函数内处理静态资源的返回。

### 函数调试

1. 安装 EdgeOne CLI： `npm install -g edgeone`

2. 本地开发：在 Pages 代码项目下执行 `edgeone pages dev` ，启动本地服务，进行函数调试

3. 函数发布：代码推送到远端仓库，自动构建发布函数

更多 EdgeOne CLI 的使用方式可参考 文档。

### 路由

Edge Functions 基于 `/edge-functions` 目录结构生成访问路由。您可在项目仓库 /edge-functions 目录下创建任意层级的子目录，参考下述示例。

```bash
...
edge-functions
├── index.js
├── hello-pages.js
├── helloworld.js
├── api
    ├── users
      ├── list.js
      ├── geo.js
      ├── [id].js
    ├── visit
      ├── index.js
    ├── [[default]].js
...
```

上述目录文件结构，经 EdgeOne Pages 平台构建后将生成以下路由。这些路由将 Pages URL 映射到 `/edge-functions` 文件，当客户端访问 URL 时将触发对应的文件代码被运行：

| 文件路径 | 路由 |
|---|---|
| /edge-functions/index.js | example.com/ |
| /edge-functions/hello-pages.js | example.com/hello-pages |
| /edge-functions/helloworld.js | example.com/helloworld |
| /edge-functions/api/users/list.js | example.com/api/users/list |
| /edge-functions/api/users/geo.js | example.com/api/users/geo |
| /edge-functions/api/users/[id].js | example.com/api/users/1024 |
| /edge-functions/api/visit/index.js | example.com/api/visit |
| /edge-functions/api/[[default]].js | example.com/api/books/list example.com/api/books/1024 example.com/api/... |

说明：

路由尾部斜杠 / 是可选。 `/hello-pages` 和 `/hello-pages/` 将被路由到 /edge-functions/hello-pages.js。

如果没有匹配到 Edge Functions 路由，客户端请求将被路由到 Pages 对应的静态资源。

路由大小写敏感，/helloworld 将被路由到 /edge-functions/helloworld.js，不能被路由到 /edge-functions/HelloWorld.js。

动态路由

Edge Functions 支持动态路由，上述示例中一级动态路径 /edge-functions/api/users/[id].js，多级动态路径 /edge-functions/api/[[default]].js。参考下述用法：

<table><tbody><tr><td>文件路径</td><td>路由</td><td>匹配</td></tr><tr><td colspan="1" rowspan="3">/edge-functions/api/users/[id].js</td><td>example.com/api/users/1024</td><td>是</td></tr><tr><td colspan="0" rowspan="0"></td><td>example.com/api/users/vip/1024</td><td>否</td></tr><tr><td colspan="0" rowspan="0"></td><td>example.com/api/vip/1024</td><td>否</td></tr><tr><td colspan="1" rowspan="3">/edge-functions/api/[[default]].js</td><td>example.com/api/books/list</td><td>是</td></tr><tr><td colspan="0" rowspan="0"></td><td>example.com/api/1024</td><td>是</td></tr><tr><td colspan="0" rowspan="0"></td><td>example.com/v2/vip/1024</td><td>否</td></tr></tbody></table>

### Function Handlers

使用 Functions Handlers 可为 Pages 创建自定义请求处理程序，以及定义 RESTful API 实现全栈应用。支持下述的 Handlers 方法：

| Handlers 方法 | 描述 |
|---|---|
| `onRequest` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `GET` , `POST` , `PATCH` , `PUT` , `DELETE` , `HEAD` , `OPTIONS` ) |
| `onRequestGet` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `GET` ) |
| `onRequestPost` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `POST` ) |
| `onRequestPatch` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `PATCH` ) |
| `onRequestPut` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `PUT` ) |
| `onRequestDelete` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `DELETE` ) |
| `onRequestHead` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `HEAD` ) |
| `onRequestOptions` (context: EventContext): Response \| Promise | 匹配 HTTP Methods ( `OPTIONS` ) |

EventContext 对象描述

context 是传递给 Function Handlers 方法的对象，包含下述属性：

request：客户端请求对象 Request 

params：动态路由 `/edge-functions/api/users/[id].js` 参数值

```javascript
export function onRequestGet(context) {
  return new Response(`User id is ${context.params.id}`);
}
```

env：Pages 环境变量

waitUntil： `(task: Promise<any>): void;` 用于通知边缘函数等待 Promise 完成，可延长事件处理的生命周期

### Runtime APIs

Edge Functions 基于 边缘函数 实现，提供了 EdgeOne 边缘节点的 Serverless 代码执行环境。支持 ES6 语法和标准的 Web Service Worker API。其中大部分 Runtime APIs 可参考 边缘函数 用法，参考下述描述：

| API | 描述 |
|---|---|
| Cache | Cache 基于 Web APIs 标准 Cache API 进行设计。Functions 运行时会在全局注入 caches 对象，该对象提供了一组缓存操作接口。 |
| Cookies | Cookies 提供了一组 cookie 操作接口。 |
| Encoding | 基于 Web APIs 标准 TextEncoder 、 TextDecoder 进行设计，实现了编码器与解码器。 |
| Fetch | 基于 Web APIs 标准 Fetch API 进行设计。边缘函数运行时可使用 fetch 发起异步请求，获取远程资源。 |
| Headers | Headers 基于 Web APIs 标准 Headers 进行设计。可用于 HTTP request 和 response 的头部操作。 |
| Request | Request 代表 HTTP 请求对象，基于 Web APIs 标准 Request 进行设计。 |
| Response | Response 代表 HTTP 响应，基于 Web APIs 标准 Response 进行设计。 |
| Streams | ReadableStream 可读流，也称为可读端，基于 Web APIs 标准 ReadableStream 进行设计。 |
| Web Crypto | Web Crypto API 基于 Web APIs 标准 Web Crypto API 进行设计。提供了一组常见的加密操作接口，相比纯 JavaScript 实现的加密接口，Web Crypto API 的性能更高。 |
| Web Standards | 边缘函数基于 V8 JavaScript 引擎设计实现的 Serverless 代码执行环境，提供了以下标准化的 Web APIs。 |

说明：

当前 EdgeOne CLI 调试环境中不支持使用 fetch 访问 EdgeOne 节点缓存或回源。

使用 context.request.eo 可获取客户端 GEO 信息。

Edge Functions 不支持使用 addEventListener，请基于 Function Handlers 监听客户端请求。

### 使用限制

| 内容 | 限制 | 说明 |
|---|---|---|
| 代码包大小 | 5 MB | 单个函数代码包大小最多支持 5 MB |
| 请求 body 大小 | 1 MB | 客户端请求携带 body 最多支持 1 MB |
| CPU 时间 | 200 ms | 函数单次执行分配的 CPU 时间片，不包含 I/O 等待时间 |
| 开发语言 | JavaScript | 目前仅支持 JavaScript，ES2023+ |

