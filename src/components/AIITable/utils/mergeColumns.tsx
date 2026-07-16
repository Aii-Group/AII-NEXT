import type { TFunction } from 'i18next';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import { ActionCell } from '../components/ActionCell';
import { ACTION_COLUMN_KEY, DEFAULT_ACTION_COLUMN_WIDTH, DEFAULT_MAX_VISIBLE_ROW_ACTIONS } from '../constants';
import type { AIITableActionColumnConfig, AIITableRowAction } from '../types';

export function mergeColumns<RecordType extends object>(
  columns: ColumnsType<RecordType> | undefined,
  rowActions: AIITableRowAction<RecordType>[] | undefined,
  actionColumn: AIITableActionColumnConfig<RecordType> | false | undefined,
  t: TFunction<'common'>,
): ColumnsType<RecordType> | undefined {
  const baseColumns = columns ?? [];

  if (actionColumn === false) {
    return baseColumns.length > 0 ? baseColumns : undefined;
  }

  if (actionColumn?.column) {
    return [
      ...baseColumns,
      {
        ...actionColumn.column,
        fixed: actionColumn.column.fixed ?? actionColumn.fixed ?? 'right',
      },
    ];
  }

  if (!rowActions?.length) {
    return baseColumns.length > 0 ? baseColumns : undefined;
  }

  const { column: _actionColumn, ...actionColumnRest } = actionColumn ?? {};
  void _actionColumn;
  const {
    title,
    width = DEFAULT_ACTION_COLUMN_WIDTH,
    fixed = 'right',
    maxVisible = DEFAULT_MAX_VISIBLE_ROW_ACTIONS,
    ...columnProps
  } = actionColumnRest;

  const actionCol: ColumnType<RecordType> = {
    key: ACTION_COLUMN_KEY,
    title: title ?? t('AII_Table.Action'),
    width,
    fixed,
    align: 'center',
    ...columnProps,
    render: (_value, record, index) => (
      <ActionCell
        actions={rowActions}
        record={record}
        index={index}
        maxVisible={maxVisible}
      />
    ),
  };

  return [...baseColumns, actionCol];
}
