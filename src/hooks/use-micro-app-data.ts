import { useEffect } from 'react';
import type { BrandColorPatch, BrandColors } from '@/constants/brand';
import { type Locale } from '@/constants/locale';
import { normalizeLang } from '@/i18n/locale';
import type { Theme as ThemeMode } from '@/constants/theme';
import type { MicroAppBrandColors, MicroAppGlobalData } from '@/types/micro-host';
import { resolveHostTheme } from '@/layout/utils/theme-dom';
import { addMicroGlobalDataListener, getMicroGlobalData, isMicroAppEnvironment, removeMicroGlobalDataListener } from '@/utils/micro';
import { usePreferenceStore } from '@/store/preference/store';
import { useUserStore } from '@/store/user/store';

function resolveHostLocale(data: MicroAppGlobalData): Locale | undefined {
  return normalizeLang(data.lang) ?? normalizeLang(data.userInfo?.locale);
}

function mapMicroBrandColors(host?: MicroAppBrandColors): BrandColorPatch | undefined {
  if (!host) return undefined;

  const patch: BrandColorPatch = {};

  if (typeof host.colorPrimary === 'string' && host.colorPrimary.length > 0) {
    patch.Primary = host.colorPrimary;
  }
  if (typeof host.colorSuccess === 'string' && host.colorSuccess.length > 0) {
    patch.Success = host.colorSuccess;
  }
  if (typeof host.colorError === 'string' && host.colorError.length > 0) {
    patch.Error = host.colorError;
  }
  if (typeof host.colorWarning === 'string' && host.colorWarning.length > 0) {
    patch.Warning = host.colorWarning;
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

function hasUserIdentity(userInfo: MicroAppGlobalData['userInfo']): boolean {
  if (!userInfo) return false;

  return Boolean(userInfo.userIdStr || userInfo.userId || userInfo.userName || userInfo.token);
}

/** 从主应用同步偏好设置（mount 时调用） */
export function syncMicroAppPreferenceFromHost() {
  if (!isMicroAppEnvironment()) return;

  const data = getMicroGlobalData() as MicroAppGlobalData | null;
  if (data) {
    applyMicroAppGlobalData(data);
  }
}

/** 将主应用全局数据同步到本地 store */
export function applyMicroAppGlobalData(data: MicroAppGlobalData) {
  const { setUser, clearUser } = useUserStore.getState();
  const { updatePreference } = usePreferenceStore.getState();
  const userInfo = data.userInfo;

  if (hasUserIdentity(userInfo)) {
    setUser({
      ...userInfo,
      locale: resolveHostLocale(data) ?? userInfo?.locale ?? data.lang,
      // 宿主未携带该字段时保留本地已有权限，避免局部更新清空 ACL
      permissionsButton: 'permissionsButton' in data ? data.permissionsButton : useUserStore.getState().user?.permissionsButton,
    });
  } else if (userInfo) {
    clearUser();
  }

  const preferencePatch: Partial<{
    locale: Locale;
    theme: ThemeMode;
    brandColor: BrandColors;
  }> = {};

  const locale = resolveHostLocale(data);
  if (locale) {
    preferencePatch.locale = locale;
  }

  const theme = resolveHostTheme(data.theme);
  if (theme) {
    preferencePatch.theme = theme;
  }

  if (isMicroAppEnvironment()) {
    const brandColorPatch = mapMicroBrandColors(data.brandColor);
    if (brandColorPatch) {
      preferencePatch.brandColor = {
        ...usePreferenceStore.getState().brandColor,
        ...brandColorPatch,
      };
    }
  }

  if (Object.keys(preferencePatch).length > 0) {
    updatePreference(preferencePatch);
  }
}

/** 微前端环境下监听主应用下发的全局数据 */
export function useMicroAppData() {
  useEffect(() => {
    if (!isMicroAppEnvironment()) return;

    syncMicroAppPreferenceFromHost();

    const listener = (data: MicroAppGlobalData) => {
      applyMicroAppGlobalData(data);
    };

    addMicroGlobalDataListener(listener, false);

    return () => {
      removeMicroGlobalDataListener(listener);
    };
  }, []);
}
