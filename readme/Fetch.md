<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# Fetch

为 Swagger 生成的 Axios 客户端提供统一请求头、错误标准化和微前端宿主错误通知。

</div>

`fetch` 是公共 CLI 生成客户端的运行时配置层。它不封装 Axios、不重复生成类型，也不导出任何具体服务单例。每个项目使用自己的生成客户端创建服务单例，并共享 `apiInterceptors`。

## 快速开始

以下 `<service>`、`serviceApi` 和 `<generatedMethod>` 都是占位符，需替换为项目实际的服务目录、单例名和生成方法。

```ts
import { ApiClient as GeneratedApiClient } from '@/api/<service>';
import { apiInterceptors } from '@/fetch';

export const serviceApi = new GeneratedApiClient({
  interceptors: apiInterceptors,
});
```

业务代码直接调用已配置的服务单例：

```ts
const response = await serviceApi.<generatedMethod>(...args);
```

生成的方法支持在最后一个参数传入 Axios 请求配置：

```ts
const abortController = new AbortController();

const response = await serviceApi.<generatedMethod>(
  ...args,
  {
    signal: abortController.signal,
    timeout: 15_000,
  },
);
```

## 多服务单例

`apiInterceptors` 使用结构化类型，可直接传给同一 CLI 生成的多个客户端：

```ts
import { ApiClient as FirstApiClient } from '@/api/<first-service>';
import { ApiClient as SecondApiClient } from '@/api/<second-service>';
import { apiInterceptors } from '@/fetch';

export const firstServiceApi = new FirstApiClient({
  interceptors: apiInterceptors,
});

export const secondServiceApi = new SecondApiClient({
  interceptors: apiInterceptors,
});
```

服务专属的 `baseURL`、`timeout` 或 `withCredentials` 等配置也在创建单例时传入。

> [!IMPORTANT]
> 不要在 `src/api/<service>` 生成目录中添加单例或手写逻辑。重新执行 CLI 生成命令时，这些目录可能被覆盖。

> [!WARNING]
> 不要对已配置的服务单例调用 `clearInterceptors()`。该方法会清除公共鉴权、语言和宿主错误处理，并只恢复生成器默认拦截器。

## 请求拦截器

每次请求会动态读取当前状态并注入：

| 请求头            | 来源                 | 行为                                  |
| ----------------- | -------------------- | ------------------------------------- |
| `Authorization`   | `@asiainfo/auth`     | 存在可用 token 时设置 `Bearer` 认证头 |
| `Accept-Language` | `usePreferenceStore` | 使用当前界面语言                      |

`Authorization` 依赖鉴权组件注册的 token provider。请求发生在鉴权初始化之前时，拦截器不会注入认证头。

## 错误处理

所有响应错误都会转换为 `RequestError<TData>`：

```ts
export interface RequestError<TData = unknown> {
  message: string;
  status?: number;
  code?: string;
  data?: TData;
  raw?: unknown;
}
```

```ts
import type { RequestError } from '@/fetch';

try {
  await serviceApi.<generatedMethod>(...args);
} catch (error) {
  const requestError = error as RequestError;
  console.error(requestError.status, requestError.message);
}
```

错误消息按 `response.data.message`、`response.data.msg`、`response.data.error`、Axios 默认消息的顺序读取。原始 Axios 错误保留在 `raw` 中。

### 微前端环境

当 `window.__MICRO_APP_ENVIRONMENT__` 为真时，错误展示交给宿主：

```ts
window.microApp.dispatch({
  type: 'showErrorMessage',
  params: {
    status,
    errorCode,
    httpMethod,
    rawUrl,
    placeholderMapping,
  },
  errorMsg,
});
```

| 字段                 | 来源                                     |
| -------------------- | ---------------------------------------- |
| `status`             | HTTP 响应状态码                          |
| `errorCode`          | 响应体 `code`，不存在时使用 Axios 错误码 |
| `httpMethod`         | 大写的请求方法                           |
| `rawUrl`             | Axios 请求配置中的原始 URL               |
| `placeholderMapping` | 响应体 `args` 对象                       |
| `errorMsg`           | 响应体 `message` 或 `msg`                |

宿主消息派发后，Promise 仍会 reject `RequestError`，因此业务逻辑可以继续执行清理、回滚或页面状态恢复。

> [!NOTE]
> 微前端标识存在但 `window.microApp` 尚未就绪时，会跳过宿主派发，不会用通信错误覆盖原始请求错误。

### 独立应用环境

非微前端环境下，拦截器会按状态码分流：

| 状态  | 行为                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401` | 调用 `handleSessionExpired()`：清理 `useUserStore`、提示 `fetch:Http_401`、Keycloak 启用时走注册的 logout，否则跳转 `/login`。并发 401 去重，只处理一次；不再弹通用错误 Toast。 |
| 其他  | 经 `notifyStandaloneFetchError` 限流后展示 `window.$message.error`，并 reject `RequestError`                                                                                    |

`AppAuthProvider` 在 Keycloak 启用时通过 `registerSessionLogoutHandler` 将 `logout` 注入请求层，避免拦截器依赖 React Hook。

业务侧仍会收到 reject 的 `RequestError`，可按需做局部清理；全局会话恢复由拦截器统一完成，页面内不必再手写跳转登录。

### 错误提示限流

独立环境 Toast 与微前端 `dispatchMicroErrorMessage` 共用 leading 限流（默认 2s，见 `FETCH_ERROR_NOTIFY_INTERVAL_MS`）：

- 窗口内**首次**错误立即提示 / 派发
- 窗口内后续错误**静默**（Promise 仍 reject）
- 避免服务崩溃、网关不可用时页面或宿主连环报错

`AntdAppProvider` 额外将 Message `maxCount` 设为 `2`，作为 UI 层兜底。

## 响应解包

生成客户端默认将 Axios `response` 解包为 `response.data`。公共拦截器不定义 `response.onFulfilled`，以保留这一行为和生成方法的返回类型。

> [!WARNING]
> 不要在公共拦截器中手动返回 `response.data.data`。如果后端使用 `{ code, message, data }` 统一包装并希望返回内层 `data`，应在 CLI 配置中设置 `responseWrapper`，使运行时结果与生成类型保持一致。

## 模块结构

| 文件                                                              | 职责                        |
| ----------------------------------------------------------------- | --------------------------- |
| [`src/fetch/index.ts`](../src/fetch/index.ts)                     | 导出公共拦截器和错误 API    |
| [`src/fetch/interceptors.ts`](../src/fetch/interceptors.ts)       | 通用请求头和响应错误拦截器  |
| [`src/fetch/http-error.ts`](../src/fetch/http-error.ts)           | 请求错误类型和标准化逻辑    |
| [`src/fetch/error-notify.ts`](../src/fetch/error-notify.ts)       | 全局错误提示 leading 限流   |
| [`src/fetch/session-expired.ts`](../src/fetch/session-expired.ts) | 独立环境 401 / 会话失效处理 |

## 开发检查

```bash
pnpm typecheck
pnpm exec oxlint --deny-warnings src/fetch src/utils/micro.ts
pnpm exec oxfmt --check src/fetch src/utils/micro.ts readme/Fetch.md
```
