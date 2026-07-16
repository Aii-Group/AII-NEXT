import { useEffect } from 'react';
import { Theme, type Theme as ThemeMode } from '@/constants/theme';
import { applyTheme, resolveTheme } from '@/layout/utils/theme-dom';
import { usePreferenceStore } from '@/store/preference/store';

export { applyTheme, getResolvedTheme, getSystemTheme, resolveTheme } from '@/layout/utils/theme-dom';

export function useThemeSync() {
  const theme = usePreferenceStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}

export function useThemeMode() {
  const theme = usePreferenceStore((state) => state.theme);
  const setTheme = usePreferenceStore((state) => state.setTheme);
  const toggleTheme = usePreferenceStore((state) => state.toggleTheme);

  useEffect(() => {
    const handleSystemThemeChange = () => {
      if (usePreferenceStore.getState().theme === Theme.System) {
        applyTheme(Theme.System);
      }
    };

    window.addEventListener('aii-system-theme-change', handleSystemThemeChange);
    return () => window.removeEventListener('aii-system-theme-change', handleSystemThemeChange);
  }, []);

  return {
    theme,
    resolvedTheme: resolveTheme(theme),
    setTheme,
    toggleTheme,
  };
}

export function useResolvedTheme() {
  const theme = usePreferenceStore((state) => state.theme);
  return resolveTheme(theme);
}

export function initTheme(theme: ThemeMode = usePreferenceStore.getState().theme) {
  applyTheme(theme);
}
