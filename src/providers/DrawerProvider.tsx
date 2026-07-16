import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Drawer } from 'antd';
import type { DrawerProps } from 'antd';
import type { DrawerAPI, DrawerConfig } from '@/types/drawer';

interface DrawerState {
  open: boolean;
  config: DrawerConfig;
}

const initialState: DrawerState = {
  open: false,
  config: {},
};

const DEFAULT_DRAWER_CONFIG = {
  resizable: true,
} satisfies Partial<DrawerConfig>;

const withDrawerDefaults = (config: DrawerConfig): DrawerConfig => ({
  ...DEFAULT_DRAWER_CONFIG,
  ...config,
});

interface DrawerProviderProps {
  children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [state, setState] = useState<DrawerState>(initialState);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const open = useCallback((config: DrawerConfig) => {
    setState({ open: true, config: withDrawerDefaults(config) });
  }, []);

  const update = useCallback((config: Partial<DrawerConfig>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const api = useMemo<DrawerAPI>(() => ({ open, close, update }), [open, close, update]);

  useEffect(() => {
    window.$drawer = api;
  }, [api]);

  const { children: drawerChildren, onClose, afterOpenChange, ...drawerProps } = state.config;

  const handleClose = useCallback<NonNullable<DrawerProps['onClose']>>(
    (event) => {
      onClose?.(event);
      close();
    },
    [onClose, close],
  );

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      afterOpenChange?.(open);
    },
    [afterOpenChange],
  );

  return (
    <>
      {children}
      <Drawer
        {...withDrawerDefaults(drawerProps)}
        open={state.open}
        onClose={handleClose}
        afterOpenChange={handleAfterOpenChange}
      >
        {drawerChildren}
      </Drawer>
    </>
  );
}

export type { DrawerAPI, DrawerConfig };
