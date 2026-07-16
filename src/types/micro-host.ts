import type { PermissionsButton } from '@/store/user/types';

/** 主应用下发的品牌色令牌，见 micro-app-host global-data */
export interface MicroAppBrandColors {
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
}

/** 主应用下发的用户信息 */
export interface MicroAppHostUser {
  userId?: number | string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  token?: string;
  avatar?: string;
  userIdStr?: string;
  locale?: string;
}

/**
 * 主应用通过 microApp.setGlobalData 下发的全局数据。
 * @see micro-app-host/src/microapp/global-data.ts
 */
export type MicroAppGlobalData = {
  userInfo?: MicroAppHostUser;
  lang?: string;
  theme?: string;
  brandColor?: MicroAppBrandColors;
  permissionsButton?: PermissionsButton[];
} & Record<string, unknown>;
