import { memo, useCallback, type ReactNode } from 'react';
import { Button, Form, Space } from 'antd';
import { Down } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/classnames';
import type { AIISearchActionRenderContext } from '../types';
import { Search, Clear } from '@icon-park/react';

export interface SearchActionsProps {
  ctx: AIISearchActionRenderContext;
  searchText?: ReactNode;
  resetText?: ReactNode;
  expandText?: ReactNode;
  collapseText?: ReactNode;
  className?: string;
}

function SearchActionsInner({ ctx, searchText, resetText, expandText, collapseText, className }: SearchActionsProps) {
  const { t } = useTranslation('common');
  const { collapsed, collapsible, loading, reset, toggleCollapse } = ctx;

  const handleToggle = useCallback(() => {
    toggleCollapse();
  }, [toggleCollapse]);

  return (
    <Form.Item
      colon={false}
      className={cn('mb-0!', className)}
    >
      <Space size='small'>
        <Button
          type='primary'
          htmlType='submit'
          loading={loading}
          icon={<Search />}
        >
          {searchText ?? t('AII_Search.Search')}
        </Button>
        <Button
          htmlType='button'
          disabled={loading}
          onClick={reset}
          icon={<Clear />}
        >
          {resetText ?? t('AII_Search.Reset')}
        </Button>
        {collapsible ? (
          <Button
            type='link'
            htmlType='button'
            className='inline-flex items-center gap-1 px-0!'
            onClick={handleToggle}
          >
            {collapsed ? (expandText ?? t('AII_Search.Expand')) : (collapseText ?? t('AII_Search.Collapse'))}
            <Down
              size={14}
              className={cn('transition-transform duration-200', !collapsed && 'rotate-180')}
            />
          </Button>
        ) : null}
      </Space>
    </Form.Item>
  );
}

export const SearchActions = memo(SearchActionsInner);
