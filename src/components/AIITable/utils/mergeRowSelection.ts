import type { Key, TableRowSelection } from 'antd/es/table/interface';
import { DEFAULT_SELECTION_COLUMN_WIDTH } from '../constants';
import type { AIITableProps } from '../types';

export function mergeRowSelection<RecordType extends object>(
  selectionType: AIITableProps<RecordType>['selectionType'],
  selectedRowKeys: AIITableProps<RecordType>['selectedRowKeys'],
  defaultSelectedRowKeys: AIITableProps<RecordType>['defaultSelectedRowKeys'],
  onSelectionChange: AIITableProps<RecordType>['onSelectionChange'],
  rowSelection: AIITableProps<RecordType>['rowSelection'],
): TableRowSelection<RecordType> | undefined {
  const hasSelectionProps =
    selectionType !== undefined ||
    selectedRowKeys !== undefined ||
    defaultSelectedRowKeys !== undefined ||
    onSelectionChange !== undefined ||
    rowSelection !== undefined;

  if (!hasSelectionProps) return undefined;

  const base: TableRowSelection<RecordType> = {
    columnWidth: DEFAULT_SELECTION_COLUMN_WIDTH,
  };

  if (selectionType) {
    base.type = selectionType;
  }

  if (selectedRowKeys !== undefined) {
    base.selectedRowKeys = selectedRowKeys;
  }

  if (defaultSelectedRowKeys !== undefined) {
    base.defaultSelectedRowKeys = defaultSelectedRowKeys;
  }

  if (onSelectionChange) {
    base.onChange = onSelectionChange;
  }

  if (!rowSelection) {
    return base;
  }

  return {
    ...base,
    ...rowSelection,
    selectedRowKeys: rowSelection.selectedRowKeys ?? (base.selectedRowKeys as Key[] | undefined),
    defaultSelectedRowKeys: rowSelection.defaultSelectedRowKeys ?? (base.defaultSelectedRowKeys as Key[] | undefined),
    onChange: rowSelection.onChange ?? base.onChange,
    type: rowSelection.type ?? base.type,
    columnWidth: rowSelection.columnWidth ?? base.columnWidth,
  };
}
