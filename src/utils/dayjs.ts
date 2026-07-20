/**
 * 应用内唯一 dayjs 入口。
 *
 * Ant Design DatePicker / TimePicker / Calendar 依赖同一 dayjs 实例上的插件与 locale。
 * 业务与 Provider 一律从此处导入，禁止直接 `import dayjs from 'dayjs'`，以免出现多实例。
 */
import dayjs from 'dayjs';
import type { ConfigType, Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import localeData from 'dayjs/plugin/localeData';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';

import { DEFAULT_LOCALE, Locale, type Locale as AppLocale } from '@/constants/locale';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(utc);

/** 应用 Locale → dayjs locale 名 */
export const DAYJS_LOCALES = {
  [Locale.ZhCN]: 'zh-cn',
  [Locale.EnUS]: 'en',
} as const;

/** 常用展示格式 */
export const DateFormat = {
  Date: 'YYYY-MM-DD',
  DateTime: 'YYYY-MM-DD HH:mm:ss',
  DateTimeMinute: 'YYYY-MM-DD HH:mm',
  Time: 'HH:mm:ss',
  Month: 'YYYY-MM',
  Year: 'YYYY',
  Quarter: 'YYYY-[Q]Q',
} as const;

export type DateFormatPreset = (typeof DateFormat)[keyof typeof DateFormat];

/** 空日期 / 无效日期的缺省展示 */
export const EMPTY_DATE = '-' as const;

/** 切换 dayjs 全局语言（与 ConfigProvider / 偏好 locale 同步） */
export function setDayjsLocale(locale: AppLocale = DEFAULT_LOCALE) {
  dayjs.locale(DAYJS_LOCALES[locale] ?? DAYJS_LOCALES[DEFAULT_LOCALE]);
}

/** 解析为有效 Dayjs；无效或空值返回 null */
export function toDayjs(value?: ConfigType): Dayjs | null {
  if (value == null || value === '') return null;
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/**
 * 格式化日期；无效值返回缺省文案。
 * @param fallback 缺省展示，默认 `-`
 */
export function formatDate(value?: ConfigType, format: string = DateFormat.Date, fallback: string = EMPTY_DATE): string {
  const parsed = toDayjs(value);
  return parsed ? parsed.format(format) : fallback;
}

/**
 * 格式化日期时间，默认 `YYYY-MM-DD HH:mm:ss`。
 * @param fallback 缺省展示，默认 `-`
 */
export function formatDateTime(value?: ConfigType, format: string = DateFormat.DateTime, fallback: string = EMPTY_DATE): string {
  return formatDate(value, format, fallback);
}

/**
 * 相对时间文案（需已设置 locale）。
 * @param fallback 缺省展示，默认 `-`
 */
export function formatFromNow(value?: ConfigType, fallback: string = EMPTY_DATE): string {
  const parsed = toDayjs(value);
  return parsed ? parsed.fromNow() : fallback;
}

setDayjsLocale(DEFAULT_LOCALE);

export type { ConfigType, Dayjs };
export { dayjs };
export default dayjs;
