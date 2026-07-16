import type { Key } from 'antd/es/table/interface';
import type { TableProps } from 'antd';

export function getRowKeyValue<RecordType extends object>(
  record: RecordType,
  index: number,
  rowKey: TableProps<RecordType>['rowKey'],
): Key {
  if (typeof rowKey === 'function') return rowKey(record, index);
  if (rowKey === undefined) {
    const value = (record as Record<string, unknown>).key;
    if (value === undefined || value === null) return index;
    return value as Key;
  }
  const value = (record as Record<string, unknown>)[rowKey as string];
  if (value === undefined || value === null) return index;
  return value as Key;
}

export function getSelectedRows<RecordType extends object>(
  dataSource: readonly RecordType[] | undefined,
  selectedRowKeys: Key[] | undefined,
  rowKey: TableProps<RecordType>['rowKey'],
): RecordType[] {
  if (!dataSource?.length || !selectedRowKeys?.length) return [];

  const keySet = new Set(selectedRowKeys.map(String));

  return dataSource.filter((record, index) => keySet.has(String(getRowKeyValue(record, index, rowKey))));
}
