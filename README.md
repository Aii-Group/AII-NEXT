<div align="center">
  <img src="./public/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# AII-NEXT

亚信 BSS **微前端子应用**基座：基于 React + Vite + Ant Design，作为 [micro-app](https://jd-opensource.github.io/micro-app/) Child App 嵌入宿主；本地也可独立运行以便开发与演示。

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-3c873a?style=flat-square)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9+-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Ant Design](https://img.shields.io/badge/Ant_Design-6-1677FF?style=flat-square&logo=antdesign&logoColor=white)](https://ant.design)

[概览](#概览) · [快速开始](#快速开始) · [环境变量](#环境变量) · [常用脚本](#常用脚本) · [项目结构](#项目结构) · [规范](#规范) · [组件文档](#组件文档) · [技术栈](#技术栈)

</div>

## 概览

AII-NEXT 是面向业务管理系统的 **micro-app 子应用工程模板**。生产路径下由宿主提供门户壳、登录会话与主题/语言等偏好；本仓库交付业务路由、列表页模式、请求拦截与领域 UI。本地独立运行用于无宿主时的开发与演示，不是对等产品形态。

运行方式：

- **微前端子应用（主路径）**：检测到 `window.__MICRO_APP_ENVIRONMENT__` 后，跳过本地 Keycloak 与宿主级布局，仅渲染业务内容；从宿主 `globalData` 同步用户、权限、主题与语言；请求错误上抛宿主。
- **独立开发壳**：本地带完整顶栏 / 侧栏；配置齐全时启用 Keycloak（`login-required`），未配置则关闭鉴权便于直接演示。

核心能力：

| 能力     | 说明                                                                   |
| -------- | ---------------------------------------------------------------------- |
| 文件路由 | TanStack Router 文件路由 + 自动代码分割                                |
| 鉴权     | 宿主 Token / `@asiainfo/auth` + Keycloak；微前端与生产构建关闭本地登录 |
| 按钮权限 | `Access` / `useAccess`，匹配宿主 `permissionsButton.menuCode`          |
| UI 体系  | Ant Design 6 + Tailwind CSS v4，品牌色通过 `theme:sync` 双向同步       |
| 状态     | Zustand：用户与偏好投影（`sessionStorage`；Token 不落盘）              |
| 国际化   | i18next，内置 `zh-CN` / `en-US`                                        |
| 列表页   | `AIISearch` + `useTable` + `AIITable` 组合覆盖查询、请求与表格         |
| API      | `swagger-to-ts-axios` 生成客户端，`src/fetch` 统一拦截器               |
| 弹层     | `ModalProvider` / `DrawerProvider` 命令式打开业务弹窗与抽屉            |

> [!TIP]
> 架构与过程约定见 [`spec/`](./spec/)；组件与请求层用法见 [`readme/`](./readme/)。

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 20+（推荐 LTS）
- [pnpm](https://pnpm.io/) 9+
- 可访问内网依赖源（含 `@asiainfo/auth` 与后端 / Keycloak）

### 安装与启动

```bash
pnpm install
pnpm dev
```

开发服务默认监听 `http://0.0.0.0:3000`，并自动打开浏览器。`dev` / `build` 会先执行 `theme:sync`，将 Ant Design 品牌色同步到 Tailwind 主题变量。

生产构建与预览：

```bash
pnpm build
pnpm preview
```

> [!IMPORTANT]
> `.env` 已被 gitignore。本地需自行准备应用名称等变量；开发鉴权相关配置见 `.env.development`。

## 环境变量

| 变量                      | 用途                                  |
| ------------------------- | ------------------------------------- |
| `VITE_APP_NAME_ZH`        | 中文应用名（页面标题等）              |
| `VITE_APP_NAME_EN`        | 英文应用名                            |
| `VITE_API_BASE_URL`       | API 基础路径，开发 / 生产默认可为 `/` |
| `VITE_KEYCLOAK_URL`       | Keycloak 服务地址                     |
| `VITE_KEYCLOAK_REALM`     | Keycloak Realm                        |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak Client ID                    |

开发代理在 `vite.config.ts` 中配置，例如将 `/bss/sysmgnt` 转发到内网网关。按实际后端地址调整 `server.proxy`。

鉴权开关逻辑：微前端或 `PROD` 构建下本地 Keycloak 关闭（由宿主或网关接管）。独立开发仅在 `.env.development` 中同时配置了 `VITE_KEYCLOAK_URL` / `REALM` / `CLIENT_ID` 时启用 `login-required`；未配置时关闭鉴权，可直接打开示例页，不会因缺少 Keycloak 配置报错。

## 常用脚本

| 命令                                | 说明                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                          | 同步主题并启动开发服务器                               |
| `pnpm build`                        | 同步主题、类型检查并构建                               |
| `pnpm preview`                      | 预览生产构建                                           |
| `pnpm typecheck`                    | 仅执行 TypeScript 项目引用检查                         |
| `pnpm lint`                         | Oxlint 检查（warning 视为失败）                        |
| `pnpm format` / `pnpm format:check` | Oxfmt 格式化 / 检查                                    |
| `pnpm validate`                     | 提交前同款全量校验：typecheck + lint + format:check    |
| `pnpm theme:sync`                   | 根据 `BrandSeed` 生成 Ant Design ↔ Tailwind 主题产物   |
| `pnpm swagger-g`                    | 按 `api.swagger.config.ts` 生成 API 客户端到 `src/api` |

修改品牌色时，编辑 `src/constants/brand.ts` 中的 `BrandSeed`，再执行 `pnpm theme:sync`（或直接 `pnpm dev` / `pnpm build`）。

提交前质量门禁摘要（完整要求见 [代码质量与提交校验规范](./spec/spec-process-lint-format-commit.md)）：

- 配置：`.oxlintrc.json`、`.oxfmtrc.json`、`commitlint.config.mjs`
- Hook：`.husky/pre-commit`（敏感文件 → lint-staged → 条件 typecheck → 全量 lint → format:check）、`.husky/commit-msg`
- 手动全量：`pnpm validate`
- 编辑器：推荐 Oxc 扩展（`.vscode` 已配置）

## 项目结构

```text
├── locales/                 # i18n 文案（zh-CN / en-US）
├── public/                  # 静态资源（logo、silent-check-sso 等）
├── readme/                  # 组件与工具专题文档
├── spec/                    # 架构与过程规范（AI / 人工共用）
├── scripts/                 # 主题同步等脚本
├── src/
│   ├── api/                 # Swagger 生成的 API 客户端
│   ├── components/          # AIITable、AIISearch、AIITab、StatusPage、Wrapper
│   ├── constants/           # 品牌色、主题、本地化、请求常量
│   ├── fetch/               # Axios 拦截器、401 会话、错误限流
│   ├── features/            # 业务示例（如 demo-users Mock 列表页）
│   ├── hooks/               # useTable、useModal、微前端数据同步等
│   ├── i18n/                # i18next 初始化
│   ├── layout/              # 顶栏、侧栏、布局壳（微前端下裁剪）
│   ├── providers/           # Auth / Antd / Modal / Drawer / Theme
│   ├── routes/              # TanStack 文件路由
│   ├── store/               # Zustand（user / preference）
│   ├── theme/               # Ant Design 主题与 token 生成
│   └── utils/               # 鉴权守卫、微前端、dayjs 等工具
├── .oxlintrc.json           # Oxlint 规则配置
├── .oxfmtrc.json            # Oxfmt 格式化配置
├── api.swagger.config.ts    # swagger-to-ts-axios 配置
└── vite.config.ts           # 开发代理、分包与别名（@ → src）
```

路由约定概览：

- `/_app`：应用布局（`AppLayout`）
- `/_app/_authentication`：需要 token 的业务路由守卫
- `/_app/_authentication/demo/users`：示例用户列表页（本地 Mock）
- `/_app/_system/*`：系统页（首页、403、iframe、通配）

## 规范

| 文档                                                                   | 内容                                         |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| [前端基座架构规范](./spec/spec-architecture-aii-next-frontend-base.md) | 子应用边界、双模式矩阵、宿主契约、安全与验收 |
| [列表页开发规范](./spec/spec-process-crud-list-page.md)                | 查询展示与 CRUD 档位、`features/` 目录约定   |
| [国际化文案规范](./spec/spec-process-i18n-locale.md)                   | 文案文件归属、扁平 Key、公共 / 独有决策      |
| [代码质量与提交校验规范](./spec/spec-process-lint-format-commit.md)    | Oxlint / Oxfmt、Husky 门禁、Commitlint       |

Lint / Format 的权威约定见上述「代码质量与提交校验规范」；下文「常用脚本」仅作命令速查。

## 组件文档

| 文档                                       | 内容                                            |
| ------------------------------------------ | ----------------------------------------------- |
| [AIITable](./readme/AIITable.md)           | 业务表格封装：分页、固定表头、行选择、操作列    |
| [AIISearch](./readme/AIISearch.md)         | 响应式搜索表单：栅格、展开收起、查询重置        |
| [useTable](./readme/useTable.md)           | 列表请求适配：分页 / 筛选 / 排序 / 行选择       |
| [Fetch](./readme/Fetch.md)                 | 生成客户端的拦截器与错误处理约定                |
| [ModalProvider](./readme/ModalProvider.md) | 命令式业务弹窗：`open` / `close` / 提交 loading |
| [Access](./readme/Access.md)               | 按钮级权限：`Access` / `useAccess` / 表格集成   |

侧栏「示例 → 示例用户」对应路由 `/demo/users`，完整演示列表页三件套与弹窗 CRUD（本地 Mock，无需后端）。

典型列表页组合：

```tsx
import { AIISearch } from '@/components/AIISearch';
import { AIITable } from '@/components/AIITable';
import { useTable } from '@/hooks/use-table';

// AIISearch 负责查询条件 → useTable 请求与状态 → AIITable 展示
```

## 技术栈

- **运行时**：React 19、Vite 8、TypeScript
- **路由**：TanStack Router（文件路由、自动代码分割）
- **UI**：Ant Design 6、Tailwind CSS 4、`@icon-park/react`、Motion
- **状态 / 数据**：Zustand、Axios、`swagger-to-ts-axios`
- **鉴权**：Keycloak（`keycloak-js` + `@asiainfo/auth`）
- **国际化**：i18next、react-i18next
- **微前端**：京东 micro-app（`window.mount` / `window.unmount`）
- **工程化**：Oxlint、Oxfmt、Husky、lint-staged、Commitlint

## FAQ

**本地启动后一直停在登录页？**

先确认 `.env.development` 中 `VITE_KEYCLOAK_URL`、`VITE_KEYCLOAK_REALM`、`VITE_KEYCLOAK_CLIENT_ID` 均已填写且可访问。三项齐全时独立开发才会启用本地登录；留空则鉴权关闭，不会进入 Keycloak。若以 micro-app 子应用调试，本地鉴权始终关闭，需由宿主提供用户上下文。

**未配 Keycloak 能否看示例页？**

可以。环境变量留空时 `isAuthEnabled` 为 `false`，可直接访问侧栏「示例 → 示例用户」。需要本地登录时再补齐三项 Keycloak 配置并重启 `pnpm dev`。

**改了品牌色页面没有变化？**

先改 `src/constants/brand.ts`，再跑 `pnpm theme:sync` 或重启 `pnpm dev`，确保 Tailwind 主题 CSS 已重新生成。

**如何查看示例业务页？**

本地启动后打开侧栏「示例 → 示例用户」，或访问 `/demo/users`。该页使用本地 Mock 数据，演示查询、分页、行选择、弹窗新建/编辑与删除。

**如何接入后端 API？**

1. 在 `api.swagger.config.ts` 配置 Swagger 输入与输出路径。
2. 执行 `pnpm swagger-g` 生成客户端到 `src/api`。
3. 按 [Fetch](./readme/Fetch.md) 用 `apiInterceptors` 创建服务单例后在业务中调用。

**构建产物如何部署？**

`pnpm build` 输出到 `dist/`。静态资源 `base` 默认为 `/`；作为微前端子应用时，按宿主要求配置公共路径与基础路由。

## Troubleshooting

| 现象                  | 排查方向                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| 依赖安装失败          | 检查内网 Git / npm 源是否可达（尤其 `@asiainfo/auth`）                                           |
| 接口 404 / CORS       | 核对 `vite.config.ts` 代理与 `VITE_API_BASE_URL`                                                 |
| 类型报错              | 先 `pnpm typecheck`；路由类型依赖 `src/routeTree.gen.ts`，改路由后需保证开发服务或插件已重新生成 |
| 微前端样式 / 主题异常 | 确认宿主已下发偏好数据，且子应用侧 `useMicroAppData` 已挂载                                      |

若以上无法解决，对照相关专题文档或联系维护同学排查当前环境配置。
