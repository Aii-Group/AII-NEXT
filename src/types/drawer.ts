import type { DrawerProps } from 'antd';

export type DrawerConfig = Omit<DrawerProps, 'open'>;

export interface DrawerAPI {
  open: (config: DrawerConfig) => void;
  close: () => void;
  update: (config: Partial<DrawerConfig>) => void;
}
