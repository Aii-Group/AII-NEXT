import { useEffect, useMemo, useState } from 'react';

import { Menu } from 'antd';
import type { MenuProps } from 'antd';

import { useLocation, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { findMenuItemByKey, getMenuAntdItems, getMenuOpenKeys, getMenuSelectedKey, menu } from './utils';

export function AppMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation('menu');
  const menuItems = useMemo(() => getMenuAntdItems(menu, t), [t]);
  const selectedKeys = useMemo(() => getMenuSelectedKey(pathname, menu), [pathname]);
  const [openKeys, setOpenKeys] = useState<string[]>(() => getMenuOpenKeys(pathname, menu));

  useEffect(() => {
    setOpenKeys(getMenuOpenKeys(pathname, menu));
  }, [pathname]);

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    const item = findMenuItemByKey(key, menu);
    if (!item?.path || item.children?.length) return;
    void navigate({ to: item.path });
  };

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Menu
      mode='inline'
      items={menuItems}
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onClick={handleClick}
      onOpenChange={handleOpenChange}
      style={{ borderInlineEnd: 'none', backgroundColor: 'transparent' }}
    />
  );
}
