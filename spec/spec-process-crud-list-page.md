---
title: AII-NEXT 列表页开发规范（查询展示与 CRUD）
version: 1.3
date_created: 2026-07-20
last_updated: 2026-07-24
owner: AII-NEXT 维护团队
tags: [process, design, app, crud, list-page, read-only]
---

# Introduction

本规范定义在 **AII-NEXT** 基座上实现标准**列表页**的目录结构、组件组合、交互契约与验收标准。列表页能力可按业务裁剪：从「仅查询展示」到完整 CRUD（Create / Read / Update / Delete）。完整写操作参考实现为 `src/routes/_app/_authentication/demo/users.tsx` 及其 feature 模块 `src/features/demo-users/`。目标是让业务开发与 Generative AI 按同一套可复用模式产出一致、可维护的列表页，且不为只读场景强行引入写操作。

## 1. Purpose & Scope

### 目的

- 将「查询 + 分页列表」固化为列表页基线；在需要时叠加「弹窗新建/编辑 + 单条/批量删除」。
- 明确**页面能力档位**、必选能力与可选装饰项，避免只读页被当成完整 CRUD，也避免业务页遗漏横切约定（i18n、权限、刷新策略）。
- 与基座架构规范中的 **List Page Trinity**（`AIISearch` + `useTable` + `AIITable`）对齐。

### 范围

本规范适用于：

- 受保护业务路由下的标准资源列表页（表格为主），包括：
  - **只读展示**（查询 + 分页列表，无新建/编辑/删除）；
  - **部分写操作**（例如仅删除、或仅查看详情）；
  - **完整 CRUD**（查询 + 新建/编辑/删除）。
- 新建 `src/features/{domain}/` 业务模块及对应路由、菜单、文案。

本规范**不**覆盖：

- 复杂多步骤向导、全页表单（非 Modal）、树表/看板等非表格主导 UI。
- 后端领域模型与 OpenAPI 契约设计本身（仅约束前端如何消费契约）。
- 示例页中的「重置种子数据」等仅用于本地 Mock 演示的能力（业务页不得照搬）。

### 受众

- 前端业务开发工程师
- 代码审查人员
- 使用 Generative AI 辅助实现列表页的工具链

### 假设

- 工程已遵循 [AII-NEXT 前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)。
- 列表接口可适配为 `useTable` 默认分页契约（`current` / `pageSize` → `list` / `total`），或可通过 `fieldNames` / `mapPayload` / `mapResponse` 适配。
- 页面挂载于 `/_app/_authentication` 下，鉴权由路由守卫完成。
- 实现前 MUST 先确定页面能力档位（见 §2 / §3.0），再按档位取用对应 REQ。

### 参考实现

| 角色    | 路径                                                         | 能力档位  |
| ------- | ------------------------------------------------------------ | --------- |
| 路由页  | `src/routes/_app/_authentication/demo/users.tsx`             | 完整 CRUD |
| Feature | `src/features/demo-users/`（`types` / `DemoUserForm` / API） | 完整 CRUD |
| 文案    | `locales/zh-CN/demo.yaml`、`locales/en-US/demo.yaml`         | —         |
| 菜单    | `src/layout/utils/menu.ts` + `locales/*/menu.yaml`           | —         |

> 只读展示页无单独示例文件；合规骨架见 §9.1。

## 2. Definitions

| 术语                           | 定义                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| **列表页**                     | 以表格展示资源集合、通常带查询与分页的页面；写操作按档位可选。                                |
| **只读展示页（Read-only）**    | 仅查询与列表展示（Read），无新建/编辑/删除等写操作。                                          |
| **CRUD 列表页**                | 在列表页基线上，通过弹窗/确认框完成新建、编辑、删除的页面。                                   |
| **页面能力档位**               | 本页启用的能力集合：`read`（必有）以及可选的 `create` / `update` / `delete` / `batchDelete`。 |
| **Feature 模块**               | `src/features/{domain}/` 下的领域代码：类型、（按需）表单、API、barrel 导出。                 |
| **List Page Trinity**          | `AIISearch`（查询 UI）+ `useTable`（请求/分页/选择）+ `AIITable`（展示与操作）。              |
| **Query State**                | 页面持有的筛选条件对象（如 `DemoUserQuery`），与 `useTable` 的 `params` 同步。                |
| **run / refresh**              | `useTable` 提供的请求方法：`run(params)` 可换参并请求；`refresh()` 用当前内部状态重新请求。   |
| **Page Header（页头）**        | 页面顶部的标题与描述区域；**本规范中为可选**。                                                |
| **Toolbar Hint（工具栏提示）** | `AIITable.toolbar.left` 中的辅助说明文案；**本规范中为可选**。                                |
| **Row Actions**                | 表格行内操作（编辑、删除、查看等），经 `AIITable.rowActions` 声明。                           |
| **Batch Actions**              | 多选后的批量操作，经 `AIITable.batchActions` 声明。                                           |
| **Permission Code**            | 按钮级权限码（如 `demo:user:create`），无权限时由 `AIITable` 隐藏操作。                       |

## 3. Requirements, Constraints & Guidelines

### 3.0 页面能力档位（先定档再实现）

实现前 MUST 明确本页启用的能力。未声明的写能力视为不启用，对应 REQ **不适用**，不得据此判违规。

| 档位              | 能力                                                          | 典型场景                                   |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------ |
| **Read-only**     | `read`（+ 可选查询）                                          | 日志、报表、只读台账、外部系统同步结果展示 |
| **Partial write** | `read` + 部分 `create` / `update` / `delete` / `batchDelete`  | 仅允许删除、仅允许编辑状态、仅「查看详情」 |
| **Full CRUD**     | `read` + `create` + `update` + `delete`（`batchDelete` 按需） | 资源管理（参考 `demo/users`）              |

- **REQ-000**: 需求或实现说明中 SHOULD 写明页面能力档位；AI/开发者 MUST 仅实现已启用能力，不得为只读页生成空的新建/删除脚手架（除非产品明确预留）。

### 3.1 模块与目录

- **REQ-001**: 每个列表资源 MUST 在 `src/features/{domain}/` 下组织代码，至少包含：`types.ts`、列表数据访问（生成 API 调用或适配层）、`index.ts` barrel。表单组件仅在启用 `create` / `update` 时 MUST 存在。
- **REQ-002**: 路由页 MUST 位于 `src/routes/_app/_authentication/{path}.tsx`（或对应目录），使用 `createFileRoute`；不得手改 `routeTree.gen.ts`。
- **REQ-003**: 路由页 SHOULD 保持「编排层」职责：组装 Search / Table /（按需）弹窗与确认框；领域表单与 API MUST 留在 feature 模块。
- **REQ-004**: 独立模式下若需侧栏入口，MUST 在 `src/layout/utils/menu.ts` 注册菜单，并在 `locales/*/menu.yaml` 提供文案；`label` 使用 i18n key。

### 3.2 类型与数据契约

- **REQ-010**: Feature MUST 定义实体类型、查询参数类型；列表请求/响应类型 MUST 与 `useTable` 消费方式一致。`FormValues` 类型仅在启用 `create` / `update` 时 MUST 定义。
- **REQ-011**: 实体 MUST 具备稳定唯一主键（默认字段名 `id`）；若非 `id`，页面 MUST 向 `useTable` / `AIITable` 显式传入 `rowKey`。
- **REQ-012**: 查询参数类型 MUST 可赋值给 `Record<string, unknown>`（或与 `useTable` 泛型兼容），以便作为 `params` 与 `AIISearch` 泛型。
- **REQ-013**: 生产业务 SHOULD 通过 Swagger 生成客户端调用后端；仅演示/无后端场景可使用本地 Mock（参考 `mock-api.ts`），Mock MUST 不得进入生产业务路径。

### 3.3 列表页三位一体（所有档位基线）

- **REQ-020**: 列表页 MUST 使用 `useTable` + `AIITable`，不得自建分页请求状态机。有筛选条件时 MUST 使用 `AIISearch`；无任何筛选时 MAY 省略 `AIISearch`，仅保留表格与分页。
- **REQ-021**: 存在筛选时，页面 MUST 使用 `useState`（或等价）持有 Query State，并将其传入 `useTable(..., { params: query })`；无筛选时可不维护 Query State。
- **REQ-022**: 使用 `AIISearch` 时：`onSearch` MUST 更新 Query State 并调用 `run(values)`；`onReset` MUST 清空 Query State 并调用 `run({})`（或空查询对象）。
- **REQ-023**: `AIITable` MUST 展开 `tableProps`，并传入业务 `columns`。行选择为 **opt-in**：仅当启用批量操作（如 `batchDelete`）或其它勾选能力时，MUST 向 `useTable` 传入 `selectionType: 'checkbox'`（或 `'radio'`）；未传 `selectionType` 时 `tableProps` MUST NOT 携带选择字段，表格 MUST NOT 出现选择列。只读页默认 MUST NOT 启用行选择，除非存在导出勾选等只读批量能力。不得为「未选中」而向 `AIITable` 传入空的 `selectedRowKeys: []`（会误开选择列）。详见 [列表页三位一体设计规范](./spec-design-list-page-trinity.md)。
- **REQ-024**: `toolbar.actions` 按能力配置：启用 `create` 时 MUST 提供新建类主操作；只读页 MAY 省略整个 `toolbar`，或仅提供无副作用操作（如「刷新」调用 `refresh()`）。不得依赖示例页的「重置种子数据」。

### 3.4 可选 UI（非必须）

以下两项在参考实现中存在，但**不是**本规范的必选项；业务页可按产品需要省略。

- **OPT-001（页头）**: 页面顶部标题与描述（参考实现中的 `Page_Title` / `Page_Description`）为**可选**。省略时页面可直接以 `AIISearch` 或 `AIITable` 作为首个内容块。
- **OPT-002（工具栏左侧提示）**: `toolbar.left` 辅助说明文案（参考实现中的 `Toolbar_Hint`）为**可选**。省略时可不传 `toolbar.left`。
- **OPT-003（查询区）**: 当列表无业务筛选项时，`AIISearch` 为**可选**（见 REQ-020）。

```tsx
// 可选：页头（非必须）
<div>
  <h1 className="text-lg font-semibold text-foreground">{t('...Page_Title')}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{t('...Page_Description')}</p>
</div>

// 可选：工具栏左侧提示（非必须）
toolbar={{
  left: <span className="text-sm text-muted-foreground">{t('...Toolbar_Hint')}</span>,
  actions: [/* 按能力配置；只读页可省略 toolbar */],
}}
```

### 3.5 新建 / 编辑（Create / Update）— 仅当启用对应能力

以下条款仅在页面启用 `create` 和/或 `update` 时适用。

- **REQ-030**: 新建与编辑 MUST 通过 `useModal()`（`ModalProvider`）打开，不得在页面内用大量 `useState` 维护 Modal `open`。
- **REQ-031**: 表单 MUST 抽成独立组件（如 `XxxForm`），接收 `form: FormInstance` 与可选 `initialValues`；表单 MUST 使用 `layout='vertical'` 与 `preserve={false}`（与参考实现一致，避免关闭后残留字段）。
- **REQ-032**: `modal.open` SHOULD 设置 `destroyOnHidden: true`，保证关闭后卸载表单内容。
- **REQ-033**: `onOk` MUST：`await form.validateFields()` → 调用创建/更新 API → `window.$message.success(...)` → 刷新列表。
- **REQ-034**: 新建成功后 SHOULD 调用 `run(query)`（或等价，确保回到与当前筛选一致的列表）；编辑成功后 SHOULD 调用 `refresh()`。
- **REQ-035**: 编辑弹窗的表单 `key` MUST 绑定记录主键（或等价稳定值），新建可使用固定 key（如 `'create'`），避免实例复用导致字段错乱。
- **REQ-036**: Modal 的 `okText` / `cancelText` SHOULD 复用 `common:Actions.Submit` / `common:Actions.Cancel`（或项目 common 命名空间中的等价 key）。

### 3.6 删除（Delete）— 仅当启用对应能力

以下条款仅在页面启用 `delete` 和/或 `batchDelete` 时适用。

- **REQ-040**: 单条删除与批量删除 MUST 先经 `window.$modal.confirm` 确认；确认框删除按钮 MUST 使用危险样式（`okButtonProps: { danger: true }`）。
- **REQ-041**: 删除成功后 MUST：`window.$message.success(...)` → `clearSelection()`（若启用了行选择）→ `refresh()`。
- **REQ-042**: 批量删除的 `disabled` MUST 在无选中行时为 true（例如 `(keys) => keys.length === 0`）。
- **REQ-043**: 批量删除 API 入参 MUST 使用当前 `selectedRowKeys`（按接口要求映射为 string/number）。

### 3.7 权限与国际化

文案落盘细则（文件归属、扁平层级、复用决策顺序）MUST 遵循 [国际化文案规范](./spec-process-i18n-locale.md)。本节仅列列表页相关要点。

- **REQ-050**: 用户可见文案 MUST 进入 `locales/zh-CN` 与 `locales/en-US` 对应 YAML；禁止在 JSX 中硬编码面向用户的字符串（调试日志除外）。
- **REQ-051**: 同一列表功能大项的文案 MUST 放在同一业务命名空间文件下，用一级大项 Key 分割（如 `demo.yaml` → `Users:`）；YAML 仅允许「大项 → 叶子」，禁止更深嵌套。
- **REQ-052**: 工具栏、行操作、批量操作若需按钮级鉴权，MUST 配置 `permission`；无权限时由 `AIITable` 隐藏（见架构规范 ACL）。只读且无操作按钮时本条不适用。
- **REQ-053**: 新增文案 MUST 按「先复用已有 → 再判断可否提取到 `common` → 最后写入业务大项」决策；通用操作/空态/表格壳文案优先 `common`，含业务对象的确认正文等保留在业务大项。
- **REQ-054**: `zh-CN` 与 `en-US` 的 Key 集合 MUST 对称。

### 3.8 展示与工具

- **REQ-060**: 日期时间列 MUST 通过 `@/utils/dayjs` 的 `formatDate` / `formatDateTime` 与 `DateFormat` 格式化，禁止业务页直接 `import dayjs from 'dayjs'`。
- **REQ-061**: 枚举/状态列 SHOULD 使用 Tag 或其他统一视觉，文案走 i18n，不得直接展示原始枚举值（除非产品明确要求展示 code）。
- **REQ-062**: 长文本列 SHOULD 设置 `ellipsis: true`；固定宽度列 SHOULD 显式设置 `width`。
- **REQ-063**: 工具栏图标节点 SHOULD 提升为模块级常量（如 `const plusIcon = <Plus />`），避免每次 render 新建元素身份（与参考实现一致）。

### 3.9 约束

- **CON-001**: 业务导入 MUST 使用 `@/` 别名；feature 内部相对导入限于同目录。
- **CON-002**: 不得在列表页重复实现与 `useTable` 冲突的分页请求逻辑。
- **CON-003**: 破坏性操作（删除、批量删除、清空类）MUST 二次确认。
- **CON-004**: 示例页的 `resetDemoUsers` / 「重置数据」仅用于 Mock 演示，业务列表页 MUST NOT 将其作为标准能力复制。
- **CON-005**: 只读展示页 MUST NOT 引入无产品需求的写操作入口（新建/编辑/删除按钮或死代码表单）。

### 3.10 指南与模式

- **GUD-001**: 搜索项数量较少时，全部放入 `AIISearch`；筛选项很多时，优先保留高频字段，其余进「更多」或后续迭代，避免首屏表单过重。无筛选则省略 `AIISearch`。
- **GUD-002**: 创建与编辑共用同一表单组件；仅当字段集合差异显著时再拆分。只读页不创建表单文件。
- **GUD-003**: 接口字段与默认分页契约不一致时，优先 `fieldNames` / `mapPayload` / `mapResponse`，不要在页面里手动拼装 `current`/`list`。
- **GUD-004**: 成功提示使用 `window.$message`；确认框使用 `window.$modal.confirm`；带表单的业务弹窗使用 `useModal`。
- **GUD-005**: 只读页若需「查看详情」，SHOULD 使用只读 Modal/Drawer（`footer: null` 或无提交），不要复用可编辑表单的提交链路。

- **PAT-001**: **Feature + Route Orchestrator** — 领域在 `features/`，路由页只编排。
- **PAT-002**: **List Page Trinity** — Search（可选）→ Hook → Table。
- **PAT-003**: **Command Modal Form** — `useModal.open` + 独立 Form + `validateFields` 提交（写操作档位）。
- **PAT-004**: **Confirm then Mutate** — 删除类操作先 confirm 再调 API，成功后清选择并 refresh。
- **PAT-005**: **Read-only List** — 仅 `list` API + `useTable` + `AIITable`（+ 可选 `AIISearch`），无 mutation 与行选择。

## 4. Interfaces & Data Contracts

### 4.1 Feature 模块推荐结构

**只读展示：**

```text
src/features/{domain}/
  types.ts          # 实体、Query、ListPayload、ListResult
  api.ts            # list 接口（或生成客户端薄封装）
  index.ts          # 对外导出
```

**含写操作（按需增加）：**

```text
src/features/{domain}/
  types.ts          # 另含 FormValues；含 mutation 相关类型
  {Domain}Form.tsx  # 启用 create/update 时需要
  api.ts            # list + create/update/delete（按能力）
  index.ts
```

### 4.2 类型模板

```typescript
/** 实体状态等枚举按业务定义 */
export type ResourceStatus = 'enabled' | 'disabled';

export interface Resource {
  id: string;
  // ...业务字段
  createdAt: string;
}

export interface ResourceQuery extends Record<string, unknown> {
  name?: string;
  status?: ResourceStatus;
}

/** 仅 create/update 档位需要 */
export interface ResourceFormValues {
  name: string;
  status: ResourceStatus;
  // ...
}

export interface ResourceListPayload extends ResourceQuery {
  current: number;
  pageSize: number;
}

export interface ResourceListResult {
  list: Resource[];
  total: number;
  current: number;
  pageSize: number;
}
```

### 4.3 数据访问函数签名（语义）

| 函数              | 入参                       | 返回                  | 何时需要           |
| ----------------- | -------------------------- | --------------------- | ------------------ |
| `listResources`   | `ResourceListPayload`      | `ResourceListResult`  | 所有档位（必有）   |
| `createResource`  | `ResourceFormValues`       | `Resource`（或 void） | 启用 `create`      |
| `updateResource`  | `id`, `ResourceFormValues` | `Resource`（或 void） | 启用 `update`      |
| `deleteResource`  | `id`                       | `void`                | 启用 `delete`      |
| `deleteResources` | `ids[]`                    | `void`                | 启用 `batchDelete` |

### 4.4 页面编排契约

```typescript
const [query, setQuery] = useState<ResourceQuery>({});

const { tableProps, run, refresh, clearSelection, selectedRowKeys } = useTable(listResources, {
  rowKey: 'id',
  params: query,
  // selectionType: 'checkbox', // opt-in：仅批量写操作或其它勾选能力时启用；未传则无选择列
});
```

> `useTable` 仅在显式传入 `selectionType` 时向 `tableProps` 注入 `selectedRowKeys` / `onSelectionChange` / `selectionType`。Hook 仍始终暴露 `selectedRowKeys` / `clearSelection`，但不得依赖空数组 props 来「关闭」选择 UI。

| 场景            | 成功后的列表刷新策略             | 适用档位                 |
| --------------- | -------------------------------- | ------------------------ |
| 查询 / 重置     | `setQuery` + `run(values \| {})` | 有筛选时                 |
| 新建成功        | `run(query)`                     | `create`                 |
| 编辑成功        | `refresh()`                      | `update`                 |
| 删除 / 批删成功 | `clearSelection()` + `refresh()` | `delete` / `batchDelete` |
| 只读刷新        | `refresh()`（若提供刷新按钮）    | Read-only（可选）        |

### 4.5 AIITable 操作配置要点

| 配置              | 必选条件                               | 约定                                                                             |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| `toolbar`         | 否；有 `create` 或刷新等操作时建议配置 | 只读可整段省略                                                                   |
| `toolbar.actions` | 启用 `create` 时至少含新建             | `key` / `label` / `onClick`；主按钮 `type: 'primary'`；可配 `permission`、`icon` |
| `toolbar.left`    | 否（OPT-002）                          | 辅助说明，可省略                                                                 |
| `rowActions`      | 有行级编辑/删除/查看时                 | 危险操作 `danger: true`                                                          |
| `batchActions`    | 有批量删除等时                         | `disabled: (keys) => keys.length === 0`                                          |
| `selectionType`   | 有批量勾选能力时                       | **opt-in**；只读默认不传；传给 `useTable` 而非仅靠空 `selectedRowKeys`           |

### 4.6 i18n Key 建议（业务命名空间）

完整规则见 [国际化文案规范](./spec-process-i18n-locale.md)。列表页常用叶子（均挂在同一大项下，扁平）：

| Key 模式                                                     | 必须条件               | 归属倾向                                    |
| ------------------------------------------------------------ | ---------------------- | ------------------------------------------- |
| 字段 label / 表格列标题                                      | 是                     | 业务大项；同义时优先试 `common:Fields`      |
| 筛选 placeholder                                             | 有 `AIISearch` 时      | 业务大项                                    |
| `*.Page_Title` / `*.Page_Description`                        | 否（OPT-001）          | 业务大项                                    |
| `*.Toolbar_Hint`                                             | 否（OPT-002）          | 业务大项                                    |
| 表单 required / 校验文案                                     | 启用 `create`/`update` | 业务大项                                    |
| `*.Create_Title` / `*.Edit_Title`                            | 启用对应写能力         | 业务大项（含业务名词）                      |
| `*.Create_Success` / `*.Update_Success` / `*.Delete_Success` | 启用对应写能力         | 无业务词可倾向 `common`；含业务词则业务大项 |
| `*.Delete_Confirm_*` / `*.Batch_Delete_Confirm_*`            | 启用删除类能力         | 业务大项（通常含对象插值）                  |

通用操作优先：`common:Actions.Create` / `Edit` / `Delete` / `Submit` / `Cancel`，以及 `common:AII_Table.Batch_Delete`。禁止在业务文件重复定义同义 `Actions`。

## 5. Acceptance Criteria

- **AC-001**: Given 列表页已实现，When 打开页面，Then 自动发起列表请求并展示分页数据（`useTable` 非 `manual` 时）。
- **AC-002**: Given 页面配置了筛选，When 用户搜索/重置，Then Query State 与 `run` 行为符合 REQ-022；无筛选页不要求本条。
- **AC-003**: Given 页面启用 `create`，When 用户提交合法新建表单，Then 调用创建 API、成功 Toast、弹窗关闭、列表刷新；校验失败时弹窗保持打开。未启用 `create` 时本条不适用。
- **AC-004**: Given 页面启用 `update`，When 用户提交合法编辑表单，Then 调用更新 API、成功 Toast、列表 `refresh`，且表单初始值来自该行。未启用 `update` 时本条不适用。
- **AC-005**: Given 页面启用 `delete`，When 用户确认删除且 API 成功，Then 成功 Toast、选择被清空（若有）、列表刷新；取消确认则不调用删除 API。未启用时本条不适用。
- **AC-006**: Given 页面启用 `batchDelete` 且已勾选多行，When 确认批量删除，Then 按选中 keys 删除并清空选择；无选中时批量删除不可用。未启用时本条不适用。
- **AC-007**: Given 操作配置了 `permission` 且当前用户无对应权限，When 渲染表格，Then 对应按钮不展示。
- **AC-008**: Given 页面未实现页头、`toolbar.left`，或为只读且无 `toolbar`/表单，When 审查规范符合性，Then 仍判定为合规（OPT 与未启用写能力不算缺失）。
- **AC-009**: Given 新增业务文案，When 切换 `zh-CN` / `en-US`，Then 列表、（若有）表单/弹窗/确认框文案均来自 i18n，无硬编码用户文案。
- **AC-010**: Given 变更已合入，When 执行 `pnpm typecheck`，Then 通过且路由类型由文件路由自动生成。
- **AC-011**: Given 页面档位为 Read-only，When 检查代码与 UI，Then 不存在新建/编辑/删除入口及无用的 Form/mutation 模块。
- **AC-012**: Given 页面未传 `selectionType`，When 渲染 `AIITable {...tableProps}`，Then 不出现行选择列。
- **AC-013**: Given 页面传入 `selectionType: 'checkbox'`，When 渲染表格，Then 出现多选列；删除成功后 `clearSelection` 生效。

## 6. Test Automation Strategy

- **Test Levels**
  - **Unit**: Query 匹配/适配函数、（若有）表单校验规则、日期格式化、`mapPayload`/`mapResponse`。
  - **Integration**: `useTable` 与 mock list API 的分页/过期请求；写操作页覆盖 Modal `onOk` 校验失败不关闭。
  - **End-to-End**: 只读页覆盖搜索 → 翻页；完整 CRUD 覆盖新建 → 编辑 → 删除 → 批删（可以 `/demo/users` 为冒烟页）。

- **Frameworks**: Vitest（单元/集成）；E2E 待项目统一引入 Playwright/Cypress 后按档位覆盖主路径。

- **Test Data Management**: 列表 API 使用 MSW 或模块 Mock；避免 E2E 依赖不稳定的共享环境数据。

- **CI/CD Integration**: PR 流水线执行 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`；引入测试后将列表冒烟纳入 CI。

- **Coverage Requirements**: feature 内纯函数与适配层行覆盖率目标 ≥ 80%（测试框架就绪后生效）。

- **Performance Testing**: 首屏列表与翻页在开发环境可接受延迟内完成；禁止在 render 路径做无节流的全量同步过滤（大数据量应在服务端分页）。

## 7. Rationale & Context

- **编排与领域分离**：路由页变薄后，同一资源的表单与 API 可被抽屉、详情页复用，并便于 AI 按目录生成代码。
- **Trinity 强制复用**：分页、竞态、行选择是高频缺陷来源；统一 hook/组件可消灭重复状态机。
- **能力档位**：BSS 中大量页面是日志/报表/只读台账；若规范默认强制 CRUD，会造成无效表单与错误权限按钮。先定档再实现，使只读与完整管理共用同一套列表基线。
- **命令式 Modal**：后台写操作弹窗生命周期与提交 loading 高度同质，`ModalProvider` 比每页手写 `open`/`confirmLoading` 更稳。
- **删除必须确认**：防止误触；批删与选择态绑定，避免空操作。
- **页头与工具栏提示可选**：许多嵌入微前端或宿主已有面包屑/标题的场景不需要页内再放 H1；工具栏提示多为演示说明，生产页常不需要，故标为 OPT。

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: BSS 后端网关 — 至少提供资源 list 接口；写操作档位另需 create/update/delete（或等价）接口。

### Third-Party Services

- **SVC-001**: 无额外第三方；鉴权与错误展示遵循基座（Keycloak / 宿主）。

### Infrastructure Dependencies

- **INF-001**: 基座已挂载 `ModalProvider`、`AntdAppProvider`（提供 `window.$message` / `window.$modal`）。

### Data Dependencies

- **DAT-001**: OpenAPI/Swagger — 生产 API 类型与客户端来源。
- **DAT-002**: i18n YAML — `locales/zh-CN`、`locales/en-US`。

### Technology Platform Dependencies

- **PLT-001**: `useTable`、`AIITable`；有筛选时依赖 `AIISearch`；有表单写操作时依赖 `useModal`。
- **PLT-002**: Ant Design `Table`；写操作页另用 `Form` / `Input` / `Select` 等。
- **PLT-003**: TanStack Router 文件路由。
- **PLT-004**: react-i18next。

### Compliance Dependencies

- **COM-001**: 按钮级权限码与宿主/用户中心下发的 `permissionsButton` 对齐（微前端场景）；只读无按钮时不适用。

## 9. Examples & Edge Cases

### 9.1 只读展示页骨架（推荐最小形态）

```tsx
// 档位：Read-only（可选 AIISearch；无 toolbar / rowActions / 表单）
return (
  <div className='flex flex-col gap-4'>
    <AIISearch<ResourceQuery>
      items={searchItems}
      onSearch={(values) => {
        setQuery(values);
        void run(values);
      }}
      onReset={() => {
        setQuery({});
        void run({});
      }}
    />

    <AIITable<Resource>
      {...tableProps}
      columns={columns}
    />
  </div>
);
```

无筛选时还可进一步省略 `AIISearch` 与 Query State，仅保留 `useTable(listResources)` + `AIITable`。

### 9.2 含新建的列表页骨架（无页头、无 toolbar.left）

```tsx
return (
  <div className='flex flex-col gap-4'>
    <AIISearch<ResourceQuery>
      items={searchItems}
      onSearch={(values) => {
        setQuery(values);
        void run(values);
      }}
      onReset={() => {
        setQuery({});
        void run({});
      }}
    />

    <AIITable<Resource>
      {...tableProps}
      columns={columns}
      toolbar={{
        actions: [
          {
            key: 'create',
            label: t('common:Actions.Create'),
            type: 'primary',
            permission: 'resource:create',
            onClick: openCreateModal,
          },
        ],
      }}
      batchActions={[/* 启用 batchDelete 时配置 */]}
      rowActions={[/* 启用 update/delete 时配置 */]}
    />
  </div>
);
```

### 9.3 新建弹窗 onOk（仅 create 档位）

```tsx
onOk: async () => {
  const values = await form.validateFields();
  await createResource(values);
  window.$message.success(t('Resource.Create_Success'));
  await run(query);
},
```

### 9.4 删除确认（仅 delete 档位）

```tsx
window.$modal.confirm({
  title: t('Resource.Delete_Confirm_Title'),
  content: t('Resource.Delete_Confirm_Content', { name: record.name }),
  okText: t('common:Actions.Delete'),
  cancelText: t('common:Actions.Cancel'),
  okButtonProps: { danger: true },
  onOk: async () => {
    await deleteResource(record.id);
    window.$message.success(t('Resource.Delete_Success'));
    clearSelection();
    await refresh();
  },
});
```

### 9.5 边缘情况

| 场景               | 预期行为                                                            |
| ------------------ | ------------------------------------------------------------------- |
| 只读日志/报表页    | 仅 list + 表格（+ 可选查询）；无 Form、无 mutation、默认无行选择    |
| 无业务筛选项       | 省略 `AIISearch`（OPT-003），不视为缺失                             |
| 校验失败提交       | `validateFields` reject，Modal 不关闭、不请求 API                   |
| 创建/更新 API 失败 | Modal 保持打开（Provider 行为）；错误由拦截器/宿主处理              |
| 快速连续翻页       | `useTable` 忽略过期响应，仅最新请求生效                             |
| 删除当前页最后一条 | `refresh` 后展示更新后的 list/total（空页是否回退由 hook/后端约定） |
| 无批删需求         | 不传 `batchActions`，不启用 `selectionType`                         |
| 微前端宿主已有标题 | 省略 OPT-001 页头，避免双重标题                                     |
| 只读但需查看详情   | 只读 Modal/Drawer（`footer: null`），不走提交表单链路               |

## 10. Validation Criteria

合规性检查清单（按档位勾选）：

**所有档位**

- [ ] 已明确页面能力档位（Read-only / Partial / Full CRUD）
- [ ] Feature 模块包含 types、list 数据访问与 barrel 导出
- [ ] 路由位于 `/_app/_authentication`，未手改 `routeTree.gen.ts`
- [ ] 使用 `useTable` + `AIITable`；有筛选则使用 `AIISearch` 与正确的 `run`/`refresh`
- [ ] 行选择仅在需要时通过 `selectionType` opt-in；未传时无选择列
- [ ] 用户文案遵循 [国际化文案规范](./spec-process-i18n-locale.md)：同大项同文件、扁平 Key、先复用再 common/独有；双语 Key 对称
- [ ] 日期格式化走 `@/utils/dayjs`
- [ ] 未把示例「重置种子数据」带入业务页
- [ ] 页头与 `toolbar.left` 若缺失，不视为违规（可选）
- [ ] `pnpm typecheck` 通过

**Read-only 额外**

- [ ] 无新建/编辑/删除入口，无无用 Form / mutation 代码
- [ ] 默认未启用行选择（除非有明确只读勾选需求）

**启用写操作时额外**

- [ ] 新建/编辑走 `useModal` + 独立表单；`destroyOnHidden`；成功后按约定刷新
- [ ] 删除/批删有 confirm、成功 Toast、`clearSelection` + `refresh`
- [ ] 需鉴权的操作配置了 `permission`

## 11. Related Specifications / Further Reading

- [AII-NEXT 前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)
- [列表页三位一体设计规范](./spec-design-list-page-trinity.md)
- [国际化文案规范](./spec-process-i18n-locale.md)
- [代码质量与提交校验规范](./spec-process-lint-format-commit.md)
- [AIITable 组件文档](../readme/AIITable.md)
- [AIISearch 组件文档](../readme/AIISearch.md)
- [useTable Hook 文档](../readme/useTable.md)
- [ModalProvider 文档](../readme/ModalProvider.md)
- [DrawerProvider 文档](../readme/DrawerProvider.md)
- [Access 权限文档](../readme/Access.md)
- [AII-NEXT README](../README.md) — 示例用户页说明
- 参考实现（完整 CRUD）：`src/routes/_app/_authentication/demo/users.tsx`、`src/features/demo-users/`
