import { redirect } from '@tanstack/react-router';
import { resolveAuthToken } from '@asiainfo/auth';
import { useUserStore } from '@/store/user/store';

// const isAuthEnabled = !(isMicroAppEnvironment() || import.meta.env.PROD);

export const isAuthEnabled = false;

/** 从用户 store 或 Keycloak provider 解析 access token（优先同步缓存，避免 beforeLoad 瀑布） */
export async function resolveAccessToken() {
  const cached = useUserStore.getState().user?.token;
  if (cached) return cached;

  return (await resolveAuthToken()) ?? undefined;
}

/** 无 token 时跳转 403，供受保护路由的 beforeLoad 使用 */
export async function requireAuthToken() {
  const token = await resolveAccessToken();

  if (!token) {
    throw redirect({ to: '/403' });
  }

  return token;
}
