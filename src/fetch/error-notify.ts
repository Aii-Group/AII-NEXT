/** 全局错误提示限流窗口：服务崩溃时大量并发失败只展示首条 */
export const FETCH_ERROR_NOTIFY_INTERVAL_MS = 2_000;

let lockedUntil = 0;

/**
 * 请求错误全局提示限流（leading）：
 * - 窗口内首次错误立即提示
 * - 窗口内后续错误静默（仍会 reject，业务可自行处理）
 * - 避免服务崩溃时页面连环 Toast / 宿主连环报错
 */
export function runWithFetchErrorNotifyLimit(notify: () => void): boolean {
  const now = Date.now();
  if (now < lockedUntil) {
    return false;
  }

  lockedUntil = now + FETCH_ERROR_NOTIFY_INTERVAL_MS;
  notify();
  return true;
}

/** 独立环境：限流后弹出错误 Toast */
export function notifyStandaloneFetchError(message: string) {
  runWithFetchErrorNotifyLimit(() => {
    window.$message.error(message);
  });
}
