---
title: AII-NEXT 列表页三位一体设计规范（AIISearch + useTable + AIITable）
version: 1.0
date_created: 2026-07-24
last_updated: 2026-07-24
owner: AII-NEXT 维护团队
tags: [design, app, list-page, AIISearch, useTable, AIITable]
---

# Introduction

本规范定义 **List Page Trinity**（`AIISearch` + `useTable` + `AIITable`）的设计契约：职责边界、默认行为、行选择 opt-in 模型、请求/响应归一化与组件接口。过程级「如何做业务页」见 [列表页开发规范](./spec-process-crud-list-page.md)；本文件聚焦**可复用组件与 Hook 本身**的机器可读约定，供开发与 Generative AI 一致实现与审查。

## 1. Purpose & Scope

### 目的

- 固化三位一体各层职责，禁止在业务页自建分页/筛选/排序/行选择状态机。
- 明确 `useTable.selectionType` **显式 opt-in** 与 `AIITable` 选择启用条件的差异，避免误开选择列。
- 固定默认分页契约、字段映射与过期请求忽略规则。

### 范围

本规范适用于：

- `src/components/AIISearch/`、`src/components/AIITable/`、`src/hooks/use-table.ts` / `use-table.utils.ts` 的实现与变更。
- 业务页消费 Trinity 时的接口与行为预期。

本规范**不**覆盖：

- Feature 目录结构、CRUD 档位、Modal 写操作编排（见过程规范）。
- OpenAPI / 后端领域模型设计。
- 表格视觉稿与品牌样式细节（以 Ant Design Token + Tailwind 为准）。

### 受众

- 前端组件维护者与业务开发工程师
- 代码审查人员
- Generative AI 辅助实现列表页的工具链

### 假设

- 工程遵循 [前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)。
- 页码遵循 Ant Design 约定，从 `1` 开始。
- 实体具备稳定唯一主键（默认字段名 `id`）。

## 2. Definitions

| 术语                      | 定义                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **List Page Trinity**     | `AIISearch`（查询 UI）+ `useTable`（请求与表格状态）+ `AIITable`（展示与声明式操作）的标准组合。                         |
| **Query State**           | 页面持有的筛选条件对象，传入 `useTable` 的 `params`，跨分页保留。                                                        |
| **selectionType opt-in**  | `useTable` 仅在显式传入 `selectionType` 时，才向 `tableProps` 注入选择相关属性。                                         |
| **AIITable 选择启用条件** | `selectionType`、`selectedRowKeys`、`defaultSelectedRowKeys`、`onSelectionChange`、`rowSelection` 任一存在即启用选择列。 |
| **run / refresh / reset** | `useTable` 命令：换参并回默认页 / 保持当前页重请求 / 清空列筛选排序并回默认页。                                          |
| **fieldNames**            | 请求/响应字段映射；`response.root` 支持点路径。                                                                          |
| **requestId 竞态**        | 仅最新一次列表请求的响应可写入状态；过期响应 MUST 被忽略。                                                               |
| **selectionAlert**        | 多选且存在选中项时的表格内/外选择提示栏。                                                                                |

## 3. Requirements, Constraints & Guidelines

### 3.1 职责边界

- **REQ-001**: `AIISearch` MUST 只负责查询表单 UI（栅格、展开收起、校验）；MUST NOT 发起列表请求。查询副作用由页面在 `onSearch` / `onReset` 中调用 `run`。
- **REQ-002**: `useTable` MUST 管理远程/静态列表数据、loading、分页、列筛选、排序、行选择状态，并输出可展开到 `AIITable` 的 `tableProps`。
- **REQ-003**: `AIITable` MUST 负责表格展示默认值、分页 preset、选择列合并、操作列、工具栏与选择提示；MUST NOT 自行请求接口。
- **REQ-004**: 业务页 MUST 使用 Trinity（或 `useTable` + `AIITable`，无筛选时省略 `AIISearch`），不得自建与 `useTable` 冲突的分页请求状态机。

### 3.2 useTable 行选择 opt-in

- **REQ-010**: `useTable` 的 `selectionType` MUST 为可选；**未传入时 MUST NOT** 在 `tableProps` 中包含 `selectedRowKeys`、`onSelectionChange` 或 `selectionType`。
- **REQ-011**: 即使未启用选择列，Hook 内部仍 MAY 维护 `selectedRowKeys` / `selectedRows` / `clearSelection()`，供调用方命令式使用；但不得因此触发 `AIITable` 选择列。
- **REQ-012**: 需要多选批量能力时，页面 MUST 显式配置 `selectionType: 'checkbox'`（单选为 `'radio'`）。
- **REQ-013**: `selectedRows` MUST 仅从当前 `dataSource` 按 `rowKey` 解析；跨页保留的 key 在当前页无对应行时，对应行对象可不存在。

### 3.3 AIITable 选择与默认值

- **REQ-020**: `AIITable` MUST 在「任一选择相关 prop 存在」时启用 `rowSelection`（条件宽于 `useTable` opt-in）。
- **REQ-021**: `selectionAlert` 默认行为：仅当 `selectionType === 'checkbox'` 且 `selectionAlert !== false` 且存在选中项时展示。
- **REQ-022**: 默认值 MUST 为：`rowKey='id'`、`size='large'`、`paginationMode='simple'`、`sticky=true`、`card=true`、`scroll.x='max-content'`、操作列宽 `180`、选择列宽 `55`、操作列 `maxVisible=2`。
- **REQ-023**: `pagination={false}` MUST 关闭分页 UI；`actionColumn={false}` MUST 强制隐藏操作列。

### 3.4 请求与响应契约

- **REQ-030**: 默认请求字段 MUST 为 `current`、`pageSize`；默认响应字段 MUST 为 `list`、`total`（`current`/`pageSize` 可选）。
- **REQ-031**: 默认请求体 MUST NOT 自动包含 `filters` / `sorter`；需要时 MUST 经 `mapPayload` 追加。
- **REQ-032**: 未映射 list 时，归一化 MUST 依次尝试 `list` → `data` → `records` → `rows`；total MUST 尝试映射字段 → `total` → `count` → `totalCount` → `totalElements`。
- **REQ-033**: 并发请求 MUST 使用递增 `requestId`；仅最新请求可更新状态。
- **REQ-034**: `params` MUST NOT 作为 Effect 依赖；外部值变化自动重载时 MUST 放入 `refreshDeps`。
- **REQ-035**: `run(patch)` MUST 回到 `defaultCurrent`；`patch` MUST NOT 自动持久为后续 `params` 来源（页面须自行更新 Query State）。
- **REQ-036**: `ready: false` MUST 阻止自动与命令式远程请求；`manual: true` MUST 跳过首次自动请求。
- **REQ-037**: `onError` MUST 仅作通知；失败后 `run` / `refresh` / `reset` 的 Promise MUST 仍然 reject。

### 3.5 AIISearch 交互

- **REQ-040**: `onReset` MUST 仅重置表单字段并回调；MUST NOT 自动发起列表查询。
- **REQ-041**: 默认 `layout='vertical'`、`colon=false`、`defaultCollapsed=true`、`card=true`。
- **REQ-042**: 与 `useTable` 组合时，页面 `onSearch` MUST `setQuery` + `run(values)`；`onReset` MUST 清空 Query State + `run({})`（或空查询对象）。

### 3.6 约束与指南

- **CON-001**: 不得向 `AIITable` 默认传入空的 `selectedRowKeys: []` 作为「未选择」信号（这会启用选择列）；未启用选择时省略选择 props。
- **CON-002**: 业务 MUST 使用 `@/` 别名引用 Trinity 模块。
- **CON-003**: 操作文案与空态 SHOULD 走 i18n（`common:Actions.*`、`common:AII_Table.*`、`common:General.Empty`）。

- **GUD-001**: 服务端分页列表优先 `useTable`；仅静态小数据用 `useTable(null, { dataSource })`。
- **GUD-002**: 接口字段不一致时优先 `fieldNames`，复杂结构用 `mapPayload` / `mapResponse`。
- **GUD-003**: 工具栏 / 行操作 / 批操作的权限用 `permission`（`menuCode`），无权限由 `AIITable` 隐藏。

- **PAT-001**: **Trinity Orchestration** — Search 改 Query State → `run` → Hook 填 `tableProps` → Table 展示。
- **PAT-002**: **Selection Opt-in** — 需要勾选才传 `selectionType`；只读默认无选择列。
- **PAT-003**: **Declarative Actions** — `toolbar` / `rowActions` / `batchActions` 声明操作，避免手写操作列。

## 4. Interfaces & Data Contracts

### 4.1 组合数据流

```text
AIISearch.onSearch(values)
  → setQuery(values) + useTable.run(values)
useTable
  → buildRequestPayload / mapPayload → API
  → normalizeTableResponse / mapResponse → dataSource + pagination
  → tableProps → AIITable
AIITable
  → onChange → useTable.handleTableChange → 再请求（远程模式）
```

### 4.2 useTable 选项（摘要）

| 选项                                          | 默认                    | 说明                 |
| --------------------------------------------- | ----------------------- | -------------------- |
| `params`                                      | —                       | 额外查询参数来源     |
| `rowKey`                                      | `'id'`                  | 行主键               |
| `defaultPageSize` / `defaultCurrent`          | `10` / `1`              | 初始分页             |
| `manual` / `ready`                            | `false` / `true`        | 请求控制             |
| `refreshDeps`                                 | `[]`                    | 变化时回默认页并请求 |
| `fieldNames` / `mapPayload` / `mapResponse`   | 默认约定                | 适配层               |
| `paginationMode` / `pagination`               | 透传 AIITable           | 分页 UI              |
| `selectionType`                               | **未传 = 不启用选择列** | opt-in               |
| `defaultSelectedRowKeys`                      | `[]`                    | 内部选择初始值       |
| `onSelectionChange` / `onSuccess` / `onError` | —                       | 回调                 |

### 4.3 useTable 返回值（摘要）

| 字段                                           | 说明                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `tableProps`                                   | 含 loading/dataSource/pagination/onChange/rowKey/paginationMode；**仅当有 `selectionType` 时**追加选择 props |
| `selectedRowKeys` / `selectedRows`             | 始终可读                                                                                                     |
| `run` / `refresh` / `reset` / `clearSelection` | 命令式 API                                                                                                   |

### 4.4 AIITable 选择合并顺序

1. Base：`columnWidth = 55`，可选 `type` 来自 `selectionType`。
2. 展开 `rowSelection` 覆盖同名字段。
3. 受控 `selectedRowKeys` / `onChange` 与封装 props 对齐。

### 4.5 默认分页 JSON 契约

**请求：**

```json
{
  "current": 1,
  "pageSize": 10
}
```

**响应：**

```json
{
  "list": [],
  "total": 0,
  "current": 1,
  "pageSize": 10
}
```

`current` / `pageSize` 在响应中可选；缺失时保留本次请求值。

## 5. Acceptance Criteria

- **AC-001**: Given `useTable(api)` 未传 `selectionType`，When 渲染 `AIITable {...tableProps}`，Then 表格不出现选择列。
- **AC-002**: Given `useTable(api, { selectionType: 'checkbox' })`，When 渲染表格，Then 出现多选列；选中后可显示 selectionAlert（未关闭时）。
- **AC-003**: Given 远程模式，When 快速连续翻页，Then 仅最新请求写入 `dataSource` / `pagination`。
- **AC-004**: Given Query State 已更新并调用 `run(values)`，When 翻页，Then 后续请求仍携带当前 `params`（页面已 setQuery）。
- **AC-005**: Given `run(patch)` 且未更新页面 Query State，When 再翻页，Then 不应假设 `patch` 仍作为 `params`（调用方须持久化 Query State）。
- **AC-006**: Given `AIISearch.onReset`，When 仅重置表单，Then 列表不自动刷新，直至页面回调中调用 `run({})`。
- **AC-007**: Given `paginationMode` 未传，When 渲染 `AIITable`，Then 使用 `'simple'` 分页 preset。
- **AC-008**: Given `rowActions` 未自定义 `actionColumn.width`，When 渲染操作列，Then 列宽为 `180`。

## 6. Test Automation Strategy

- **Test Levels**
  - **Unit**: `buildRequestPayload`、`normalizeTableResponse`、`mergeRowSelection`、`mergeColumns`、`mergePagination`、`getSelectedRows`。
  - **Integration**: `useTable` 与 mock API 的分页、竞态、`selectionType` 有无时 `tableProps` 形状。
  - **End-to-End**: `/demo/users` 查询 → 翻页 → 多选批删 → 清空选择。

- **Frameworks**: Vitest（单元/集成）；E2E 待统一 Playwright/Cypress。

- **Test Data Management**: 固定 JSON fixture / MSW；禁止依赖共享环境脏数据。

- **CI/CD Integration**: PR 执行 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`；引入测试后覆盖 Trinity 核心工具。

- **Coverage Requirements**: `use-table.utils` 与 AIITable merge 工具行覆盖率目标 ≥ 80%（测试就绪后）。

- **Performance Testing**: 禁止在 render 路径对大数据做无节流全量同步过滤；列表分页应在服务端完成。

## 7. Rationale & Context

- **分层**：查询 UI、请求状态、表格展示解耦后，可单独替换后端契约适配层而不改表格壳。
- **selectionType opt-in**：历史上默认注入 `selectedRowKeys: []` 会误触发 `AIITable` 选择列；opt-in 使只读页默认干净。
- **AIITable 条件更宽**：直接使用 `AIITable` 时可用 `rowSelection` 等原生能力，不必强制 `selectionType`。
- **默认 simple 分页**：BSS 列表页以「当前页 + 每页条数」为主；完整页码为可选增强。
- **竞态忽略**：翻页抖动时旧响应覆盖新数据是高频缺陷，必须内建 requestId。

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: BSS 列表 REST API — 提供可适配为 `list`/`total` 的分页接口。

### Third-Party Services

- **SVC-001**: 无额外第三方服务依赖。

### Infrastructure Dependencies

- **INF-001**: 应用已挂载 i18n、`AntdAppProvider`（空态/表格壳文案与全局反馈）。

### Data Dependencies

- **DAT-001**: `locales/*/common.yaml` — `General.Empty`、`AII_Table.*`、`Actions.*`。

### Technology Platform Dependencies

- **PLT-001**: React 19、Ant Design 6 Table/Form。
- **PLT-002**: TypeScript 严格类型；行类型可由 API 泛型推导。

### Compliance Dependencies

- **COM-001**: 按钮级 `permission` 与宿主 `permissionsButton.menuCode` 对齐（见 Access / 架构 ACL）。

## 9. Examples & Edge Cases

### 9.1 只读列表（无选择列）

```tsx
const { tableProps, run } = useTable(listResources, {
  rowKey: 'id',
  params: query,
  // 不传 selectionType
});

return (
  <>
    <AIISearch
      items={items}
      onSearch={(values) => {
        setQuery(values);
        return run(values);
      }}
      onReset={() => {
        setQuery({});
        return run({});
      }}
    />
    <AIITable
      {...tableProps}
      columns={columns}
    />
  </>
);
```

### 9.2 多选批量（显式 opt-in）

```tsx
const { tableProps, clearSelection, refresh } = useTable(listResources, {
  rowKey: 'id',
  params: query,
  selectionType: 'checkbox',
});
```

### 9.3 边缘情况

| 场景                                          | 预期                                               |
| --------------------------------------------- | -------------------------------------------------- |
| 未传 `selectionType` 但读取 `selectedRowKeys` | Hook 返回空数组；表格无选择列                      |
| 仅传 `selectedRowKeys={[]}` 给 AIITable       | **会**启用选择列（AIITable 宽条件）                |
| `virtual=true`                                | 选择提示栏渲染在表格外；需数值型 `scroll.x/y`      |
| `ready: false` → `true` 且非 manual           | 自动发起请求                                       |
| 静态 `useTable(null, { dataSource })`         | `loading` 恒 false；`run`/`refresh`/`reset` 不请求 |

## 10. Validation Criteria

- [ ] `useTable` 无 `selectionType` 时 `tableProps` 不含选择字段
- [ ] 需要批选时显式 `selectionType: 'checkbox'`
- [ ] 默认 `paginationMode='simple'`、`size='large'`、操作列宽 `180`
- [ ] 列表请求有 requestId 竞态保护
- [ ] `params` 不作为 Effect 依赖；外部驱动走 `refreshDeps`
- [ ] `AIISearch.onReset` 不隐式查询
- [ ] `pnpm typecheck` 通过；相关文件通过 lint / format

## 11. Related Specifications / Further Reading

- [列表页开发规范（查询展示与 CRUD）](./spec-process-crud-list-page.md)
- [前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)
- [国际化文案规范](./spec-process-i18n-locale.md)
- [AIITable](../readme/AIITable.md)
- [useTable](../readme/useTable.md)
- [AIISearch](../readme/AIISearch.md)
- [Access](../readme/Access.md)
- 参考实现：`src/routes/_app/_authentication/demo/users.tsx`
