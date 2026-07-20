import { useEffect, type ReactNode } from 'react';
import { AuthProvider, type AuthSuccessPayload, createKeycloakConfigFromEnv, getAppOrigin, useAuth } from '@asiainfo/auth';
import { useUserStore } from '@/store/user/store';
import { Spin } from 'antd';
import { registerSessionLogoutHandler } from '@/fetch/session-expired';
import { isAuthEnabled } from '@/utils/auth-guard';

interface AppAuthProviderProps {
  children: ReactNode;
}

function AuthBootFallback() {
  return (
    <div className='flex h-screen items-center justify-center'>
      <Spin size='large' />
    </div>
  );
}

function handleLogout() {
  useUserStore.getState().clearUser();
}

function handleAuthSuccess({ keycloak, profile }: AuthSuccessPayload) {
  const { setUser } = useUserStore.getState();

  setUser({
    userIdStr: keycloak.subject,
    userId: keycloak.subject,
    userName: profile?.username,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
    email: profile?.email,
    token: keycloak.token,
  });
}

/** 将 Keycloak logout 注册给请求层 401 处理，避免拦截器依赖 React Hook */
function SessionLogoutBridge() {
  const { enabled, logout } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    return registerSessionLogoutHandler(() =>
      logout({
        redirectUri: `${getAppOrigin()}/login`,
      }),
    );
  }, [enabled, logout]);

  return null;
}

export function AppAuthProvider({ children }: AppAuthProviderProps) {
  if (!isAuthEnabled) {
    return <AuthProvider enabled={false}>{children}</AuthProvider>;
  }

  const keycloakConfig = createKeycloakConfigFromEnv({
    // 生产环境走同源 /auth 反向代理
    useProductionProxy: true,
  });

  return (
    <AuthProvider
      config={keycloakConfig}
      initOptions={{
        onLoad: 'login-required',
      }}
      fallback={<AuthBootFallback />}
      onAuthSuccess={handleAuthSuccess}
      onLogout={handleLogout}
    >
      <SessionLogoutBridge />
      {children}
    </AuthProvider>
  );
}
