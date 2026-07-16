import type { TFunction } from 'i18next';
import type { TablePaginationConfig } from 'antd';
import { cn } from '@/utils/classnames';
import { AII_TABLE_PAGINATION_CLASS, AII_TABLE_PAGINATION_FULL_CLASS, FULL_PAGINATION, SIMPLE_PAGINATION } from '../constants';
import type { AIITablePaginationMode, AIITableProps } from '../types';

function buildSharedPaginationConfig(t: TFunction<'common'>): TablePaginationConfig {
  return {
    showTotal: (total) => t('AII_Table.Pagination_Total', { total }),
    showSizeChanger: {
      prefix: `${t('AII_Table.Page_Size_Label')}:`,
      variant: 'borderless',
      popupMatchSelectWidth: true,
      showSearch: false,
      classNames: {
        popup: {
          root: 'aii-table-page-size-popup',
        },
      },
    },
    className: AII_TABLE_PAGINATION_CLASS,
  };
}

function buildSimplePagination(t: TFunction<'common'>): TablePaginationConfig {
  return {
    ...SIMPLE_PAGINATION,
    ...buildSharedPaginationConfig(t),
  };
}

function buildFullPagination(t: TFunction<'common'>): TablePaginationConfig {
  return {
    ...FULL_PAGINATION,
    ...buildSharedPaginationConfig(t),
    className: `${AII_TABLE_PAGINATION_CLASS} ${AII_TABLE_PAGINATION_FULL_CLASS}`,
  };
}

export function mergePagination<RecordType extends object>(
  pagination: AIITableProps<RecordType>['pagination'],
  paginationMode: AIITablePaginationMode,
  t: TFunction<'common'>,
): TablePaginationConfig | false {
  if (pagination === false) return false;

  const base = paginationMode === 'simple' ? buildSimplePagination(t) : buildFullPagination(t);

  if (!pagination || typeof pagination !== 'object') {
    return base;
  }

  return {
    ...base,
    ...pagination,
    className: cn(base.className, pagination.className),
  };
}
