import type { ModalProps } from 'antd';

type ModalOnOk = NonNullable<ModalProps['onOk']>;

export type ModalConfig = Omit<ModalProps, 'open' | 'onOk'> & {
  onOk?: (...args: Parameters<ModalOnOk>) => void | Promise<unknown>;
};

export interface ModalAPI {
  open: (config: ModalConfig) => void;
  close: () => void;
  update: (config: Partial<ModalConfig>) => void;
  setLoading: (loading: boolean) => void;
}
