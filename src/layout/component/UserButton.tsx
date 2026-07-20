import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/store/user/store';
import { Logout } from '@icon-park/react';
import { useAuth } from '@asiainfo/auth';
import { useNavigate } from '@tanstack/react-router';
import { isAuthEnabled } from '@/utils/auth-guard';

export function UserButton() {
  const { t } = useTranslation('common');
  const { user, clearUser } = useUserStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      label: t('Header.Logout'),
      danger: true,
      icon: <Logout />,
      onClick: () => {
        if (isAuthEnabled) {
          void logout();
          return;
        }

        clearUser();
        void navigate({ to: '/login' });
      },
    },
  ];

  return (
    <Dropdown menu={{ items }}>
      <div className='flex items-center gap-1.5'>
        <Avatar
          size='large'
          src='https://api.dicebear.com/10.x/dylan/svg?seed=Felix'
        >
          {user?.userName?.[0]?.toUpperCase() ?? 'Admin'}
        </Avatar>
        <span className='cursor-pointer text-base font-semibold tracking-tight text-foreground'>{user?.userName ?? '-'}</span>
      </div>
    </Dropdown>
  );
}
