import { useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOne } from '@icon-park/react';
import type { AIITableRowAction } from '../types';

const DEFAULT_MAX_VISIBLE = 2;

function isRowActionDisabled<RecordType extends object>(action: AIITableRowAction<RecordType>, record: RecordType, index: number) {
  return typeof action.disabled === 'function' ? action.disabled(record, index) : action.disabled;
}

function isRowActionHidden<RecordType extends object>(action: AIITableRowAction<RecordType>, record: RecordType, index: number) {
  return typeof action.hidden === 'function' ? action.hidden(record, index) : action.hidden;
}

function RowActionButton<RecordType extends object>({
  action,
  record,
  index,
}: {
  action: AIITableRowAction<RecordType>;
  record: RecordType;
  index: number;
}) {
  return (
    <Button
      type='text'
      size='small'
      icon={action.icon}
      danger={action.danger}
      disabled={isRowActionDisabled(action, record, index)}
      onClick={() => action.onClick(record, index)}
    >
      {action.label}
    </Button>
  );
}

export interface ActionCellProps<RecordType extends object> {
  actions: AIITableRowAction<RecordType>[];
  record: RecordType;
  index: number;
  maxVisible?: number;
}

export function ActionCell<RecordType extends object>({
  actions,
  record,
  index,
  maxVisible = DEFAULT_MAX_VISIBLE,
}: ActionCellProps<RecordType>) {
  const visibleActions = useMemo(() => actions.filter((action) => !isRowActionHidden(action, record, index)), [actions, index, record]);

  const shouldCollapse = visibleActions.length > maxVisible;
  const inlineActions = shouldCollapse ? [] : visibleActions;
  const dropdownActions = shouldCollapse ? visibleActions : [];

  const dropdownMenuItems = useMemo<MenuProps['items']>(
    () =>
      dropdownActions.map((action) => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        danger: action.danger,
        disabled: isRowActionDisabled(action, record, index),
        onClick: () => action.onClick(record, index),
      })),
    [dropdownActions, index, record],
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      {inlineActions.map((action) => (
        <RowActionButton
          key={action.key}
          action={action}
          record={record}
          index={index}
        />
      ))}

      {dropdownActions.length > 0 ? (
        <Dropdown
          trigger={['click']}
          menu={{ items: dropdownMenuItems }}
        >
          <Button
            type='text'
            size='small'
            icon={<MoreOne />}
          />
        </Dropdown>
      ) : null}
    </div>
  );
}
