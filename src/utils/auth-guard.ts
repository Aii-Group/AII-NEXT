import { redirect } from '@tanstack/react-router';
import { resolveAuthToken } from '@asiainfo/auth';
import { useUserStore } from '@/store/user/store';
import { isMicroAppEnvironment } from '@/utils/micro';

function hasKeycloakEnv() {
  const url = import.meta.env.VITE_KEYCLOAK_URL?.trim();
  const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim();
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim();
  return Boolean(url && realm && clientId);
}

/**
 * 本地 Keycloak 开关：
 * - 微前端 / 生产构建：关闭（宿主或网关接管）
 * - 独立开发：仅当 VITE_KEYCLOAK_* 三项均已配置时启用，避免空配置启动报错
 */
export const isAuthEnabled = !(isMicroAppEnvironment() || import.meta.env.PROD) && hasKeycloakEnv();

/** 从用户 store 或 Keycloak provider 解析 access token（优先同步缓存，避免 beforeLoad 瀑布） */
export async function resolveAccessToken() {
  const cached = useUserStore.getState().user?.token;
  if (cached) return cached;

  return (await resolveAuthToken()) ?? undefined;
}

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.endsWith(path);
}

/** 无需 token 即可访问，避免根守卫与跳转目标互相重定向 */
function isPublicAuthPath(pathname: string) {
  return matchesPath(pathname, '/login') || matchesPath(pathname, '/403');
}

/**
 * 无 token 时拦截，挂在根路由 beforeLoad，覆盖全部业务路由。
 * - 非微前端：跳转 `/login`
 * - 微前端：跳转 `/403`（登录由宿主接管）
 * - `/login`、`/403` 放行，避免死循环
 */
export async function requireAuthToken(pathname: string) {
  if (isPublicAuthPath(pathname)) {
    return;
  }

  const token = await resolveAccessToken();

  if (!token) {
    throw redirect({ to: isMicroAppEnvironment() ? '/403' : '/login' });
  }

  return token;
}
