import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES, type Locale as LocaleType } from '@/constants/locale';

export function normalizeLang(lang: unknown): LocaleType | undefined {
  if (typeof lang !== 'string') return undefined;

  const normalized = lang.trim();
  if (!normalized) return undefined;

  if (SUPPORTED_LOCALES.includes(normalized as LocaleType)) {
    return normalized as LocaleType;
  }

  const lower = normalized.toLowerCase();
  if (lower === 'en' || lower.startsWith('en-')) {
    return Locale.EnUS;
  }
  if (lower === 'zh' || lower.startsWith('zh-')) {
    return Locale.ZhCN;
  }

  return undefined;
}

export function resolveLocale(value: unknown): LocaleType {
  return normalizeLang(value) ?? DEFAULT_LOCALE;
}
