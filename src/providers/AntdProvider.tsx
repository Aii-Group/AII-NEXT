import { useEffect, useMemo, type ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { DEFAULT_LOCALE, Locale, Theme } from '@/constants';
import { useResolvedTheme } from '@/layout/utils/theme';
import { antdThemeConfig } from '@/theme/antd-theme';
import { usePreferenceStore } from '@/store/preference/store';
import { setDayjsLocale } from '@/utils/dayjs';

const { defaultAlgorithm, darkAlgorithm } = theme;

const antdLocales = {
  [Locale.ZhCN]: zhCN,
  [Locale.EnUS]: enUS,
} as const;

interface AntdProviderProps {
  children: ReactNode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  const locale = usePreferenceStore((state) => state.locale);
  const brandColor = usePreferenceStore((state) => state.brandColor);
  const resolvedTheme = useResolvedTheme();
  const antdLocale = antdLocales[locale] ?? antdLocales[DEFAULT_LOCALE];

  useEffect(() => {
    setDayjsLocale(locale);
  }, [locale]);

  const themeConfig = useMemo(
    () => ({
      ...antdThemeConfig,
      token: {
        ...antdThemeConfig.token,
        colorPrimary: brandColor.Primary,
        colorSuccess: brandColor.Success,
        colorError: brandColor.Error,
        colorWarning: brandColor.Warning,
        colorInfo: brandColor.Primary,
        colorLink: brandColor.Primary,
      },
      algorithm: resolvedTheme === Theme.Dark ? darkAlgorithm : defaultAlgorithm,
    }),
    [brandColor, resolvedTheme],
  );

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={themeConfig}
    >
      {children}
    </ConfigProvider>
  );
}
