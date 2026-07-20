<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# AIITable

面向业务列表页的 Ant Design Table 封装，统一分页、空状态、固定表头、行选择和操作区体验。

</div>

`AIITable` 保留 Ant Design `Table` 的数据、列、筛选、排序、展开行和虚拟滚动能力，并提供项目级默认样式与声明式操作配置。

## 特性

- 默认启用简约分页、每页条数切换和总数文案
- 默认使用 `id` 作为行主键，横向滚动宽度为 `max-content`
- 表头自动吸附到最近的滚动容器
- 内置多选提示栏、批量操作和清空选择
- 支持声明式行操作，并自动处理操作列和溢出菜单
- 支持 React 节点、操作数组或左右分区工具栏
- 默认使用项目卡片容器和 i18n 空状态
- 透传其余 Ant Design Table 属性并保留泛型行类型

## 快速开始

```tsx
import type { ColumnsType } from 'antd/es/table';
import { AIITable } from '@/components/AIITable';

interface TableRow {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
}

const columns: ColumnsType<TableRow> = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

export function BasicTable({ dataSource }: { dataSource: TableRow[] }) {
  return (
    <AIITable<TableRow>
      columns={columns}
      dataSource={dataSource}
    />
  );
}
```

> [!IMPORTANT]
> 默认 `rowKey='id'`。每条数据都应包含稳定且唯一的 `id`；使用其他字段时必须显式传入 `rowKey`，不要使用会随排序或分页变化的数组下标。

## 默认行为

| 配置             | 默认值                 | 说明                                        |
| ---------------- | ---------------------- | ------------------------------------------- |
| `rowKey`         | `'id'`                 | 表格行主键                                  |
| `size`           | `'large'`              | Ant Design Table 尺寸                       |
| `paginationMode` | `'simple'`             | 简约分页，只读显示当前页                    |
| `pagination`     | 开启                   | 每页默认 `10` 条，可选 `10 / 20 / 50 / 100` |
| `scroll`         | `{ x: 'max-content' }` | 列较多时启用横向滚动                        |
| `sticky`         | `true`                 | 吸附到最近的滚动容器                        |
| `card`           | `true`                 | 使用项目默认卡片容器                        |
| `empty`          | i18n 空状态            | 使用 `common.General.Empty` 文案            |

传入同名属性会覆盖对应默认值。`scroll` 与默认横向滚动配置合并，`locale` 与默认空状态合并。

## 分页

分页配置与 Ant Design `TablePaginationConfig` 一致。即使总数不超过一页，分页器也会保留，以便切换每页条数。

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  pagination={{
    current: 1,
    pageSize: 20,
    total: 126,
    onChange: (current, pageSize) => {
      console.log({ current, pageSize });
    },
  }}
/>
```

使用完整分页器时会显示页码和快速跳转：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  paginationMode='full'
/>
```

关闭分页：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  pagination={false}
/>
```

> [!NOTE]
> 服务端分页、筛选和排序建议使用 [`useTable`](./useTable.md)，由 Hook 生成受控的 `pagination` 和 `onChange`。

## 行选择

`selectionType` 启用项目封装的行选择。也可以传入 `rowSelection` 使用 Ant Design 的完整配置；两者同时存在时，`rowSelection` 中的同名字段优先。

```tsx
import { useState } from 'react';
import type { Key } from 'antd/es/table/interface';

export function SelectableTable({ dataSource }: { dataSource: TableRow[] }) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  return (
    <AIITable<TableRow>
      columns={columns}
      dataSource={dataSource}
      selectionType='checkbox'
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={(keys, rows, info) => {
        setSelectedRowKeys(keys);
        console.log(rows, info.type);
      }}
    />
  );
}
```

单选只需改为 `selectionType='radio'`。非受控场景可通过 `defaultSelectedRowKeys` 设置初始选中项。

> [!NOTE]
> 选择提示栏和批量操作依赖受控的 `selectedRowKeys`。需要这些能力时，请像上例一样同步 `selectedRowKeys`，或直接使用 `useTable` 返回的受控选择属性。

### 选择提示与批量操作

多选模式存在选中项时，表格默认显示选择提示栏。前两个批量操作直接显示，其余操作进入“更多”菜单。

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  selectionType='checkbox'
  selectionAlert={{
    extra: <span>请谨慎执行删除操作</span>,
  }}
  batchActions={[
    {
      key: 'export',
      label: '导出',
      permission: 'user:export',
      onClick: (keys, rows) => console.log(keys, rows),
    },
    {
      key: 'delete',
      label: '删除',
      permission: 'user:delete',
      danger: true,
      disabled: (_keys, rows) => rows.some((row) => row.status === 'enabled'),
      onClick: async (keys) => {
        await api.removeMany(keys);
      },
    },
  ]}
/>
```

设置 `selectionAlert={false}` 可隐藏提示栏，但不会关闭行选择。提示栏中的“取消选择”会触发当前 `rowSelection.onChange` 或 `onSelectionChange`。批量操作同样支持 `permission` 字段。

## 行操作

传入 `rowActions` 后，组件会在表格末尾追加固定在右侧的操作列。操作数量超过 `maxVisible` 时，当前行的所有操作会收进“更多”菜单。

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  rowActions={[
    {
      key: 'edit',
      label: '编辑',
      permission: 'user:edit',
      hidden: (record) => record.status === 'disabled',
      onClick: (record) => openEditor(record.id),
    },
    {
      key: 'delete',
      label: '删除',
      permission: 'user:delete',
      danger: true,
      disabled: (record) => record.status === 'enabled',
      onClick: (record) => api.remove(record.id),
    },
  ]}
  actionColumn={{
    title: '操作',
    width: 140,
    maxVisible: 2,
  }}
/>
```

操作列默认宽度为 `160`、居中对齐、固定在右侧，最多直接显示两个操作。`hidden` 和 `disabled` 均支持布尔值或基于当前行的判断函数。配置 `permission`（对应宿主 `menuCode`）后，无权限的操作会自动隐藏，详见 [Access](./Access.md)。

完全自定义操作列：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  actionColumn={{
    column: {
      title: '详情',
      width: 96,
      render: (_, record) => <a onClick={() => openDetail(record.id)}>查看</a>,
    },
  }}
/>
```

> [!NOTE]
> `actionColumn.column` 会忽略 `rowActions` 并完整接管操作列。设置 `actionColumn={false}` 会强制隐藏声明式或自定义操作列。

## 工具栏

`toolbar` 渲染在表格上方。简单场景可直接传入 React 节点：

```tsx
import { Button } from 'antd';
import { Plus } from '@icon-park/react';

<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  toolbar={
    <Button
      type='primary'
      icon={<Plus />}
      onClick={openCreator}
    >
      新建
    </Button>
  }
/>;
```

声明式操作数组会在右侧依次渲染：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  toolbar={[
    { key: 'export', label: '导出', onClick: exportRows },
    { key: 'create', label: '新建', type: 'primary', onClick: openCreator },
  ]}
/>
```

需要左右分区或溢出菜单时使用配置对象：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={dataSource}
  toolbar={{
    left: <span>共 {dataSource.length} 条</span>,
    right: <StatusFilter />,
    actions: [
      { key: 'import', label: '导入', onClick: importRows },
      { key: 'export', label: '导出', onClick: exportRows },
      { key: 'create', label: '新建', type: 'primary', onClick: openCreator },
    ],
    maxVisible: 2,
  }}
/>
```

工具栏操作支持 `icon`、`type`、`danger`、`disabled`、`hidden` 和 `permission`。配置对象的 `className` 作用于工具栏容器；顶层 `toolbarClassName` 也可追加容器样式。

## 外观与原生能力

关闭默认卡片容器：

```tsx
<AIITable<TableRow>
  card={false}
  columns={columns}
  dataSource={dataSource}
/>
```

覆盖滚动、吸顶和空状态：

```tsx
<AIITable<TableRow>
  columns={columns}
  dataSource={[]}
  scroll={{ x: 1200, y: 480 }}
  sticky={{ offsetHeader: 64 }}
  empty='暂无符合条件的数据'
/>
```

`columns`、`loading`、`onChange`、`expandable`、`components`、`virtual` 等其余属性沿用 Ant Design Table。使用 `virtual` 时必须同时提供数值类型的 `scroll.x` 和 `scroll.y`。

## 属性

以下为项目新增或重新定义的属性，其余属性参考 Ant Design Table。

| 属性                     | 类型                                  | 默认值                 | 说明                  |
| ------------------------ | ------------------------------------- | ---------------------- | --------------------- |
| `rowKey`                 | `TableProps['rowKey']`                | `'id'`                 | 行主键                |
| `pagination`             | `TablePaginationConfig \| false`      | 开启                   | 分页配置              |
| `paginationMode`         | `'simple' \| 'full'`                  | `'simple'`             | 分页展示模式          |
| `size`                   | `TableProps['size']`                  | `'large'`              | 表格尺寸              |
| `scroll`                 | `TableProps['scroll']`                | `{ x: 'max-content' }` | 滚动配置              |
| `sticky`                 | `TableProps['sticky']`                | `true`                 | 表头吸顶配置          |
| `wrapperClassName`       | `string`                              | -                      | 默认卡片容器样式      |
| `card`                   | `boolean`                             | `true`                 | 是否使用默认卡片容器  |
| `empty`                  | `ReactNode`                           | i18n 空状态            | 空数据内容            |
| `selectionType`          | `'checkbox' \| 'radio'`               | -                      | 行选择类型            |
| `selectedRowKeys`        | `Key[]`                               | -                      | 受控选中行            |
| `defaultSelectedRowKeys` | `Key[]`                               | -                      | 非受控初始选中行      |
| `onSelectionChange`      | `(keys, rows, info) => void`          | -                      | 选择变化回调          |
| `rowSelection`           | `TableRowSelection`                   | -                      | Ant Design 行选择配置 |
| `selectionAlert`         | `boolean \| { extra, className }`     | 多选时开启             | 选择提示栏            |
| `batchActions`           | `AIITableBatchAction[]`               | `[]`                   | 批量操作              |
| `rowActions`             | `AIITableRowAction[]`                 | -                      | 声明式行操作          |
| `actionColumn`           | `AIITableActionColumnConfig \| false` | -                      | 操作列配置            |
| `toolbar`                | `AIITableToolbar`                     | -                      | 表格顶部工具栏        |
| `toolbarClassName`       | `string`                              | -                      | 工具栏容器样式        |

组件类型、常量和 `getSelectedRows` 工具均从 `@/components/AIITable` 导出。

## 相关文档

- [`useTable`](./useTable.md)：服务端数据、分页、筛选与排序状态
- [`AIISearch`](./AIISearch.md)：列表页查询表单

## 开发检查

```bash
pnpm typecheck
pnpm exec eslint src/components/AIITable
pnpm exec prettier --check src/components/AIITable readme/AIITable.md
```
