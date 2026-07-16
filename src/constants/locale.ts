export const Locale = {
  ZhCN: 'zh-CN',
  EnUS: 'en-US',
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const SUPPORTED_LOCALES = [Locale.ZhCN, Locale.EnUS] as const;

export const DEFAULT_LOCALE = Locale.ZhCN;

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.ZhCN]: '简体中文',
  [Locale.EnUS]: 'English',
};
