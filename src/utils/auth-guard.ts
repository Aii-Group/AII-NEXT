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

/**
 * 无 token 时跳转 403，供受保护路由的 beforeLoad 使用。
 * 本地关闭 Keycloak 且非微前端时放行，便于示例页与无 IdP 联调。
 */
export async function requireAuthToken() {
  if (!isAuthEnabled && !isMicroAppEnvironment()) {
    return useUserStore.getState().user?.token;
  }

  const token = await resolveAccessToken();

  if (!token) {
    throw redirect({ to: '/403' });
  }

  return token;
}
