import type { ReactNode } from 'react';
import { Theme } from '@/constants/theme';
import { resolveTheme } from '@/layout/utils/theme-dom';
import { usePreferenceStore } from '@/store/preference/store';
import { cn } from '@/utils/classnames';

interface ThemeRootProps {
  children: ReactNode;
}

/** 在 micro-app 沙箱内承载 .dark，驱动 Tailwind token 切换 */
export function ThemeRoot({ children }: ThemeRootProps) {
  const theme = usePreferenceStore((state) => state.theme);
  const isDark = resolveTheme(theme) === Theme.Dark;

  return <div className={cn(isDark && 'dark')}>{children}</div>;
}
