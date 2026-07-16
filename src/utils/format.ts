const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** 格式化字节大小 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(decimals)} ${BYTE_UNITS[index]}`;
}

/** 格式化数字（千分位） */
export function formatNumber(value: number, locale = 'zh-CN'): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat(locale).format(value);
}

/** 格式化百分比（0.125 → 12.5%） */
export function formatPercent(value: number, decimals = 1, locale = 'zh-CN'): string {
  if (!Number.isFinite(value)) return '0%';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
