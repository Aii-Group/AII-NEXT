import { forwardRef, memo, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Empty, Table } from 'antd';
import type { GetRef } from 'antd';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/classnames';
import { LayoutWrapper } from '@/components/Wrapper';
import { SelectionAlert } from './components/SelectionAlert';
import { TableToolbar } from './components/TableToolbar';
import { DEFAULT_ROW_KEY, DEFAULT_SCROLL } from './constants';
import { getSelectedRows } from './utils/getSelectedRows';
import { mergeColumns } from './utils/mergeColumns';
import { mergePagination } from './utils/mergePagination';
import { mergeRowSelection } from './utils/mergeRowSelection';
import { mergeSticky } from './utils/mergeSticky';
import { getTableColSpan, mergeTableComponents } from './utils/mergeTableComponents';
import type { AIITableProps } from './types';
import './styles/pagination.css';

export type {
  AIITableActionColumnConfig,
  AIITableBatchAction,
  AIITablePaginationMode,
  AIITableProps,
  AIITableRowAction,
  AIITableSelectionAlertConfig,
  AIITableSelectionInfo,
  AIITableSelectionType,
  AIITableToolbar,
  AIITableToolbarAction,
  AIITableToolbarConfig,
} from './types';
export {
  ACTION_COLUMN_KEY,
  AII_TABLE_PAGINATION_CLASS,
  AII_TABLE_PAGINATION_FULL_CLASS,
  DEFAULT_ACTION_COLUMN_WIDTH,
  DEFAULT_MAX_VISIBLE_ROW_ACTIONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_ROW_KEY,
  DEFAULT_SCROLL,
  FULL_PAGINATION,
  SIMPLE_PAGINATION,
} from './constants';
export { getSelectedRows } from './utils/getSelectedRows';

export type AIITableRef = GetRef<typeof Table>;

function AIITableInner<RecordType extends object = object>(
  {
    rowKey = DEFAULT_ROW_KEY,
    pagination,
    paginationMode = 'simple',
    size = 'large',
    scroll,
    wrapperClassName,
    card = true,
    empty,
    locale: localeProp,
    selectionType,
    selectedRowKeys,
    defaultSelectedRowKeys,
    onSelectionChange,
    rowSelection,
    selectionAlert,
    batchActions,
    rowActions,
    actionColumn,
    toolbar,
    toolbarClassName,
    columns,
    dataSource,
    components,
    expandable,
    virtual,
    sticky = true,
    className,
    ...rest
  }: AIITableProps<RecordType>,
  ref: React.ForwardedRef<AIITableRef>,
) {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);

  const mergedPagination = useMemo(() => mergePagination(pagination, paginationMode, t), [pagination, paginationMode, t]);

  const mergedScroll = useMemo(
    () => ({
      ...DEFAULT_SCROLL,
      ...scroll,
    }),
    [scroll],
  );

  const mergedSticky = useMemo(() => mergeSticky(sticky, containerRef), [sticky]);

  const mergedEmptyText = useMemo(() => {
    if (localeProp?.emptyText !== undefined) return localeProp.emptyText;
    if (empty !== undefined) {
      if (typeof empty === 'string') {
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={empty}
          />
        );
      }
      return empty;
    }
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('General.Empty')}
      />
    );
  }, [empty, localeProp?.emptyText, t]);

  const mergedLocale = useMemo(
    () => ({
      ...localeProp,
      emptyText: mergedEmptyText,
    }),
    [localeProp, mergedEmptyText],
  );

  const mergedRowSelection = useMemo(
    () => mergeRowSelection(selectionType, selectedRowKeys, defaultSelectedRowKeys, onSelectionChange, rowSelection),
    [defaultSelectedRowKeys, onSelectionChange, rowSelection, selectedRowKeys, selectionType],
  );

  const selectionAlertConfig = typeof selectionAlert === 'object' ? selectionAlert : undefined;
  const selectionAlertEnabled = selectionType === 'checkbox' && selectionAlert !== false;
  const selectedCount = selectedRowKeys?.length ?? 0;
  const showSelectionAlert = selectionAlertEnabled && selectedCount > 0;

  const selectedRows = useMemo(() => getSelectedRows(dataSource, selectedRowKeys, rowKey), [dataSource, rowKey, selectedRowKeys]);

  const handleClearSelection = useCallback(() => {
    const onChange = rowSelection?.onChange ?? onSelectionChange;
    onChange?.([], [], { type: 'none' });
  }, [onSelectionChange, rowSelection?.onChange]);

  const batchActionItems = batchActions ?? [];

  const mergedColumns = useMemo(() => mergeColumns(columns, rowActions, actionColumn, t), [actionColumn, columns, rowActions, t]);

  const selectionAlertNode = showSelectionAlert ? (
    <SelectionAlert
      selectedRowKeys={selectedRowKeys ?? []}
      selectedRows={selectedRows}
      onClear={handleClearSelection}
      actions={batchActionItems}
      extra={selectionAlertConfig?.extra}
      className={selectionAlertConfig?.className}
    />
  ) : null;

  const tableColSpan = useMemo(
    () =>
      getTableColSpan(mergedColumns?.length ?? 1, {
        hasSelection: Boolean(mergedRowSelection),
        hasExpand: Boolean(expandable),
      }),
    [expandable, mergedColumns?.length, mergedRowSelection],
  );

  const mergedComponents = useMemo(
    () =>
      mergeTableComponents(components, {
        alert: virtual ? null : selectionAlertNode,
        colSpan: tableColSpan,
        virtual,
      }),
    [components, selectionAlertNode, tableColSpan, virtual],
  );

  const toolbarNode = toolbar ? (
    <TableToolbar
      toolbar={toolbar}
      className={toolbarClassName}
    />
  ) : null;

  const table = (
    <>
      {toolbarNode}
      {virtual && selectionAlertNode}
      <div ref={containerRef}>
        <Table<RecordType>
          ref={ref}
          rowKey={rowKey}
          size={size}
          scroll={mergedScroll}
          sticky={mergedSticky}
          pagination={mergedPagination}
          locale={mergedLocale}
          rowSelection={mergedRowSelection}
          columns={mergedColumns}
          dataSource={dataSource}
          components={mergedComponents}
          expandable={expandable}
          virtual={virtual}
          bordered={false}
          className={cn(card && 'bg-transparent', className)}
          {...rest}
        />
      </div>
    </>
  );

  if (!card) return table;

  return <LayoutWrapper className={cn('px-4! py-6!', wrapperClassName)}>{table}</LayoutWrapper>;
}

const AIITableForwardRef = forwardRef(AIITableInner) as <RecordType extends object = object>(
  props: AIITableProps<RecordType> & { ref?: React.ForwardedRef<AIITableRef> },
) => ReactNode;

export const AIITable = memo(AIITableForwardRef) as typeof AIITableForwardRef;

export default AIITable;
