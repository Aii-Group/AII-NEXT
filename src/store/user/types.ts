export interface PermissionsButton {
  menuId?: number;
  appId?: number;
  appKey?: string;
  menuCode?: string;
  displayName?: string;
  parentId?: number;
  path?: string;
  permissionKcClientId?: string;
  permissionKcRoleName?: string;
  microAppKey?: string;
  orderNum?: number;
}

export interface User {
  userId?: number | string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  token?: string;
  avatar?: string;
  userIdStr?: string;
  locale?: string;
  permissionsButton?: PermissionsButton[];
}
