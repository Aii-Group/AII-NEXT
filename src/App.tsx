import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider } from '@tanstack/react-router';
import { useMicroAppData } from '@/hooks/use-micro-app-data';
import { ThemeRoot } from '@/providers/ThemeRoot';
import { useThemeSync } from '@/layout/utils/theme';
import { AppAuthProvider } from '@/providers/AppAuthProvider';
import { AntdAppProvider } from '@/providers/AntdAppProvider';
import { DrawerProvider } from '@/providers/DrawerProvider';
import { ModalProvider } from '@/providers/ModalProvider';
import { AntdProvider } from '@/providers/AntdProvider';
import { IconParkProvider } from '@/providers/IconParkProvider';
import { router } from '@/router';
import i18n from '@/i18n';

export default function App() {
  useMicroAppData();
  useThemeSync();

  return (
    <ThemeRoot>
      <I18nextProvider i18n={i18n}>
        <AppAuthProvider>
          <Suspense fallback={null}>
            <AntdProvider>
              <AntdAppProvider>
                <ModalProvider>
                  <DrawerProvider>
                    <IconParkProvider>
                      <RouterProvider router={router} />
                    </IconParkProvider>
                  </DrawerProvider>
                </ModalProvider>
              </AntdAppProvider>
            </AntdProvider>
          </Suspense>
        </AppAuthProvider>
      </I18nextProvider>
    </ThemeRoot>
  );
}
