import { useUserStore } from '@/store/user/store';
import { hasPermission, isPermissionAclEnabled, type PermissionMatchMode } from '@/utils/permission';

export type AccessMode = 'any' | 'all';

function toMatchMode(mode: AccessMode = 'all'): PermissionMatchMode {
  return mode === 'any' ? 'some' : 'every';
}

/** 订阅当前用户按钮权限，并提供 can / canAny / canAll 判断 */
export function useAccess() {
  const permissions = useUserStore((state) => state.user?.permissionsButton);
  const aclEnabled = isPermissionAclEnabled(permissions);

  return {
    /** 宿主下发的按钮权限列表；未启用 ACL 时为 `undefined` */
    permissions,
    /** 是否已启用按钮 ACL（已下发权限数组） */
    aclEnabled,
    /** 校验权限码；`mode: 'any'` 命中任一，`all`（默认）需全部具备 */
    can: (code: string | readonly string[], mode: AccessMode = 'all') => hasPermission(code, permissions, toMatchMode(mode)),
    /** 具备 codes 中任一权限 */
    canAny: (codes: readonly string[]) => hasPermission(codes, permissions, 'some'),
    /** 具备 codes 中全部权限 */
    canAll: (codes: readonly string[]) => hasPermission(codes, permissions, 'every'),
  };
}
