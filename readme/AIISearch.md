<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# AIISearch

面向列表页查询场景的响应式搜索表单，统一处理字段栅格、展开收起、查询重置和自定义操作区。

</div>

`AIISearch` 基于 Ant Design `Form` 和 24 栅格系统封装。它会根据当前断点调整每行字段数，在字段超过首行容量时提供展开与收起，并保留 Ant Design 表单的校验、初始值和受控表单能力。

## 特性

- 按 `xs` 至 `xxxl` 断点自动调整每行字段数
- 支持受控或非受控的展开收起状态
- 支持固定展示、完全隐藏和自定义栅格跨度的字段
- 内置查询、重置和展开按钮，文案接入项目 i18n
- 支持自定义操作节点或基于上下文的操作渲染函数
- 兼容 Ant Design `FormProps`、`FormInstance` 和字段校验
- 展开动画遵循项目动效配置和减少动态效果偏好

## 快速开始

```tsx
import { Input, Select } from 'antd';
import { AIISearch, type AIISearchItem } from '@/components/AIISearch';

type SearchValues = {
  username?: string;
  email?: string;
  enabled?: boolean;
};

const items: AIISearchItem<SearchValues>[] = [
  {
    name: 'username',
    label: '用户名',
    children: (
      <Input
        allowClear
        placeholder='请输入用户名'
      />
    ),
  },
  {
    name: 'email',
    label: '邮箱',
    children: (
      <Input
        allowClear
        placeholder='请输入邮箱'
      />
    ),
  },
  {
    name: 'enabled',
    label: '状态',
    children: (
      <Select
        allowClear
        placeholder='请选择状态'
        options={[
          { label: '启用', value: true },
          { label: '停用', value: false },
        ]}
      />
    ),
  },
];

export function UserSearch() {
  return (
    <AIISearch<SearchValues>
      items={items}
      onSearch={(values) => {
        console.log('查询条件', values);
      }}
      onReset={() => {
        console.log('查询条件已重置');
      }}
    />
  );
}
```

> [!NOTE]
> 点击重置会调用 `form.resetFields()`，随后触发 `onReset`，但不会自动再次提交表单。需要刷新列表时，请在 `onReset` 中主动发起请求。

## 与 useTable 配合

列表页通常将查询值交给 `useTable` 的 `run` 方法。提交新条件时会从第一页请求，重置时可不带条件重新请求。

```tsx
const { tableProps, run } = useTable(api.list, {
  rowKey: 'id',
});

return (
  <>
    <AIISearch<SearchValues>
      wrapperClassName='mb-4'
      items={items}
      onSearch={(values) => run(values)}
      onReset={() => run()}
    />
    <AIITable
      {...tableProps}
      columns={columns}
    />
  </>
);
```

## 响应式布局

默认每行字段数如下：

| 断点 | `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `xxxl` |
| ---- | ---: | ---: | ---: | ---: | ---: | ----: | -----: |
| 列数 |    1 |    2 |    3 |    3 |    4 |     6 |      8 |

通过 `cols` 覆盖指定断点，通过 `maxCols` 设置所有断点允许的最大列数。未提供的断点仍使用默认值。

```tsx
<AIISearch
  items={items}
  cols={{ xs: 1, md: 2, xl: 3, xxl: 4 }}
  maxCols={4}
/>
```

默认字段宽度按 24 栅格均分。不能整除时向下取整，避免字段溢出当前行。单个字段可通过 `colSpan` 覆盖响应式宽度：

```tsx
const items = [
  {
    name: 'keyword',
    label: '关键词',
    colSpan: 12,
    children: <Input />,
  },
  {
    name: 'description',
    label: '描述',
    colSpan: 24,
    children: <Input.TextArea />,
  },
];
```

> [!TIP]
> `colSpan` 使用 Ant Design 的 24 栅格值，并会被限制为最多 `24`。设置后该字段不再使用 `cols` 生成的响应式宽度。

## 展开与收起

组件默认处于收起状态。可见字段超过当前断点的首行容量时，超出的字段进入可展开区域，操作按钮会移动到独立的右对齐行。

### 固定展示字段

`alwaysShow` 字段在收起状态下仍然可见，并优先占用首行容量。

```tsx
const items = [
  {
    name: 'tenantId',
    label: '租户',
    alwaysShow: true,
    children: <Select options={tenantOptions} />,
  },
  // 其他字段
];
```

> [!IMPORTANT]
> 当 `alwaysShow` 字段数量超过当前断点的列数时，这些字段仍会全部显示，因此可能占用多行。

### 受控状态

```tsx
const [collapsed, setCollapsed] = useState(true);

<AIISearch
  items={items}
  collapsed={collapsed}
  onCollapse={setCollapsed}
/>;
```

非受控模式使用 `defaultCollapsed` 设置初始值：

```tsx
<AIISearch
  items={items}
  defaultCollapsed={false}
/>
```

## 自定义操作区

传入 React 节点可完全替换默认操作区：

```tsx
<AIISearch
  items={items}
  actions={
    <Button
      type='primary'
      htmlType='submit'
    >
      应用筛选
    </Button>
  }
/>
```

渲染函数可使用组件提供的提交、重置和展开能力：

```tsx
<AIISearch
  items={items}
  actions={({ collapsed, collapsible, loading, submit, reset, toggleCollapse }) => (
    <Space>
      <Button
        type='primary'
        loading={loading}
        onClick={submit}
      >
        查询
      </Button>
      <Button
        disabled={loading}
        onClick={reset}
      >
        清空
      </Button>
      {collapsible ? (
        <Button
          type='link'
          onClick={toggleCollapse}
        >
          {collapsed ? '展开' : '收起'}
        </Button>
      ) : null}
    </Space>
  )}
/>
```

渲染函数返回 `false`，或设置 `showActions={false}`，可隐藏操作区。

## 使用外部表单实例

通过 Ant Design `Form.useForm` 可以读取、写入或校验表单。除 `children`、`layout` 和 `colon` 外，标准 `FormProps` 均可传入。

```tsx
const [form] = Form.useForm<SearchValues>();

<AIISearch<SearchValues>
  form={form}
  items={items}
  initialValues={{ enabled: true }}
  onSearch={(values) => run(values)}
/>;
```

`onSearch` 与标准 `onFinish` 都会在校验成功后调用，顺序为 `onSearch(values)`，然后 `onFinish(values)`。

## 字段配置

`AIISearchItem<Values>` 继承 Ant Design `FormItemProps<Values>`，因此可直接使用 `name`、`label`、`rules`、`initialValue`、`dependencies` 等表单项属性。

| 属性         | 类型        | 默认值   | 说明                                           |
| ------------ | ----------- | -------- | ---------------------------------------------- |
| `children`   | `ReactNode` | 必填     | 字段控件                                       |
| `key`        | `string`    | `name`   | React 列表键；未提供 `name` 时使用字段索引生成 |
| `colSpan`    | `number`    | 自动均分 | 字段占用的 24 栅格列数                         |
| `alwaysShow` | `boolean`   | `false`  | 收起时仍然显示                                 |
| `hidden`     | `boolean`   | `false`  | 完全隐藏字段，且不占用收起容量                 |

数组形式的 `name` 会以 `.` 连接后作为默认键。动态增删字段时，建议显式提供稳定的 `key`。

## 组件属性

`AIISearchProps<Values>` 继承 Ant Design `FormProps<Values>`，下表为组件新增或改写的属性。

| 属性               | 类型                                       | 默认值                     | 说明                                     |
| ------------------ | ------------------------------------------ | -------------------------- | ---------------------------------------- |
| `items`            | `AIISearchItem<Values>[]`                  | 必填                       | 搜索字段列表                             |
| `onSearch`         | `(values) => void \| Promise<void>`        | -                          | 表单校验成功后的查询回调                 |
| `onReset`          | `() => void`                               | -                          | `resetFields()` 执行后的回调             |
| `collapsed`        | `boolean`                                  | -                          | 受控收起状态                             |
| `defaultCollapsed` | `boolean`                                  | `true`                     | 非受控初始收起状态                       |
| `onCollapse`       | `(collapsed) => void`                      | -                          | 收起状态变化回调                         |
| `cols`             | `Partial<Record<Breakpoint, number>>`      | 见响应式表格               | 各断点每行字段数                         |
| `maxCols`          | `number`                                   | `8`                        | 每行最大字段数，取值会限制在 `1` 至 `24` |
| `gutter`           | `RowProps['gutter']`                       | `[16, 16]`                 | 字段行的水平和垂直间距                   |
| `layout`           | `FormProps['layout']`                      | `'vertical'`               | Ant Design 表单布局                      |
| `colon`            | `boolean`                                  | `false`                    | 标签后是否显示冒号                       |
| `showActions`      | `boolean`                                  | `true`                     | 是否显示操作区                           |
| `searchText`       | `ReactNode`                                | i18n `AII_Search.Search`   | 查询按钮内容                             |
| `resetText`        | `ReactNode`                                | i18n `AII_Search.Reset`    | 重置按钮内容                             |
| `expandText`       | `ReactNode`                                | i18n `AII_Search.Expand`   | 展开按钮内容                             |
| `collapseText`     | `ReactNode`                                | i18n `AII_Search.Collapse` | 收起按钮内容                             |
| `loading`          | `boolean`                                  | -                          | 查询按钮加载态，同时禁用默认重置按钮     |
| `actions`          | `ReactNode \| (ctx) => ReactNode \| false` | 默认操作区                 | 自定义操作内容                           |
| `card`             | `boolean`                                  | `true`                     | 是否使用 `LayoutWrapper` 卡片容器        |
| `wrapperClassName` | `string`                                   | -                          | 卡片容器类名，仅 `card=true` 时生效      |
| `fieldsClassName`  | `string`                                   | -                          | 字段区域外层类名                         |
| `actionsClassName` | `string`                                   | -                          | 默认操作区的 `Form.Item` 类名            |
| `className`        | `string`                                   | -                          | Ant Design `Form` 类名                   |

## 操作上下文

自定义 `actions` 渲染函数接收 `AIISearchActionRenderContext`：

| 字段             | 类型                   | 说明                         |
| ---------------- | ---------------------- | ---------------------------- |
| `collapsed`      | `boolean`              | 当前是否收起                 |
| `collapsible`    | `boolean`              | 当前断点下是否存在可展开字段 |
| `loading`        | `boolean \| undefined` | 当前加载状态                 |
| `submit`         | `() => void`           | 提交并校验表单               |
| `reset`          | `() => void`           | 重置字段并调用 `onReset`     |
| `toggleCollapse` | `() => void`           | 切换展开状态                 |

## 导出内容

```ts
import DefaultAIISearch, {
  AIISearch,
  DEFAULT_COLLAPSED,
  DEFAULT_GUTTER,
  DEFAULT_MAX_COLS,
  DEFAULT_RESPONSIVE_COLS,
  GRID_COLUMNS,
  type AIISearchActionRenderContext,
  type AIISearchItem,
  type AIISearchProps,
} from '@/components/AIISearch';
```

> [!NOTE]
> 该组件是 AII-NEXT 的内部组件，默认依赖项目中的 Ant Design、Tailwind CSS、i18next、IconPark、Motion、路由上下文和 `LayoutWrapper`。在项目外复用时，需要同时迁移这些运行环境或替换对应的内部依赖。
