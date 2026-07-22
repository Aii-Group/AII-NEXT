<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# useTable

将列表接口适配为 `AIITable` 属性，统一管理请求、分页、筛选、排序和行选择状态。

</div>

`useTable` 面向接收单个请求对象的异步列表接口。它根据字段映射构造分页参数、归一化响应，并返回可直接展开到 [`AIITable`](./AIITable.md) 的 `tableProps`。

## 特性

- 自动请求列表数据并维护加载态
- 支持服务端分页、Ant Design 列筛选和排序
- 支持请求与响应字段映射，包括点分隔的响应根路径
- 支持自定义请求体和响应归一化
- 忽略过期请求结果，避免后返回的旧请求覆盖新数据
- 支持手动请求、就绪条件和依赖变化刷新
- 统一管理受控行选择和选中行数据
- 无接口时可管理本地静态数据
- 根据接口返回值和字段映射推导行类型

## 快速开始

接口遵循默认字段约定时，只需传入 API 函数：

```tsx
import type { ColumnsType } from 'antd/es/table';
import { AIITable } from '@/components/AIITable';
import { useTable } from '@/hooks/use-table';

interface User {
  id: string;
  name: string;
}

const columns: ColumnsType<User> = [{ title: '用户名', dataIndex: 'name', key: 'name' }];

function UserTable() {
  const { tableProps } = useTable(api.listUsers);

  return (
    <AIITable
      {...tableProps}
      columns={columns}
    />
  );
}
```

默认发送：

```ts
{
  current: 1,
  pageSize: 10,
}
```

默认读取：

```ts
{
  list: [],
  total: 0,
  current: 1, // 可选
  pageSize: 10, // 可选
}
```

> [!NOTE]
> 页码遵循 Ant Design 约定，从 `1` 开始。响应未提供 `current` 或 `pageSize` 时，Hook 会保留本次请求使用的值。

## 字段映射

后端字段与默认约定不一致时，通过 `fieldNames` 显式映射请求和响应。

```tsx
const TABLE_FIELD_NAMES = {
  request: {
    current: 'page',
    pageSize: 'size',
  },
  response: {
    root: 'data.result',
    list: 'items',
    total: 'count',
    current: 'page',
    pageSize: 'size',
  },
} as const;

function UserTable() {
  const { tableProps } = useTable(api.listUsers, {
    fieldNames: TABLE_FIELD_NAMES,
    rowKey: 'userId',
  });

  return (
    <AIITable
      {...tableProps}
      columns={columns}
    />
  );
}
```

该配置只发送映射后的分页字段：

```ts
{
  page: 1,
  size: 10,
}
```

响应从 `response.data.result` 中读取 `items`、`count`、`page` 和 `size`，不会额外发送 `current` 或 `pageSize`。

未映射列表字段时，归一化逻辑会依次尝试 `list`、`data`、`records` 和 `rows`；总数会尝试 `total`、`count`、`totalCount` 和 `totalElements`。

> [!IMPORTANT]
> `response.root` 支持点分隔路径；`list`、`total`、`current` 和 `pageSize` 是根对象下的直接字段名，不会按点路径解析。

## 查询参数

`params` 是后续请求使用的查询参数来源，`run(patch)` 用于为本次请求补充或覆盖条件。两者会与映射后的分页字段合并。

```tsx
import { useState } from 'react';

type UserQuery = {
  tenantId: string;
  keyword?: string;
  enabled?: boolean;
};

const [query, setQuery] = useState<UserQuery>({ tenantId });

const { tableProps, run, refresh, reset } = useTable<typeof api.listUsers, undefined, User, UserQuery>(api.listUsers, {
  rowKey: 'id',
  params: query,
});

const nextQuery = { ...query, keyword, enabled };
setQuery(nextQuery);
await run(nextQuery);
```

| 方法         | 页码行为               | 查询参数行为                          |
| ------------ | ---------------------- | ------------------------------------- |
| `run(patch)` | 回到 `defaultCurrent`  | 本次请求合并 `params` 与 `patch`      |
| `refresh()`  | 保持当前页             | 使用当前 `params`、筛选和排序重新请求 |
| `reset()`    | 恢复默认页码和每页条数 | 清空列筛选和排序，使用当前 `params`   |

> [!WARNING]
> `run(patch)` 不会把补丁保存为后续分页请求的参数源。查询条件需要跨分页保留时，应像上例一样存入页面状态并传给 `params`。`reset()` 也不会清空 `params` 或选中行；搜索表单重置时应同时更新页面状态并调用 `run(resetValues)`。

## 筛选与排序

`tableProps.onChange` 会接收 Ant Design Table 的分页、筛选和排序变化。远程模式下，Hook 会保存最新状态并立即请求。

默认请求体只包含分页字段和额外查询参数，不会自动发送 `filters` 与 `sorter`。需要将它们提交给后端时，使用 `mapPayload`：

```tsx
const { tableProps } = useTable(api.listUsers, {
  params: { tenantId },
  mapPayload: ({ current, pageSize, filters, sorter, extraParams }) => ({
    ...extraParams,
    page: current,
    size: pageSize,
    filters,
    sorter,
  }),
});
```

`mapPayload` 接收以下请求上下文：

| 字段          | 说明                                       |
| ------------- | ------------------------------------------ |
| `current`     | 当前页，从 `1` 开始                        |
| `pageSize`    | 每页条数                                   |
| `filters`     | Ant Design Table 筛选状态                  |
| `sorter`      | 单列或多列排序状态                         |
| `extraParams` | 合并后的 `params` 与 `run(patch)` 参数     |
| `payload`     | 已按 `fieldNames.request` 生成的默认请求体 |

仅需追加字段时，可以复用默认 `payload`：

```tsx
mapPayload: ({ payload, filters, sorter }) => ({
  ...payload,
  filters,
  sorter,
});
```

## 自定义响应

响应无法通过字段映射表达时，使用 `mapResponse` 返回统一结构：

```tsx
const { tableProps } = useTable(api.listUsers, {
  mapResponse: (response) => ({
    list: response.result.items,
    total: response.result.pageInfo.totalCount,
    current: response.result.pageInfo.page,
    pageSize: response.result.pageInfo.size,
  }),
});
```

`list` 和 `total` 必填，`current` 与 `pageSize` 可选。

## 请求控制

### 手动请求

`manual: true` 会跳过首次自动请求，之后通过 `run` 或 `refresh` 主动加载。

```tsx
const { tableProps, run } = useTable(api.listUsers, {
  manual: true,
});

await run({ keyword });
```

### 就绪条件

`ready: false` 会阻止自动请求和所有命令式请求，适合等待路由参数或上游数据。

```tsx
const { tableProps } = useTable(api.listUsers, {
  ready: Boolean(tenantId),
  params: { tenantId },
});
```

当 `ready` 变为 `true` 时，如果 `manual` 为 `false`，Hook 会自动发起请求。

### 依赖刷新

`refreshDeps` 中任意依赖变化时，会使用默认页码和每页条数重新请求。

```tsx
const { tableProps } = useTable(api.listUsers, {
  params: { tenantId },
  refreshDeps: [tenantId],
});
```

> [!NOTE]
> `params` 本身不会作为 Effect 依赖。需要随外部值变化自动加载时，将该值同时放入 `refreshDeps`，并保持数组长度与顺序稳定。

## 分页配置

使用 `defaultCurrent` 和 `defaultPageSize` 设置初始分页，通过 `pagination` 覆盖传给 `AIITable` 的配置。

```tsx
const { tableProps } = useTable(api.listUsers, {
  defaultCurrent: 1,
  defaultPageSize: 20,
  paginationMode: 'full',
  pagination: {
    pageSizeOptions: [20, 50, 100],
    showQuickJumper: true,
  },
});
```

远程模式会用内部 `current`、`pageSize` 和 `total` 填充分页；显式传入的同名分页值优先。设置 `pagination: false` 可关闭分页 UI，但请求仍会携带内部页码和每页条数。

## 行选择

Hook 返回受控选择状态，并通过 `tableProps` 交给 `AIITable`。

```tsx
const { tableProps, selectedRowKeys, selectedRows, clearSelection } = useTable(api.listUsers, {
  selectionType: 'checkbox',
  defaultSelectedRowKeys: ['user-1'],
  onSelectionChange: (keys, rows, info) => {
    console.log(keys, rows, info.type);
  },
});

return (
  <>
    <button onClick={clearSelection}>清空 {selectedRowKeys.length} 项</button>
    <AIITable
      {...tableProps}
      columns={columns}
      batchActions={buildBatchActions(selectedRows)}
    />
  </>
);
```

`selectedRows` 只从当前 `dataSource` 中按 `rowKey` 查找。远程分页切换后，上一页仍保留的 key 可能无法在当前页解析出对应行对象。

## 静态数据

不传 API 时，Hook 不发起请求，只同步本地数据、分页总数和表格状态。

```tsx
const { tableProps, dataSource, setDataSource } = useTable(null, {
  rowKey: 'id',
  dataSource: initialRows,
  pagination: { pageSize: 20 },
});
```

静态模式下 `loading` 始终为 `false`，`run`、`refresh` 和 `reset` 不发起请求。传给 `dataSource` 的数组变化时会同步到内部状态；也可以使用 `setDataSource` 手动更新。

## 配置

| 配置                     | 类型                               | 默认值             | 说明               |
| ------------------------ | ---------------------------------- | ------------------ | ------------------ |
| `dataSource`             | `RecordType[]`                     | `[]`               | 静态数据源         |
| `params`                 | `Params`                           | -                  | 额外请求参数       |
| `rowKey`                 | `TableProps['rowKey']`             | `'id'`             | 表格行主键         |
| `defaultPageSize`        | `number`                           | `10`               | 默认每页条数       |
| `defaultCurrent`         | `number`                           | `1`                | 默认当前页         |
| `manual`                 | `boolean`                          | `false`            | 是否跳过自动请求   |
| `ready`                  | `boolean`                          | `true`             | 请求是否就绪       |
| `refreshDeps`            | `readonly unknown[]`               | `[]`               | 自动刷新依赖       |
| `fieldNames`             | `TableFieldNames`                  | 默认字段约定       | 请求与响应字段映射 |
| `mapPayload`             | `(params) => ApiPayload`           | -                  | 自定义接口入参     |
| `mapResponse`            | `(response) => TableRequestResult` | -                  | 自定义响应归一化   |
| `paginationMode`         | `'simple' \| 'full'`               | 由 `AIITable` 决定 | 分页展示模式       |
| `pagination`             | `TablePaginationConfig \| false`   | -                  | 分页配置           |
| `selectionType`          | `'checkbox' \| 'radio'`            | Ant Design 默认    | 行选择类型         |
| `defaultSelectedRowKeys` | `Key[]`                            | `[]`               | 初始选中行         |
| `onSelectionChange`      | `(keys, rows, info) => void`       | -                  | 选择变化回调       |
| `onSuccess`              | `(result, params) => void`         | -                  | 请求成功回调       |
| `onError`                | `(error) => void`                  | -                  | 请求失败回调       |

> [!WARNING]
> `onError` 只负责通知，不能吞掉错误。接口失败后，`run()`、`refresh()` 和 `reset()` 返回的 Promise 仍会 reject；事件处理器中应按业务需要捕获错误。

## 返回值

| 字段               | 说明                                        |
| ------------------ | ------------------------------------------- |
| `tableProps`       | 可直接传给 `AIITable` 的受控属性            |
| `loading`          | 当前请求加载状态                            |
| `dataSource`       | 当前表格数据                                |
| `pagination`       | 内部分页状态 `{ current, pageSize, total }` |
| `filters`          | 当前 Ant Design 筛选状态                    |
| `sorter`           | 当前 Ant Design 排序状态                    |
| `selectedRowKeys`  | 当前选中行 key                              |
| `selectedRows`     | 当前页可解析的选中行数据                    |
| `refresh()`        | 按当前状态重新请求                          |
| `reset()`          | 重置分页、筛选和排序后请求                  |
| `clearSelection()` | 清空选中项并触发选择回调                    |
| `setDataSource()`  | 手动设置表格数据                            |
| `setPagination()`  | 手动设置内部分页状态                        |
| `run(patch)`       | 合并查询参数并从默认页请求                  |

## 完整组合

```tsx
function UserListPage() {
  const [query, setQuery] = useState<SearchValues>(DEFAULT_SEARCH_VALUES);

  const { tableProps, run, refresh } = useTable(api.listUsers, {
    fieldNames: TABLE_FIELD_NAMES,
    rowKey: 'id',
    params: query,
    paginationMode: 'full',
    selectionType: 'checkbox',
    mapPayload: ({ payload, filters, sorter }) => ({
      ...payload,
      filters,
      sorter,
    }),
    onError: () => {
      window.$message.error('列表加载失败');
    },
  });

  return (
    <>
      <AIISearch<SearchValues>
        items={searchItems}
        onSearch={(values) => {
          setQuery(values);
          return run(values);
        }}
        onReset={() => {
          setQuery(DEFAULT_SEARCH_VALUES);
          return run(DEFAULT_SEARCH_VALUES);
        }}
      />
      <AIITable
        {...tableProps}
        columns={columns}
        rowActions={rowActions}
        toolbar={[
          { key: 'refresh', label: '刷新', onClick: refresh },
          { key: 'create', label: '新建', type: 'primary', onClick: openCreator },
        ]}
      />
    </>
  );
}
```

> [!NOTE]
> `AIISearch.onReset` 不接收重置值。示例中的 `DEFAULT_SEARCH_VALUES` 应包含页面完整的默认查询条件；也可以通过外部 `Form` 读取重置后的字段再调用 `run`。

## 导出类型与工具

`@/hooks/use-table` 同时导出以下公共能力：

- `UseTableOptions`、`UseTableResult`
- `TableApi`、`TableApiPayload`、`TableApiResponse`
- `TableFieldNames` 及请求、响应字段映射类型
- `TablePaginationState`、`TableRequestParams`、`TableRequestResult`
- `TableRecordFromApi`
- `DEFAULT_TABLE_FIELD_NAMES`
- `buildRequestPayload`、`normalizeTableResponse`、`resolveTableFieldNames`

## 相关文档

- [`AIITable`](./AIITable.md)：表格展示、操作列与工具栏
- [`AIISearch`](./AIISearch.md)：响应式查询表单
- [`Fetch`](./Fetch.md)：生成客户端与统一错误处理

## 开发检查

```bash
pnpm typecheck
pnpm exec oxlint --deny-warnings src/hooks/use-table.ts src/hooks/use-table.utils.ts
pnpm exec oxfmt --check src/hooks/use-table.ts src/hooks/use-table.utils.ts readme/useTable.md
```
