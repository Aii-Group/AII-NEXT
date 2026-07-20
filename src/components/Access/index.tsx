import type { ReactNode } from 'react';
import { useAccess, type AccessMode } from '@/hooks/use-access';

export interface AccessProps {
  /**
   * 显式布尔权限（与 Ant Design Pro 一致）。
   * 传入时优先于 `code`，便于组合复杂业务条件。
   */
  accessible?: boolean;
  /** 权限码，对应宿主 `PermissionsButton.menuCode` */
  code?: string | readonly string[];
  /** `code` 为数组时：`any` 命中任一，`all` 需全部具备，默认 `all` */
  mode?: AccessMode;
  /** 无权限时渲染的内容，默认不渲染 */
  fallback?: ReactNode;
  children?: ReactNode;
}

/**
 * 按钮级权限包裹组件。
 *
 * @example
 * ```tsx
 * <Access code="user:create">
 *   <Button>新建</Button>
 * </Access>
 *
 * <Access accessible={access.can('user:edit') && !readonly} fallback={null}>
 *   <Button>编辑</Button>
 * </Access>
 * ```
 */
export function Access({ accessible, code, mode = 'all', fallback = null, children }: AccessProps) {
  const { can } = useAccess();

  const allowed = accessible ?? (code != null ? can(code, mode) : true);

  return allowed ? children : fallback;
}
