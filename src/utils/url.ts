/** 解析 URL 查询参数为对象 */
export function parseSearchParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/** 将对象序列化为查询字符串（不含前导 ?） */
export function stringifySearchParams(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/** 拼接路径与查询参数 */
export function buildUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return path;
  const query = stringifySearchParams(params);
  if (query.length === 0) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${query}`;
}
