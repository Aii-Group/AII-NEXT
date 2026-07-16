export const Theme = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type Theme = (typeof Theme)[keyof typeof Theme];

export const SUPPORTED_THEMES = [Theme.Light, Theme.Dark, Theme.System] as const;

export const DEFAULT_THEME = Theme.System;

/** 应用到 document.documentElement 的 class */
export const ThemeClass = {
  [Theme.Light]: '',
  [Theme.Dark]: 'dark',
} as const satisfies Record<Exclude<Theme, typeof Theme.System>, string>;
