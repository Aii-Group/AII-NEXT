import type { FormItemProps } from 'antd';
import type { AIISearchItem } from '../types';

export interface SplitSearchItemResult<Values> {
  key?: AIISearchItem<Values>['key'];
  colSpan?: number;
  alwaysShow?: boolean;
  hidden?: boolean;
  children: AIISearchItem<Values>['children'];
  formItemProps: FormItemProps<Values>;
}

/** 将搜索项拆成栅格配置与 Form.Item props，避免透传自定义字段 */
export function splitSearchItem<Values>(item: AIISearchItem<Values>): SplitSearchItemResult<Values> {
  const { key, colSpan, alwaysShow, hidden, children, ...formItemProps } = item;
  return { key, colSpan, alwaysShow, hidden, children, formItemProps };
}
