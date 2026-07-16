import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd';
import { ModalContext } from '@/contexts/modal-context';
import type { ModalAPI, ModalConfig } from '@/types/modal';

interface ModalState {
  open: boolean;
  loading: boolean;
  config: ModalConfig;
}

const initialState: ModalState = {
  open: false,
  loading: false,
  config: {},
};

const DEFAULT_MODAL_CONFIG = {
  destroyOnHidden: true,
} satisfies Partial<ModalConfig>;

const withModalDefaults = (config: ModalConfig): ModalConfig => ({
  ...DEFAULT_MODAL_CONFIG,
  ...config,
});

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [state, setState] = useState<ModalState>(initialState);
  const instanceIdRef = useRef(0);

  const close = useCallback(() => {
    instanceIdRef.current += 1;
    setState((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

  const open = useCallback((config: ModalConfig) => {
    instanceIdRef.current += 1;
    setState({ open: true, loading: false, config: withModalDefaults(config) });
  }, []);

  const update = useCallback((config: Partial<ModalConfig>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const api = useMemo<ModalAPI>(() => ({ open, close, update, setLoading }), [open, close, update, setLoading]);

  const { children: modalChildren, confirmLoading, onCancel, onOk, ...modalProps } = state.config;
  const isConfirmLoading = state.loading || Boolean(confirmLoading);

  const handleCancel = useCallback<NonNullable<ModalProps['onCancel']>>(
    (event) => {
      onCancel?.(event);
      close();
    },
    [onCancel, close],
  );

  const handleOk = useCallback<NonNullable<ModalProps['onOk']>>(
    (event) => {
      if (isConfirmLoading) return;

      const result = onOk?.(event);
      if (!(result instanceof Promise)) return;

      const instanceId = instanceIdRef.current;
      setLoading(true);

      void result
        .then(
          () => {
            if (instanceIdRef.current === instanceId) close();
          },
          () => undefined,
        )
        .finally(() => {
          if (instanceIdRef.current === instanceId) setLoading(false);
        });
    },
    [isConfirmLoading, onOk, close, setLoading],
  );

  return (
    <ModalContext.Provider value={api}>
      {children}
      <Modal
        {...withModalDefaults(modalProps)}
        open={state.open}
        confirmLoading={isConfirmLoading}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        {modalChildren}
      </Modal>
    </ModalContext.Provider>
  );
}
