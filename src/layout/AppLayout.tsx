import { useCallback, useRef } from 'react';

import { Outlet } from '@tanstack/react-router';
import { isMicroAppEnvironment } from '@/utils/micro';

import { AppMenu } from './AppMenu';
import { AppHeader } from './AppHeader';
import { BackTopButton } from './component/BackTopButton';
import menu from './utils/menu';

export function AppLayout() {
  const contentRef = useRef<HTMLElement>(null);
  const getContentContainer = useCallback(() => contentRef.current ?? document.documentElement, []);

  if (isMicroAppEnvironment()) {
    return (
      <main
        ref={contentRef}
        className='box-border h-[calc(100dvh-5rem)] min-w-0 overflow-y-auto'
      >
        <Outlet />
        <BackTopButton target={getContentContainer} />
      </main>
    );
  }

  if (menu.length === 0) {
    return (
      <div className='grid h-screen grid-rows-[auto_1fr] overflow-hidden'>
        <AppHeader />
        <main
          ref={contentRef}
          className='min-h-0 min-w-0 overflow-y-auto px-4 pb-4'
        >
          <Outlet />
          <BackTopButton target={getContentContainer} />
        </main>
      </div>
    );
  }

  return (
    <div className='grid h-screen grid-rows-[auto_1fr] overflow-hidden'>
      <AppHeader />
      <div className='grid min-h-0 grid-cols-1 md:grid-cols-[240px_1fr]'>
        <aside className='min-h-0 overflow-y-auto'>
          <AppMenu />
        </aside>
        <main
          ref={contentRef}
          className='min-h-0 min-w-0 overflow-y-auto px-4 pb-4'
        >
          <Outlet />
          <BackTopButton target={getContentContainer} />
        </main>
      </div>
    </div>
  );
}
