import { Divider } from 'antd';

import { Link } from '@tanstack/react-router';
import Logo from '@/assets/asiainfo-logo.png';
import { FullscreenButton, LocaleButton, RemindButton, ThemeToggleButton, UserButton } from '@/layout/component';
import { usePreferenceStore } from '@/store/preference/store';

export function AppHeader() {
  const { locale } = usePreferenceStore();
  const appName = locale === 'en-US' ? import.meta.env.VITE_APP_NAME_EN : import.meta.env.VITE_APP_NAME_ZH;
  return (
    <header className='sticky top-0 z-50 h-15 border-border backdrop-blur-sm'>
      <div className='flex h-full items-center justify-between gap-4 px-4 md:px-6'>
        <div className='flex items-center gap-1.5'>
          <Link
            to='/'
            className='flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground no-underline hover:no-underline'
          >
            <img
              src={Logo}
              alt='logo'
              width={32}
              height={32}
              fetchPriority='high'
              decoding='async'
              className='h-8 w-8'
            />
            <span className='text-base font-semibold tracking-tight text-foreground'>{appName}</span>
          </Link>
        </div>
        <div className='flex items-center gap-1.5'>
          <RemindButton />
          <ThemeToggleButton />
          <LocaleButton />
          <FullscreenButton />
          <Divider orientation='vertical' />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
