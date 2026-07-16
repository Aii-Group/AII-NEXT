import { useMemo, type ReactNode } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { Key } from 'antd/es/table/interface';
import { Down } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/classnames';
import type { AIITableBatchAction } from '../types';

const MAX_VISIBLE_ACTIONS = 2;

export interface SelectionAlertProps<RecordType extends object> {
  selectedRowKeys: Key[];
  selectedRows: RecordType[];
  onClear: () => void;
  actions: AIITableBatchAction<RecordType>[];
  extra?: ReactNode;
  className?: string;
}

function isActionDisabled<RecordType extends object>(
  action: AIITableBatchAction<RecordType>,
  selectedRowKeys: Key[],
  selectedRows: RecordType[],
) {
  return typeof action.disabled === 'function' ? action.disabled(selectedRowKeys, selectedRows) : action.disabled;
}

function BatchActionButton<RecordType extends object>({
  action,
  selectedRowKeys,
  selectedRows,
}: {
  action: AIITableBatchAction<RecordType>;
  selectedRowKeys: Key[];
  selectedRows: RecordType[];
}) {
  const disabled = isActionDisabled(action, selectedRowKeys, selectedRows);

  return (
    <Button
      type='text'
      danger={action.danger}
      disabled={disabled}
      icon={action.icon}
      onClick={() => action.onClick(selectedRowKeys, selectedRows)}
    >
      {action.label}
    </Button>
  );
}

export function SelectionAlert<RecordType extends object>({
  selectedRowKeys,
  selectedRows,
  onClear,
  actions,
  extra,
  className,
}: SelectionAlertProps<RecordType>) {
  const { t } = useTranslation('common');

  const visibleActions = actions.slice(0, MAX_VISIBLE_ACTIONS);
  const overflowActions = actions.slice(MAX_VISIBLE_ACTIONS);

  const overflowMenuItems = useMemo<MenuProps['items']>(
    () =>
      overflowActions.map((action) => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        danger: action.danger,
        disabled: isActionDisabled(action, selectedRowKeys, selectedRows),
        onClick: () => action.onClick(selectedRowKeys, selectedRows),
      })),
    [overflowActions, selectedRowKeys, selectedRows],
  );

  return (
    <div className={cn('my-2.5 flex items-center justify-between gap-4 bg-primary-bg px-4 py-4 text-sm text-foreground', className)}>
      <div className='flex flex-wrap items-center gap-2'>
        <span>{t('AII_Table.Selected', { count: selectedRowKeys.length })}</span>
        <Button
          type='text'
          className='h-auto p-0'
          onClick={onClear}
        >
          {t('AII_Table.Uncheck')}
        </Button>
        {extra}
      </div>

      {actions.length > 0 ? (
        <div className='flex flex-wrap items-center'>
          {visibleActions.map((action) => (
            <BatchActionButton
              key={action.key}
              action={action}
              selectedRowKeys={selectedRowKeys}
              selectedRows={selectedRows}
            />
          ))}

          {overflowActions.length > 0 ? (
            <Dropdown
              trigger={['click']}
              menu={{ items: overflowMenuItems }}
            >
              <Button
                type='text'
                className='inline-flex h-auto items-center gap-1 p-0'
              >
                {t('AII_Table.More')}
                <Down
                  theme='outline'
                  size='14'
                />
              </Button>
            </Dropdown>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
