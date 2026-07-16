import { BrandSeed, defaultBrandColors, type BrandColors } from '@/constants/brand';
import { DEFAULT_LOCALE } from '@/constants/locale';
import { resolveLocale } from '@/i18n/locale';
import { PREFERENCE_STORAGE_KEY } from '@/constants/storage';
import { DEFAULT_THEME, SUPPORTED_THEMES, type Theme as ThemeMode } from '@/constants/theme';
import { readPersistedState } from '@/store/helpers/readPersistedState';
import type { PreferenceState } from '@/store/preference/types';
import { getMicroGlobalData, isMicroAppEnvironment } from '@/utils/micro';
import { resolveHostTheme } from '@/layout/utils/theme-dom';

const hydrated = readPersistedState<PreferenceState>(PREFERENCE_STORAGE_KEY, 'session');

function resolveTheme(value: unknown): ThemeMode {
  if (typeof value === 'string' && SUPPORTED_THEMES.includes(value as ThemeMode)) {
    return value as ThemeMode;
  }
  return DEFAULT_THEME;
}

export function resolveInitialTheme(hydrated?: unknown): ThemeMode {
  if (isMicroAppEnvironment()) {
    const hostTheme = resolveHostTheme(getMicroGlobalData()?.theme);
    if (hostTheme) return hostTheme;
  }

  return resolveTheme(hydrated);
}

function resolveBrandColorField(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function resolveBrandColor(value: unknown): BrandColors {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      Primary: resolveBrandColorField(obj.Primary, BrandSeed.Primary),
      Success: resolveBrandColorField(obj.Success, BrandSeed.Success),
      Error: resolveBrandColorField(obj.Error, BrandSeed.Error),
      Warning: resolveBrandColorField(obj.Warning, BrandSeed.Warning),
    };
  }

  if (typeof value === 'string' && value.length > 0) {
    return { ...defaultBrandColors, Primary: value };
  }

  return { ...defaultBrandColors };
}

export function resolveInitialBrandColor(hydrated?: unknown): BrandColors {
  if (!isMicroAppEnvironment()) {
    return { ...defaultBrandColors };
  }

  return resolveBrandColor(hydrated);
}

export const initialPreferenceState: PreferenceState = {
  locale: resolveLocale(hydrated?.locale),
  brandColor: resolveInitialBrandColor(hydrated?.brandColor),
  theme: resolveInitialTheme(hydrated?.theme),
};

export const defaultPreferenceState: PreferenceState = {
  locale: DEFAULT_LOCALE,
  brandColor: { ...defaultBrandColors },
  theme: DEFAULT_THEME,
};
