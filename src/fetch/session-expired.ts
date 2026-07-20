import i18n from '@/i18n';
import { router } from '@/router';
import { useUserStore } from '@/store/user/store';
import { isMicroAppEnvironment } from '@/utils/micro';

type SessionLogoutHandler = () => void | Promise<void>;

let logoutHandler: SessionLogoutHandler | null = null;
let handlingSessionExpired = false;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

const RESET_LOCK_MS = 3_000;

/**
 * 注册会话失效时的登出实现（如 Keycloak logout）。
 * 由 AuthProvider 子树内的桥接组件注册；鉴权关闭时可不注册。
 */
export function registerSessionLogoutHandler(handler: SessionLogoutHandler) {
  logoutHandler = handler;
  return () => {
    if (logoutHandler === handler) {
      logoutHandler = null;
    }
  };
}

function resetHandlingLock() {
  if (resetTimer) {
    clearTimeout(resetTimer);
  }
  resetTimer = setTimeout(() => {
    handlingSessionExpired = false;
    resetTimer = null;
  }, RESET_LOCK_MS);
}

/**
 * 独立应用环境下处理 401 / Token 失效：
 * 清理本地用户、提示、Keycloak 登出或跳转 `/login`。
 * 微前端环境交由宿主处理，此处直接返回。
 * 并发 401 会去重，只执行一次。
 */
export async function handleSessionExpired() {
  if (isMicroAppEnvironment()) return;
  if (handlingSessionExpired) return;

  handlingSessionExpired = true;

  try {
    useUserStore.getState().clearUser();

    const message = i18n.t('Http_401', { ns: 'fetch' });
    window.$message?.warning(message);

    if (logoutHandler) {
      await logoutHandler();
      return;
    }

    const location = router.state.location;
    const alreadyOnLogin = location.pathname === '/login' || location.pathname.endsWith('/login');
    if (!alreadyOnLogin) {
      await router.navigate({ to: '/login', replace: true });
    }
  } catch (error) {
    console.error('[session] failed to recover from expired session', error);
  } finally {
    resetHandlingLock();
  }
}
