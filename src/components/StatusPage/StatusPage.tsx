import type { ReactNode } from 'react';
import { Result } from 'antd';

export type StatusPageStatus = 'success' | 'error' | 'info' | 'warning' | 404 | 403 | 500;

type StatusPageProps = {
  status: StatusPageStatus;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function StatusPage({ status, title, description, action }: StatusPageProps) {
  return (
    <div className='flex min-h-[50vh] items-center justify-center'>
      <Result
        status={status}
        title={title}
        subTitle={description}
        extra={action}
      />
    </div>
  );
}
