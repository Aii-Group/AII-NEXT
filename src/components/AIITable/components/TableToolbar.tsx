import { Fragment, isValidElement, useMemo, type ReactNode } from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Down } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import type { PermissionsButton } from '@/store/user/types';
import { useUserStore } from '@/store/user/store';
import { cn } from '@/utils/classnames';
import { isPermissionAllowed } from '@/utils/permission';
import type { AIITableToolbar, AIITableToolbarAction, AIITableToolbarConfig } from '../types';

function isToolbarAction(value: unknown): value is AIITableToolbarAction {
  return typeof value === 'object' && value !== null && 'key' in value && 'label' in value && 'onClick' in value;
}

function isToolbarActionArray(toolbar: AIITableToolbar): toolbar is AIITableToolbarAction[] {
  return Array.isArray(toolbar) && toolbar.length > 0 && isToolbarAction(toolbar[0]);
}

function isToolbarConfig(toolbar: AIITableToolbar): toolbar is AIITableToolbarConfig {
  return (
    typeof toolbar === 'object' &&
    toolbar !== null &&
    !Array.isArray(toolbar) &&
    !isValidElement(toolbar) &&
    ('left' in toolbar || 'right' in toolbar || 'actions' in toolbar)
  );
}

function isToolbarNodeArray(toolbar: AIITableToolbar): toolbar is ReactNode[] {
  return Array.isArray(toolbar) && (toolbar.length === 0 || !isToolbarAction(toolbar[0]));
}

function isToolbarActionVisible(action: AIITableToolbarAction, permissionsButton: PermissionsButton[] | undefined) {
  if (!isPermissionAllowed(action.permission, permissionsButton)) return false;
  return !action.hidden;
}

function ToolbarActionButton({ action }: { action: AIITableToolbarAction }) {
  return (
    <Button
      type={action.type ?? 'text'}
      danger={action.danger}
      disabled={action.disabled}
      icon={action.icon}
      onClick={() => action.onClick()}
    >
      {action.label}
    </Button>
  );
}

function ToolbarActions({ actions, maxVisible }: { actions: AIITableToolbarAction[]; maxVisible?: number }) {
  const { t } = useTranslation('common');
  const permissionsButton = useUserStore((state) => state.user?.permissionsButton);

  const visibleActions = useMemo(
    () => actions.filter((action) => isToolbarActionVisible(action, permissionsButton)),
    [actions, permissionsButton],
  );

  const inlineLimit = maxVisible ?? visibleActions.length;
  const inlineActions = visibleActions.slice(0, inlineLimit);
  const overflowActions = visibleActions.slice(inlineLimit);

  const overflowMenuItems = useMemo<MenuProps['items']>(
    () =>
      overflowActions.map((action) => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        danger: action.danger,
        disabled: action.disabled,
        onClick: () => action.onClick(),
      })),
    [overflowActions],
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      {inlineActions.map((action) => (
        <ToolbarActionButton
          key={action.key}
          action={action}
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
  );
}

function renderToolbarContent(toolbar: AIITableToolbar): ReactNode {
  if (!toolbar || (Array.isArray(toolbar) && toolbar.length === 0)) return null;

  if (isToolbarConfig(toolbar)) {
    if (!toolbar.left && !toolbar.right && !toolbar.actions?.length) return null;

    return (
      <>
        <div className='flex flex-wrap items-center gap-2'>{toolbar.left}</div>
        <div className='ml-auto flex flex-wrap items-center justify-end gap-2'>
          {toolbar.right}
          {toolbar.actions?.length ? (
            <ToolbarActions
              actions={toolbar.actions}
              maxVisible={toolbar.maxVisible}
            />
          ) : null}
        </div>
      </>
    );
  }

  if (isToolbarActionArray(toolbar)) {
    return <ToolbarActions actions={toolbar} />;
  }

  if (isToolbarNodeArray(toolbar)) {
    return toolbar.map((item, index) => {
      if (isValidElement(item) && item.key != null) {
        return <Fragment key={String(item.key)}>{item}</Fragment>;
      }

      // oxlint-disable-next-line react/no-array-index-key -- ReactNode 列表无稳定业务 key
      return <Fragment key={`toolbar-node-${index}`}>{item}</Fragment>;
    });
  }

  return toolbar;
}

export interface TableToolbarProps {
  toolbar: AIITableToolbar;
  className?: string;
}

export function TableToolbar({ toolbar, className }: TableToolbarProps) {
  const isConfig = isToolbarConfig(toolbar);
  const content = renderToolbarContent(toolbar);
  if (!content) return null;

  const toolbarClassName = isConfig ? toolbar.className : undefined;

  return (
    <div className={cn('mb-3 flex items-center gap-4', isConfig ? 'justify-between' : 'justify-end', toolbarClassName, className)}>
      {content}
    </div>
  );
}
