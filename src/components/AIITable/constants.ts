import type { TablePaginationConfig } from 'antd';

export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const AII_TABLE_PAGINATION_CLASS = 'aii-table-pagination';

export const AII_TABLE_PAGINATION_FULL_CLASS = 'aii-table-pagination-full';

export const BASE_PAGINATION: TablePaginationConfig = {
  defaultPageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: [...DEFAULT_PAGE_SIZE_OPTIONS],
  hideOnSinglePage: false,
  showSizeChanger: true,
  totalBoundaryShowSizeChanger: 0,
  size: 'medium',
  className: AII_TABLE_PAGINATION_CLASS,
};

export const SIMPLE_PAGINATION: TablePaginationConfig = {
  ...BASE_PAGINATION,
  simple: { readOnly: true },
  showQuickJumper: false,
};

export const FULL_PAGINATION: TablePaginationConfig = {
  ...BASE_PAGINATION,
  showQuickJumper: true,
};

export const DEFAULT_SCROLL = {
  x: 'max-content',
  // y: 'max(15rem, calc(100dvh - 24rem))',
} as const;

export const DEFAULT_ROW_KEY = 'id' as const;

export const EMPTY_BATCH_ACTIONS: never[] = [];

export const ACTION_COLUMN_KEY = '__aii_action__';

export const DEFAULT_MAX_VISIBLE_ROW_ACTIONS = 2;

export const DEFAULT_ACTION_COLUMN_WIDTH = 180;
