import type { useAppProps } from 'antd/es/app/context';
import type { DrawerAPI } from '@/types/drawer';

declare global {
  interface Window {
    $message: useAppProps['message'];
    $notification: useAppProps['notification'];
    $modal: useAppProps['modal'];
    $drawer: DrawerAPI;
  }
}

export {};
