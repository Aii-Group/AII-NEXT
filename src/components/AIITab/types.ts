import type { HTMLAttributes, ReactNode } from 'react';

export interface AIITabItem {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export type AIITabSize = 'sm' | 'md' | 'lg';

export interface AIITabBarExtraContent {
  left?: ReactNode;
  right?: ReactNode;
}

export interface AIITabProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: AIITabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (activeKey: string) => void;
  size?: AIITabSize;
  centered?: boolean;
  destroyOnHidden?: boolean;
  tabBarExtraContent?: ReactNode | AIITabBarExtraContent;
}
