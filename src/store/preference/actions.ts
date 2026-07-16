import type { BrandColors } from '@/constants/brand';
import type { Locale } from '@/constants/locale';
import { Theme, type Theme as ThemeMode } from '@/constants/theme';
import i18n from '@/i18n';
import { applyThemeWithTransition, resolveTheme, type ThemeTransitionOrigin } from '@/layout/utils/theme-dom';
import type { StoreSetter } from '@/store/types';
import { defaultPreferenceState } from '@/store/preference/initialState';
import type { PreferenceState } from '@/store/preference/types';
import { isMicroAppEnvironment } from '@/utils/micro';

export type PreferenceStore = PreferenceState & PreferenceAction;

type Setter = StoreSetter<PreferenceStore>;

export class PreferenceActionImpl {
  readonly #set: Setter;
  readonly #get: () => PreferenceStore;

  constructor(set: Setter, get: () => PreferenceStore) {
    this.#set = set;
    this.#get = get;
  }

  setLocale = (locale: Locale) => {
    this.#set({ locale });
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
  };

  setTheme = (theme: ThemeMode, origin?: ThemeTransitionOrigin) => {
    applyThemeWithTransition(theme, origin, () => {
      this.#set({ theme });
    });
  };

  toggleTheme = (origin?: ThemeTransitionOrigin) => {
    const { theme } = this.#get();
    const resolved = resolveTheme(theme);
    this.setTheme(resolved === Theme.Dark ? Theme.Light : Theme.Dark, origin);
  };

  setBrandColor = (brandColor: Partial<BrandColors>) => {
    if (!isMicroAppEnvironment()) return;

    this.#set({ brandColor: { ...this.#get().brandColor, ...brandColor } });
  };

  updatePreference = (partial: Partial<PreferenceState>) => {
    const current = this.#get();
    const next: PreferenceState = {
      ...current,
      ...partial,
      brandColor: partial.brandColor && isMicroAppEnvironment() ? { ...current.brandColor, ...partial.brandColor } : current.brandColor,
    };

    const localeChanged = partial.locale !== undefined && next.locale !== current.locale;
    const themeChanged = partial.theme !== undefined && next.theme !== current.theme;
    const brandColorChanged =
      partial.brandColor !== undefined &&
      isMicroAppEnvironment() &&
      (Object.keys(partial.brandColor) as (keyof BrandColors)[]).some((key) => next.brandColor[key] !== current.brandColor[key]);

    if (!localeChanged && !themeChanged && !brandColorChanged) {
      return;
    }

    if (localeChanged) {
      void i18n.changeLanguage(next.locale);
      document.documentElement.lang = next.locale;
    }

    if (themeChanged) {
      applyThemeWithTransition(next.theme, undefined, () => {
        this.#set({
          locale: next.locale,
          brandColor: next.brandColor,
          theme: next.theme,
        });
      });
      return;
    }

    this.#set({
      locale: next.locale,
      brandColor: next.brandColor,
      theme: next.theme,
    });
  };

  resetPreference = () => {
    this.updatePreference(defaultPreferenceState);
  };
}

export type PreferenceAction = Pick<PreferenceActionImpl, keyof PreferenceActionImpl>;

export const createPreferenceSlice = (set: Setter, get: () => PreferenceStore) => new PreferenceActionImpl(set, get);
