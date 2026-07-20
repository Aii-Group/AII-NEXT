import type { PermissionsButton } from '@/store/user/types';
import { useUserStore } from '@/store/user/store';

export type PermissionMatchMode = 'every' | 'some';

/** 从 user store 读取当前按钮权限列表 */
export function getPermissionsButton(): PermissionsButton[] | undefined {
  return useUserStore.getState().user?.permissionsButton;
}

/**
 * 是否启用按钮 ACL。
 * 仅当宿主/业务已下发数组（含空数组）时启用；`undefined` 表示未配置，开发与独立模式默认放行。
 */
export function isPermissionAclEnabled(list: PermissionsButton[] | null | undefined = getPermissionsButton()): list is PermissionsButton[] {
  return Array.isArray(list);
}

function collectMenuCodes(list: PermissionsButton[]): Set<string> {
  const codes = new Set<string>();

  for (const item of list) {
    const code = item.menuCode;
    if (typeof code === 'string' && code.length > 0) {
      codes.add(code);
    }
  }

  return codes;
}

/**
 * 判断是否具备指定按钮权限（匹配 `PermissionsButton.menuCode`）。
 *
 * - ACL 未启用时始终返回 `true`
 * - `code` 为空数组时返回 `true`
 * - `mode: 'every'`（默认）要求全部命中；`'some'` 命中任一即可
 */
export function hasPermission(
  code: string | readonly string[],
  list: PermissionsButton[] | null | undefined = getPermissionsButton(),
  mode: PermissionMatchMode = 'every',
): boolean {
  if (!isPermissionAclEnabled(list)) return true;

  const codes = (Array.isArray(code) ? code : [code]).filter((item) => typeof item === 'string' && item.length > 0);
  if (codes.length === 0) return true;

  const granted = collectMenuCodes(list);

  if (mode === 'some') {
    return codes.some((item) => granted.has(item));
  }

  return codes.every((item) => granted.has(item));
}

/** 无 `permission` 或已授权时返回 true，供表格操作等场景统一判断 */
export function isPermissionAllowed(
  permission: string | undefined,
  list: PermissionsButton[] | null | undefined = getPermissionsButton(),
): boolean {
  if (!permission) return true;
  return hasPermission(permission, list);
}
