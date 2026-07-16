import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES, type Locale as LocaleType } from '@/constants/locale';
import { resolveLocale } from '@/i18n/locale';
import { loadLocaleResources } from '@/i18n/resources';
import { isMicroAppEnvironment } from '@/utils';

const APP_NAMES: Record<LocaleType, string | undefined> = {
  [Locale.ZhCN]: import.meta.env.VITE_APP_NAME_ZH,
  [Locale.EnUS]: import.meta.env.VITE_APP_NAME_EN,
};

function syncDocumentLocale(language: unknown) {
  const locale = resolveLocale(language);
  const appName = APP_NAMES[locale]?.trim();

  document.documentElement.lang = locale;
  if (appName && !isMicroAppEnvironment()) document.title = appName;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: loadLocaleResources(),
    supportedLngs: [...SUPPORTED_LOCALES],
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator'],
      caches: [],
    },
  });

i18n.on('languageChanged', syncDocumentLocale);

syncDocumentLocale(i18n.resolvedLanguage ?? DEFAULT_LOCALE);

export default i18n;
