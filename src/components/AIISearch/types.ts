import type { Breakpoint, FormItemProps, FormProps, RowProps } from 'antd';
import type { ReactNode } from 'react';

export type AIISearchResponsiveCols = Partial<Record<Breakpoint, number>>;

export interface AIISearchItem<Values = unknown> extends Omit<FormItemProps<Values>, 'hidden' | 'children'> {
  /** 列表 key；未传时回退 `name` */
  key?: string;
  children: ReactNode;
  /** 自定义栅格占位（24 栅格），默认按当前列数均分 */
  colSpan?: number;
  /** 收起时仍强制展示 */
  alwaysShow?: boolean;
  /** 完全隐藏该项 */
  hidden?: boolean;
}

export interface AIISearchActionRenderContext {
  collapsed: boolean;
  collapsible: boolean;
  loading?: boolean;
  submit: () => void;
  reset: () => void;
  toggleCollapse: () => void;
}

export interface AIISearchProps<Values = Record<string, unknown>> extends Omit<FormProps<Values>, 'children' | 'layout' | 'colon'> {
  /** 搜索表单项 */
  items: AIISearchItem<Values>[];
  /** 提交搜索；等同 Form `onFinish` */
  onSearch?: (values: Values) => void | Promise<void>;
  /** 重置后回调；默认会 `resetFields` */
  onReset?: () => void;
  /** 受控收起状态 */
  collapsed?: boolean;
  /** 非受控默认是否收起，默认 `true` */
  defaultCollapsed?: boolean;
  /** 收起状态变化 */
  onCollapse?: (collapsed: boolean) => void;
  /** 按 antd `xs/sm/md/lg/xl/xxl/xxxl` 响应式断点设置每行列数 */
  cols?: AIISearchResponsiveCols;
  /** 最大每行列数，默认 `8` */
  maxCols?: number;
  /** Row gutter，默认 `[16, 16]` */
  gutter?: RowProps['gutter'];
  /** 表单布局，默认 `vertical` */
  layout?: FormProps['layout'];
  /** 是否显示冒号，默认 `false` */
  colon?: boolean;
  /** 是否展示操作区（查询 / 重置 / 展开），默认 `true` */
  showActions?: boolean;
  /** 查询按钮文案 */
  searchText?: ReactNode;
  /** 重置按钮文案 */
  resetText?: ReactNode;
  /** 展开文案 */
  expandText?: ReactNode;
  /** 收起文案 */
  collapseText?: ReactNode;
  /** 提交按钮 loading */
  loading?: boolean;
  /** 自定义操作区；返回 `false` 可隐藏默认操作区 */
  actions?: ReactNode | ((ctx: AIISearchActionRenderContext) => ReactNode | false);
  /** 是否包裹卡片容器，默认 `true` */
  card?: boolean;
  /** 外层容器 className */
  wrapperClassName?: string;
  /** 字段区 className */
  fieldsClassName?: string;
  /** 操作区 className */
  actionsClassName?: string;
}
