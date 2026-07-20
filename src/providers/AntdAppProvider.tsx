import { useEffect, type ReactNode } from 'react';
import { App } from 'antd';

interface AntdAppProviderProps {
  children: ReactNode;
}

function AntdAppGlobals() {
  const { message, notification, modal } = App.useApp();

  useEffect(() => {
    window.$message = message;
    window.$notification = notification;
    window.$modal = modal;
  }, [message, notification, modal]);

  return null;
}

export function AntdAppProvider({ children }: AntdAppProviderProps) {
  return (
    <App message={{ maxCount: 2 }}>
      <AntdAppGlobals />
      {children}
    </App>
  );
}
