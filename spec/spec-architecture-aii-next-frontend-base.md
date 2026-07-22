---
title: AII-NEXT 前端基座架构规范
version: 1.1
date_created: 2026-07-16
last_updated: 2026-07-22
owner: AII-NEXT 维护团队
tags: [architecture, design, app, micro-frontend, react]
---

# Introduction

本规范定义 **AII-NEXT**（亚信 BSS 前端基座）的架构要求、运行模式、模块边界与集成契约。AII-NEXT 基于 React 19、Vite 8、Ant Design 6 与 TanStack Router，**主身份是 micro-app 微前端子应用（Child App）**：生产路径下由宿主提供门户壳、会话与偏好，子应用交付业务路由与领域 UI。独立运行模式是无宿主时的**开发 / 演示壳**，不是对等产品形态。

## 1. Purpose & Scope

### 目的

- 为新建或迁移的 BSS 前端业务提供**可复用的子应用基座**与**一致的开发约定**。
- 明确宿主（SoT）与子应用的职责边界，以及独立开发壳下的行为差异与数据契约。
- 约束路由、鉴权、布局、API 调用、列表页、弹层等横切能力的实现方式，降低业务团队重复造轮子。

### 范围

本规范适用于：

- 基于 AII-NEXT 模板创建的新前端工程。
- 在 AII-NEXT 上新增业务路由、菜单、列表页、弹窗/抽屉的业务开发。
- 将 AII-NEXT 作为 micro-app 子应用接入宿主（Host）的集成工作。

本规范**不**覆盖：

- 后端 API 的业务语义与领域模型设计。
- 宿主（Host）应用的实现细节（仅定义子应用侧契约）。
- 具体业务页面的 UI 视觉稿与交互细节。

### 受众

- 前端业务开发工程师
- 微前端宿主集成工程师
- 代码审查与架构评审人员
- 使用 Generative AI 辅助开发的工具链

### 假设

- 运行环境为 Node.js 20+、pnpm 9+。
- 独立开发模式下可选配置内网 Keycloak（三项 env 齐全才启用）与后端网关。
- 微前端模式下宿主已通过 `microApp.setGlobalData` 下发用户与偏好数据。

## 2. Definitions

| 术语                               | 定义                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| **AII-NEXT**                       | 亚信 BSS 前端基座工程，本仓库所代表的 React 应用模板。                                             |
| **BSS**                            | Business Support System，业务支撑系统。                                                            |
| **Host / 宿主**                    | 通过 micro-app 加载子应用的主应用。                                                                |
| **Child App / 子应用**             | 被 micro-app 嵌入的 AII-NEXT 实例。                                                                |
| **Standalone Mode / 独立模式**     | 子应用不在 micro-app 环境中运行时的开发 / 演示壳，具备完整布局与本地 Keycloak 鉴权；非生产主路径。 |
| **Micro Mode / 微前端模式**        | 检测到 `window.__MICRO_APP_ENVIRONMENT__` 为真时的运行形态。                                       |
| **App Shell / 布局壳**             | 由 `AppLayout`、`AppHeader`、`AppMenu` 等组成的应用级 UI 框架。                                    |
| **File Route / 文件路由**          | 位于 `src/routes/` 下、由 TanStack Router 插件自动生成的路由定义。                                 |
| **List Page Pattern / 列表页模式** | `AIISearch` + `useTable` + `AIITable` 的标准组合。                                                 |
| **Preference**                     | 用户偏好：语言（locale）、主题（theme）、品牌色（brandColor）等。                                  |
| **Swagger Client**                 | 由 `swagger-to-ts-axios` 根据 OpenAPI/Swagger 生成的 TypeScript API 客户端。                       |

## 3. Requirements, Constraints & Guidelines

### 架构要求

- **REQ-001**: 应用 MUST 支持独立模式与微前端模式，且模式检测 MUST 基于 `isMicroAppEnvironment()`（即 `window.__MICRO_APP_ENVIRONMENT__`），不得在业务代码中硬编码运行模式分支以外的环境判断。
- **REQ-002**: 微前端模式下 MUST 暴露 `window.mount` 与 `window.unmount` 生命周期，供 micro-app 挂载与卸载 React 根节点。
- **REQ-003**: 路由 MUST 使用 TanStack Router 文件路由；路由树 MUST 由 `routeTree.gen.ts` 自动生成，业务不得手改生成文件。
- **REQ-004**: 受保护业务路由 MUST 挂载于 `/_app/_authentication` 路由组下，并在 `beforeLoad` 中调用 `requireAuthToken()`。
- **REQ-005**: 系统级页面（首页、403、iframe、通配 404）MUST 位于 `/_app/_system/*` 路由组。
- **REQ-006**: 微前端模式下路由 `basepath` MUST 使用 `getMicroAppBaseRoute()`；独立模式 MUST 使用 `import.meta.env.BASE_URL`。
- **REQ-007**: 全局 Provider 装配顺序 MUST 为：`ThemeRoot` → `I18nextProvider` → `AppAuthProvider` → `AntdProvider` → `AntdAppProvider` → `ModalProvider` → `DrawerProvider` → `IconParkProvider` → `RouterProvider`。
- **REQ-008**: 用户状态 MUST 由 Zustand `useUserStore` 管理；偏好 MUST 由 `usePreferenceStore` 管理。偏好与用户身份投影 MUST 持久化至 `sessionStorage`；Access Token MUST NOT 写入任何 Web Storage（见 COM-001），运行时 Token 由 `@asiainfo/auth` 或宿主 `globalData` 提供并缓存在内存态 `user.token`。
- **REQ-009**: HTTP 请求 MUST 通过 `src/fetch` 提供的 `apiInterceptors` 统一注入 `Authorization` 与 `Accept-Language`。
- **REQ-010**: 列表页 SHOULD 优先采用 `AIISearch` + `useTable` + `AIITable` 组合，不得重复实现分页/筛选/排序/行选择状态机。
- **REQ-011**: 业务弹窗与抽屉 SHOULD 通过 `ModalProvider` / `DrawerProvider` 命令式 API 打开，避免在页面层散落大量 `useState` 控制可见性。
- **REQ-012**: 文案 MUST 通过 i18next 管理，支持 `zh-CN` 与 `en-US`；禁止在 JSX 中硬编码面向用户的字符串（调试日志除外）。
- **REQ-013**: 品牌色修改 MUST 通过 `src/constants/brand.ts` 的 `BrandSeed` 定义，并执行 `pnpm theme:sync` 同步 Ant Design 与 Tailwind 主题产物。
- **REQ-014**: API 客户端 SHOULD 通过 `pnpm swagger-g` 从 Swagger 生成至 `src/api`，业务层不得手写与 OpenAPI 重复的 DTO 类型（生成类型可 re-export）。

### 安全要求

- **SEC-001**: Access Token MUST 优先从 `useUserStore` 同步缓存读取，其次通过 `@asiainfo/auth` 的 `resolveAuthToken()` 解析，避免路由守卫中的异步瀑布。
- **SEC-002**: 无有效 Token 时，受保护路由 MUST 重定向至 `/403`，不得静默放行。
- **SEC-003**: 独立开发模式下，当且仅当 `VITE_KEYCLOAK_URL` / `VITE_KEYCLOAK_REALM` / `VITE_KEYCLOAK_CLIENT_ID` 均已配置时，本地 Keycloak MUST 启用并使用 `login-required`；三项任一缺失时 MUST 关闭本地鉴权（`isAuthEnabled=false`），不得因空配置抛错阻断启动。微前端模式或生产构建下本地 Keycloak MUST 关闭（`enabled={false}`），由宿主或网关接管鉴权。
- **SEC-004**: 请求错误在微前端模式下 MUST 通过 `dispatchMicroErrorMessage` 交由宿主统一展示，子应用不得重复弹出全局错误 Toast（除非宿主未处理）。
- **SEC-005**: 敏感配置（Keycloak URL、Client Secret 等）MUST 通过环境变量注入，不得提交至版本库；`.env` MUST 被 gitignore。
- **SEC-006**: 独立应用环境下 API 返回 `401` 时 MUST 通过 `handleSessionExpired` 清理本地用户会话并引导重新登录（Keycloak 启用时调用注册的 logout，否则跳转 `/login`）；不得仅弹通用错误 Toast；并发 401 MUST 去重。微前端模式下 401 MUST 仍交由宿主处理，子应用不得本地跳转登录。
- **SEC-007**: 请求错误的全局提示（独立环境 Toast / 微前端 `dispatchMicroErrorMessage`）MUST 做 leading 限流（默认 2s），避免服务不可用时短时间连环弹窗；限流不得吞掉 Promise reject。

### 布局与菜单

- **LAY-001**: 微前端模式下 `AppLayout` MUST 仅渲染内容区（`<main>` + `Outlet`），不得渲染 `AppHeader` 与 `AppMenu`。
- **LAY-002**: 独立模式下，当 `src/layout/utils/menu.ts` 导出菜单数组为空时，MUST 渲染无侧栏布局（仅顶栏 + 内容区）。
- **LAY-003**: 独立模式下，当菜单非空时 MUST 渲染顶栏 + 侧栏（240px，`md` 断点以上）+ 内容区栅格布局。
- **LAY-004**: 菜单项类型 MUST 符合 `System.MenuOptions`：`key`、`label`、可选 `icon`、`path`/`link`、`children`。
- **LAY-005**: 内容区 MUST 提供 `BackTopButton`，滚动容器为 `<main>` 元素引用。

### 微前端集成

- **MIC-001**: 子应用 MUST 在挂载时调用 `syncMicroAppPreferenceFromHost()`，并在运行时通过 `useMicroAppData()` 监听宿主全局数据变更。
- **MIC-002**: 宿主下发的 `MicroAppGlobalData` MUST 映射至本地 `useUserStore` 与 `usePreferenceStore`（用户身份、语言、主题、品牌色、按钮权限）。宿主局部更新未携带 `permissionsButton` 时 MUST 保留本地已有权限列表。
- **MIC-003**: 子应用向宿主发送的错误消息 MUST 使用 `{ type: 'showErrorMessage', params, errorMsg }` 结构。
- **MIC-004**: 微前端环境下品牌色 MUST 以宿主下发的 `brandColor` 为准；独立环境下品牌色 MUST 以本地 `BrandSeed` 为准。
- **ACL-001**: 按钮级权限 MUST 通过 `PermissionsButton.menuCode` 匹配；业务 SHOULD 使用 `Access` / `useAccess` / `hasPermission`，不得在页面内重复实现权限比对。
- **ACL-002**: 当 `user.permissionsButton` 为 `undefined` 时，ACL MUST 视为未启用并放行；当其为数组（含空数组）时 MUST 按列表鉴权。
- **ACL-003**: `AIITable` 的 `toolbar` / `rowActions` / `batchActions` 若配置 `permission`，无权限时 MUST 隐藏对应操作。

### 约束

- **CON-001**: 业务代码 MUST 使用 `@/` 路径别名引用 `src/` 下模块，不得使用超过两层的相对路径穿越。
- **CON-002**: 新增路由文件 MUST 遵循 TanStack Router 文件命名约定（`createFileRoute`、layout route 使用 `_` 前缀）。
- **CON-003**: 不得直接修改 `routeTree.gen.ts`；路由类型注册 MUST 保留 `Register` 模块扩展。
- **CON-004**: Zustand store slice MUST 遵循项目既有模式：`initialState` + `actions` + `flattenActions` + `devtools`/`persist` 中间件。
- **CON-005**: 构建前 MUST 通过 `pnpm typecheck`；CI 中 SHOULD 包含 `lint` 与 `format:check`。
- **CON-006**: Ant Design 与 Tailwind 并存时，布局与间距 SHOULD 优先 Tailwind；Ant Design 组件样式 SHOULD 通过 Design Token / `antd-theme` 定制，不得大量覆盖全局 CSS。

### 指南

- **GUD-001**: 新业务页面 SHOULD 放在 `/_app/_authentication/` 下，按功能域分子目录。
- **GUD-002**: 列表接口字段若与默认约定（`current`/`pageSize` → `list`/`total`）不一致，SHOULD 通过 `useTable` 的 `fieldNames` 或 `mapPayload`/`mapResponse` 适配，而非在组件内手动拼装。
- **GUD-003**: 404 与全局错误 SHOULD 使用 `-DefaultNotFound`、`-DefaultCatchBoundary`、`-DefaultForbidden` 等共享边界组件。
- **GUD-004**: 动效 SHOULD 使用 `motion/react` 并遵循项目 `motion-tokens` 与 `motion-config` 约定。
- **GUD-005**: 组件专题用法 SHOULD 参考 `readme/` 目录文档，而非在规范中重复展开。

### 模式

- **PAT-001**: **Provider 组合模式** — 横切能力通过 Provider 注入，业务组件保持纯净。
- **PAT-002**: **Route Guard 模式** — 鉴权在路由 `beforeLoad` 层完成，页面组件假设已通过守卫。
- **PAT-003**: **Generated API + Interceptor 模式** — Swagger 生成客户端 + 统一拦截器处理鉴权头与错误归一化。
- **PAT-004**: **List Page Trinity 模式** — Search（查询 UI）→ Hook（请求状态）→ Table（展示与交互）。
- **PAT-005**: **Host Sync 模式** — 微前端下偏好与用户态以宿主为 Source of Truth，本地 store 为投影。

## 4. Interfaces & Data Contracts

### 4.1 路由结构

```text
/__root                          # 根布局、全局错误边界
/_app                            # AppLayout 布局壳
  /_authentication               # requireAuthToken 守卫
    /{business}/...              # 需登录的业务页面
  /_system
    /                            # 首页
    /403                         # 无权限
    /iframe/$slug                # 内嵌 iframe 页
    /$                           # 通配 404
```

### 4.2 运行模式矩阵

> 生产主路径为**微前端模式**；独立模式列描述的是开发 / 演示壳行为。

| 能力                | 独立开发模式                    | 微前端模式                 | 独立生产构建         |
| ------------------- | ------------------------------- | -------------------------- | -------------------- |
| Keycloak 本地登录   | 配置齐全时启用，否则关闭        | 禁用                       | 禁用                 |
| AppHeader / AppMenu | 启用（菜单空则无侧栏）          | 禁用                       | 同独立               |
| 路由 basepath       | `BASE_URL`                      | `__MICRO_APP_BASE_ROUTE__` | `BASE_URL`           |
| 用户 Token 来源     | Keycloak + UserStore            | 宿主 globalData            | 网关/宿主            |
| 主题/语言来源       | 本地 PreferenceStore            | 宿主同步 + 本地持久化      | 本地 PreferenceStore |
| 全局错误展示        | Ant Design Message/Notification | 宿主 `showErrorMessage`    | 同独立               |

### 4.3 宿主全局数据契约（MicroAppGlobalData）

```typescript
type MicroAppGlobalData = {
  userInfo?: {
    userId?: number | string;
    userIdStr?: string;
    userName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    token?: string;
    avatar?: string;
    locale?: string;
  };
  lang?: string; // 语言，如 'zh-CN' | 'en-US'
  theme?: string; // 主题模式
  brandColor?: {
    colorPrimary: string;
    colorSuccess: string;
    colorWarning: string;
    colorError: string;
  };
  permissionsButton?: PermissionsButton[];
} & Record<string, unknown>;
```

**映射规则**：

| 宿主字段                   | 本地目标                 | 说明                                                |
| -------------------------- | ------------------------ | --------------------------------------------------- |
| `userInfo`（含 identity）  | `useUserStore.setUser`   | 必须含 `userIdStr`/`userId`/`userName`/`token` 之一 |
| `userInfo`（空 identity）  | `useUserStore.clearUser` | 显式清空                                            |
| `lang` / `userInfo.locale` | `preference.locale`      | 经 `normalizeLang` 归一化                           |
| `theme`                    | `preference.theme`       | 经 `resolveHostTheme` 解析                          |
| `brandColor`               | `preference.brandColor`  | 仅微前端模式应用                                    |
| `permissionsButton`        | `user.permissionsButton` | 按钮级权限；未携带该字段时保留本地已有列表          |

### 4.4 子应用 → 宿主错误消息

```typescript
// dispatchMicroData / microApp.dispatch
{
  type: 'showErrorMessage',
  params: {
    status?: number;
    errorCode?: unknown;
    httpMethod?: string;
    rawUrl?: string;
    placeholderMapping?: Record<string, unknown>;
  },
  errorMsg?: string;
}
```

### 4.5 菜单配置（System.MenuOptions）

```typescript
interface MenuOptions {
  key: string; // 唯一标识
  label: string; // 展示文案（应 i18n 化）
  icon?: string; // IconPark 图标名
  path?: string; // 应用内路由
  link?: string; // 外部链接
  children?: MenuOptions[];
}
```

### 4.6 HTTP 请求拦截契约

**请求头（每个 API 请求自动附加）**：

| Header            | 来源                                   |
| ----------------- | -------------------------------------- |
| `Authorization`   | `resolveAuthorizationHeader()`         |
| `Accept-Language` | `usePreferenceStore.getState().locale` |

**错误归一化**：所有失败响应 MUST 经 `normalizeRequestError` 转为统一错误对象后再 `reject`。

**独立环境 401**：MUST 调用 `handleSessionExpired()`（见 SEC-006），由 `SessionLogoutBridge` 在 Keycloak 启用时注册 `registerSessionLogoutHandler`。

### 4.7 useTable 默认分页契约

**请求（默认 fieldNames）**：

```json
{
  "current": 1,
  "pageSize": 10
}
```

**响应（默认 fieldNames）**：

```json
{
  "list": [],
  "total": 0
}
```

可通过 `fieldNames`、`mapPayload`、`mapResponse` 覆盖。

### 4.8 环境变量

| 变量                      | 必填               | 说明                                                          |
| ------------------------- | ------------------ | ------------------------------------------------------------- |
| `VITE_APP_NAME_ZH`        | 是                 | 中文应用名                                                    |
| `VITE_APP_NAME_EN`        | 是                 | 英文应用名                                                    |
| `VITE_API_BASE_URL`       | 否                 | API 基础路径，默认 `/`                                        |
| `VITE_KEYCLOAK_URL`       | 启用本地登录时必填 | Keycloak 服务地址；与 Realm、Client ID 同时配置才开启本地鉴权 |
| `VITE_KEYCLOAK_REALM`     | 启用本地登录时必填 | Realm                                                         |
| `VITE_KEYCLOAK_CLIENT_ID` | 启用本地登录时必填 | Client ID                                                     |

## 5. Acceptance Criteria

- **AC-001**: Given 独立开发环境且 Keycloak 三项 env 已配置，When 访问 `/_app/_authentication` 下任意路由，Then 未登录用户被引导至 Keycloak 登录，登录成功后可访问业务页。
- **AC-001a**: Given 独立开发环境且 Keycloak env 未配置，When 启动应用，Then 不抛 Keycloak 配置错误，且可访问示例业务页（本地鉴权关闭、守卫放行）。
- **AC-002**: Given 用户无有效 Token，When `beforeLoad` 执行 `requireAuthToken()`，Then 重定向至 `/403`。
- **AC-003**: Given 微前端环境（`__MICRO_APP_ENVIRONMENT__ === true`），When 应用挂载，Then 不渲染 Header/Sidebar，且 `window.mount`/`window.unmount` 可正常挂载卸载 React 树。
- **AC-004**: Given 宿主通过 `setGlobalData` 下发 `userInfo.token` 与 `lang`，When 子应用 `useMicroAppData` 生效，Then `useUserStore` 与 `usePreferenceStore` 与宿主数据一致。
- **AC-005**: Given 微前端模式下 API 返回 4xx/5xx，When 拦截器处理错误，Then 调用 `dispatchMicroErrorMessage` 且子应用不重复弹出全局错误。
- **AC-005a**: Given 独立应用模式且 API 返回 401，When 拦截器处理错误，Then 清理 `useUserStore`、提示会话过期，并跳转 `/login`（或执行 Keycloak logout）；同一时间窗口内多次 401 仅触发一次恢复流程。
- **AC-006**: Given `menu.ts` 导出空数组，When 独立模式渲染布局，Then 仅显示顶栏与内容区，无侧栏。
- **AC-007**: Given 修改 `BrandSeed` 并执行 `theme:sync`，When 刷新页面，Then Ant Design 主色与 Tailwind CSS 变量同步更新。
- **AC-008**: Given 标准列表 API，When 使用 `useTable(api.listX)` + `AIITable`，Then 首屏自动请求、分页切换触发新请求、过期响应被忽略。
- **AC-009**: Given `pnpm build` 成功，When 部署 `dist/` 静态资源，Then 应用可在配置的路径下独立访问或通过 micro-app 加载。
- **AC-010**: Given 新增路由文件于 `src/routes/`，When 开发服务运行或构建，Then `routeTree.gen.ts` 自动更新且 `pnpm typecheck` 通过。

## 6. Test Automation Strategy

- **Test Levels**
  - **Unit**: 工具函数（`auth-guard`、`micro` 数据映射、`use-table.utils` 归一化）、Store actions、纯函数 theme/locale 解析。
  - **Integration**: Provider 组合渲染、路由守卫跳转、拦截器头注入与错误分发（mock axios / microApp）。
  - **End-to-End**: 独立模式登录流、受保护路由 403、列表页查询-分页、微前端 mount 与宿主数据同步（需 Playwright + micro-app 测试宿主）。

- **Frameworks**: Vitest（单元/集成，与 Vite 生态一致）；Playwright 或 Cypress（E2E，待项目引入时选用）。

- **Test Data Management**: API 层使用 MSW 或 Vitest mock 固定 JSON fixture；Keycloak 在 E2E 中使用测试 Realm 或 mock `@asiainfo/auth`。

- **CI/CD Integration**: PR 流水线 SHOULD 执行 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`；合并主分支前 SHOULD 跑单元测试（引入后）。

- **Coverage Requirements**: 核心工具（`auth-guard`、`micro`、`use-table.utils`、`fetch/interceptors`）行覆盖率目标 ≥ 80%（测试框架就绪后生效）。

- **Performance Testing**: 列表页首屏与翻页响应时间 SHOULD 在开发环境 Network 节流下 < 3s（依赖后端 SLA）；构建产物主包 SHOULD 遵循 Vite manualChunks 分包策略，避免单 chunk 过大。

## 7. Rationale & Context

- **双模式基座（子应用为主）**：BSS 业务以嵌入统一门户为生产路径；独立模式仅用于本地开发与演示。通过 `isMicroAppEnvironment()` 单一开关裁剪壳与鉴权，避免维护两套代码库。宿主为用户 / 偏好 / 全局错误的 Source of Truth，子应用 store 为投影。
- **路由层鉴权**：在 TanStack Router `beforeLoad` 守卫鉴权可阻止未授权页面的数据请求与闪烁，优于仅在组件 `useEffect` 中检查。
- **列表页三位一体**：后台管理系统 70%+ 页面为列表 CRUD；统一 `AIISearch` + `useTable` + `AIITable` 可显著降低重复代码与分页 bug。
- **Swagger 生成客户端**：保证前后端契约一致，减少手写类型漂移；拦截器集中处理横切 concern。
- **主题双向同步**：Ant Design Token 与 Tailwind v4 CSS 变量同源（`BrandSeed` + `theme:sync`），避免设计系统分裂。
- **微前端错误上抛**：子应用 UI 空间有限且需与宿主体验一致，全局错误由宿主统一处理可避免重复 Toast 与样式冲突。

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: Keycloak — 独立开发模式 OIDC 身份提供方；集成类型为浏览器端 `keycloak-js` + `@asiainfo/auth`。
- **EXT-002**: BSS 后端网关 — REST API 数据源；集成类型为 HTTPS + Swagger 契约。
- **EXT-003**: micro-app Host — 微前端宿主；集成类型为 JS 沙箱 + `window.microApp` 数据总线。

### Third-Party Services

- **SVC-001**: `@asiainfo/auth` — 封装 Keycloak 初始化、Token 解析与 Authorization Header；需在独立开发环境可用。
- **SVC-002**: 内网 npm/Git 源 — 托管 `@asiainfo/*` 私有包；安装依赖时必须可达。

### Infrastructure Dependencies

- **INF-001**: 静态资源服务器或 CDN — 部署 `dist/` 产物；支持 SPA fallback 或 micro-app 子路径。
- **INF-002**: 开发代理（Vite `server.proxy`） — 将 `/bss/*` 等路径转发至内网网关，解决 CORS。

### Data Dependencies

- **DAT-001**: OpenAPI/Swagger 文档 — 配置于 `api.swagger.config.ts`；格式 JSON/YAML；变更时重新 `pnpm swagger-g`。
- **DAT-002**: i18n 文案 — `locales/zh-CN`、`locales/en-US`；随功能增量维护。

### Technology Platform Dependencies

- **PLT-001**: Node.js ≥ 20 — 构建与开发运行时。
- **PLT-002**: React 19 + Vite 8 — 应用运行时与打包。
- **PLT-003**: TanStack Router — 文件路由与类型安全导航。
- **PLT-004**: Ant Design 6 + Tailwind CSS 4 — UI 与样式体系。
- **PLT-005**: Zustand — 轻量全局状态。

### Compliance Dependencies

- **COM-001**: 企业内网安全策略 — Access Token MUST NOT 持久化至 `localStorage` 或 `sessionStorage`（`useUserStore` persist 时 MUST 剥离 `token`；偏好与非敏感身份可存 `sessionStorage`；运行时 Token 由 auth 库或宿主下发）；生产环境 HTTPS。

**Note**: 本章节描述架构依赖，不绑定具体 patch 版本；版本以 `package.json` 为准。

## 9. Examples & Edge Cases

### 9.1 新增受保护业务路由

可参考内置示例页 `src/routes/_app/_authentication/demo/users.tsx`（侧栏「示例 → 示例用户」）。

```typescript
// src/routes/_app/_authentication/orders/index.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_authentication/orders/')({
  component: OrdersPage,
});

function OrdersPage() {
  // 已通过 _authentication 守卫，可直接请求 API
  return <OrderList />;
}
```

### 9.2 配置侧栏菜单

```typescript
// src/layout/utils/menu.ts
const menu = [
  {
    key: 'orders',
    label: '订单管理',
    icon: 'Order',
    path: '/orders',
  },
] satisfies System.MenuOptions[];

export default menu;
```

### 9.3 微前端挂载入口（已实现，勿重复实现）

```typescript
// main.tsx — 子应用由宿主调用 window.mount()
window.mount = renderApp;
window.unmount = unmountApp;

if (!isMicroAppEnvironment()) {
  renderApp();
}
```

### 9.4 边缘情况

| 场景                                   | 预期行为                                                         |
| -------------------------------------- | ---------------------------------------------------------------- |
| 宿主下发 `userInfo` 但无 identity 字段 | 调用 `clearUser()`，不保留 stale 用户                            |
| 独立模式 `menu` 为空                   | 无侧栏，仍有顶栏                                                 |
| 微前端 + 本地 Keycloak 同时存在        | Keycloak MUST 禁用，避免双登录                                   |
| `useTable` 快速切换分页                | 仅最新 request 结果生效（过期忽略）                              |
| API 字段为嵌套路径如 `data.records`    | 使用 `fieldNames: { list: 'data.records', total: 'data.total' }` |
| 生产构建无 Keycloak 环境变量           | 构建可成功；运行时鉴权由网关/宿主负责                            |
| 路由未匹配                             | 落入 `/_app/_system/$` 通配 404                                  |

## 10. Validation Criteria

合规性检查清单：

- [ ] 业务路由是否位于正确的 `_authentication` / `_system` 分组下
- [ ] 是否使用 `@/` 别名与既定 Provider/Router 结构
- [ ] 用户可见文案是否进入 i18n 资源文件
- [ ] API 是否经生成客户端 + `apiInterceptors` 调用
- [ ] 列表页是否复用 `useTable` / `AIITable` 而非自建分页逻辑
- [ ] 微前端相关逻辑是否经 `utils/micro` 与 `useMicroAppData` 统一处理
- [ ] 品牌/主题变更是否走 `BrandSeed` + `theme:sync`
- [ ] `useUserStore` persist 是否剥离 `token`，且未将 Token 写入 Web Storage
- [ ] 独立开发 `isAuthEnabled` 是否为 `!(micro || PROD) && hasKeycloakEnv()`，空 Keycloak 配置时不得启动报错
- [ ] `pnpm typecheck`、`pnpm lint`、`pnpm format:check`（或 `pnpm validate`）是否通过
- [ ] 是否无 `.env` 或密钥文件被提交
- [ ] 提交是否经过 Husky pre-commit / commit-msg（未无故跳过 hooks）

## 11. Related Specifications / Further Reading

- [AII-NEXT README](../README.md) — 项目概览、快速开始、环境变量
- [列表页开发规范（查询展示与 CRUD）](./spec-process-crud-list-page.md) — 列表页能力档位、只读展示与完整 CRUD 约定
- [国际化文案规范](./spec-process-i18n-locale.md) — 文案文件归属、扁平 Key、复用与公共/独有决策
- [代码质量与提交校验规范](./spec-process-lint-format-commit.md) — Oxlint / Oxfmt、Husky 门禁、Commitlint
- [AIITable 组件文档](../readme/AIITable.md)
- [AIISearch 组件文档](../readme/AIISearch.md)
- [useTable Hook 文档](../readme/useTable.md)
- [Fetch / 拦截器文档](../readme/Fetch.md)
- [ModalProvider 文档](../readme/ModalProvider.md)
- [Access 按钮权限文档](../readme/Access.md)
- [micro-app 官方文档](https://jd-opensource.github.io/micro-app/docs.html)
- [TanStack Router 文件路由](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
