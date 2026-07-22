import type { TableProps, ButtonProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { Key, RowSelectMethod, TableRowSelection } from 'antd/es/table/interface';
import type { ReactNode } from 'react';

export type AIITableSelectionType = 'checkbox' | 'radio';

export type AIITablePaginationMode = 'simple' | 'full';

export interface AIITableSelectionInfo {
  type: RowSelectMethod;
}

export interface AIITableBatchAction<RecordType extends object = object> {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
  /** 按钮权限码（`PermissionsButton.menuCode`），无权限时隐藏 */
  permission?: string;
  disabled?: boolean | ((selectedRowKeys: Key[], selectedRows: RecordType[]) => boolean);
  onClick: (selectedRowKeys: Key[], selectedRows: RecordType[]) => void | Promise<void>;
}

export interface AIITableRowAction<RecordType extends object = object> {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
  /** 按钮权限码（`PermissionsButton.menuCode`），无权限时隐藏 */
  permission?: string;
  hidden?: boolean | ((record: RecordType, index: number) => boolean);
  disabled?: boolean | ((record: RecordType, index: number) => boolean);
  onClick: (record: RecordType, index: number) => void | Promise<void>;
}

export interface AIITableActionColumnConfig<RecordType extends object = object> extends Omit<
  Partial<ColumnType<RecordType>>,
  'render' | 'fixed' | 'key'
> {
  /** 列标题，默认 i18n `AII_Table.Action` */
  title?: ReactNode;
  /** 列宽，默认 `160` */
  width?: number;
  /** 固定列，默认 `right` */
  fixed?: ColumnType<RecordType>['fixed'];
  /** 平铺显示的操作数，超出收入 Dropdown，默认 `2` */
  maxVisible?: number;
  /** 完全自定义操作列，传入后忽略 `rowActions` */
  column?: ColumnType<RecordType>;
}

export interface AIITableSelectionAlertConfig {
  /** 左侧附加内容 */
  extra?: ReactNode;
  className?: string;
}

export interface AIITableToolbarAction {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  type?: ButtonProps['type'];
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  /** 按钮权限码（`PermissionsButton.menuCode`），无权限时隐藏 */
  permission?: string;
  onClick: () => void | Promise<void>;
}

export interface AIITableToolbarConfig {
  /** 左侧内容 */
  left?: ReactNode;
  /** 右侧自定义内容 */
  right?: ReactNode;
  /** 右侧操作按钮，超出 `maxVisible` 时收入下拉菜单 */
  actions?: AIITableToolbarAction[];
  /** 平铺显示的操作数，超出收入 Dropdown，默认全部平铺 */
  maxVisible?: number;
  className?: string;
}

export type AIITableToolbar = ReactNode | ReactNode[] | AIITableToolbarAction[] | AIITableToolbarConfig;

export interface AIITableProps<RecordType extends object = object> extends Omit<
  TableProps<RecordType>,
  'locale' | 'pagination' | 'rowKey' | 'scroll' | 'size' | 'rowSelection' | 'sticky'
> {
  /** 行主键，默认 `id`，回退至 `key` */
  rowKey?: TableProps<RecordType>['rowKey'];
  /** 分页配置，`false` 关闭分页 */
  pagination?: TableProps<RecordType>['pagination'];
  /** 分页模式：`simple` 简约 | `full` 完整，默认 `full` */
  paginationMode?: AIITablePaginationMode;
  /** 表格尺寸，默认 `middle` */
  size?: TableProps<RecordType>['size'];
  /** 滚动配置，默认开启横向 `max-content` 和响应式纵向表体滚动 */
  scroll?: TableProps<RecordType>['scroll'];
  /** 表头吸顶，默认开启；`false` 关闭；对象可配置 `offsetHeader` / `getContainer` 等 */
  sticky?: TableProps<RecordType>['sticky'];
  /** 外层容器 className */
  wrapperClassName?: string;
  /** 是否包裹卡片样式容器，默认 `true` */
  card?: boolean;
  /** 自定义空状态，默认使用 i18n `common.empty` */
  empty?: ReactNode;
  locale?: TableProps<RecordType>['locale'];
  /** 行选择类型：`checkbox` 多选，`radio` 单选 */
  selectionType?: AIITableSelectionType;
  /** 受控已选行 key */
  selectedRowKeys?: Key[];
  /** 非受控默认已选行 key */
  defaultSelectedRowKeys?: Key[];
  /** 选择变化回调 */
  onSelectionChange?: (selectedRowKeys: Key[], selectedRows: RecordType[], info: AIITableSelectionInfo) => void;
  /** 透传 antd rowSelection，与上方选择 props 合并 */
  rowSelection?: TableRowSelection<RecordType>;
  /** 多选提示栏，`checkbox` 模式默认开启 */
  selectionAlert?: boolean | AIITableSelectionAlertConfig;
  /** 多选提示栏右侧批量操作按钮 */
  batchActions?: AIITableBatchAction<RecordType>[];
  /** 行操作按钮，传入后自动追加操作列 */
  rowActions?: AIITableRowAction<RecordType>[];
  /** 操作列配置；`column` 可完全自定义；`false` 强制隐藏 */
  actionColumn?: AIITableActionColumnConfig<RecordType> | false;
  /** 表格顶部工具栏，渲染在表头上方；支持 ReactNode、操作数组或 `{ left, right, actions }` */
  toolbar?: AIITableToolbar;
  /** 工具栏容器 className，仅 `toolbar` 为 ReactNode 时生效 */
  toolbarClassName?: string;
}
