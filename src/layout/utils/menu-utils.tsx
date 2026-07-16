import type { MenuProps } from 'antd';
import type { TFunction } from 'i18next';
import { MenuIcon } from '../component/MenuIcon';
import menu from './menu';

type AntdMenuItem = NonNullable<MenuProps['items']>[number];

function flattenMenu(items: System.MenuOptions[]): System.MenuOptions[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenMenu(item.children) : [])]);
}

export function findMenuItemByKey(key: string, items: System.MenuOptions[] = menu): System.MenuOptions | undefined {
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children) {
      const found = findMenuItemByKey(key, item.children);
      if (found) return found;
    }
  }
}

/** Resolve an External Link menu item by iframe slug (e.g. `baidu` → `/iframe/baidu`). */
export function findExternalLinkBySlug(slug: string, items: System.MenuOptions[] = menu): System.MenuOptions | undefined {
  const external = items.find((item) => item.key === 'External_Link');
  return external?.children?.find((item) => {
    if (!item.link || !item.path) return false;
    return item.path === `/iframe/${slug}` || item.path.split('/').pop() === slug;
  });
}

export function getMenuSelectedKey(pathname: string, items: System.MenuOptions[] = menu): string[] {
  const matched = flattenMenu(items).filter((item) => item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`)));

  const best = matched.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0];
  return best ? [best.key] : [];
}

export function getMenuOpenKeys(pathname: string, items: System.MenuOptions[] = menu): string[] {
  const keys: string[] = [];

  function walk(nodes: System.MenuOptions[], parents: string[]) {
    for (const item of nodes) {
      if (item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`))) {
        keys.push(...parents);
      }
      if (item.children) {
        walk(item.children, [...parents, item.key]);
      }
    }
  }

  walk(items, []);
  return [...new Set(keys)];
}

export function getMenuAntdItems(items: System.MenuOptions[], t: TFunction): AntdMenuItem[] {
  return items.map((item) => ({
    key: item.key,
    label: t(item.label, { ns: 'menu' }),
    icon: item.icon ? <MenuIcon name={item.icon} /> : undefined,
    children: item.children ? getMenuAntdItems(item.children, t) : undefined,
  }));
}
