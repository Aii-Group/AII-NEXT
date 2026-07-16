import { ErrorComponent, type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusPage } from '@/components/StatusPage';
import { isForbiddenError } from '@/utils/forbidden';
import { DefaultForbidden } from './-DefaultForbidden';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const { t } = useTranslation('common');

  if (isForbiddenError(error)) {
    return <DefaultForbidden />;
  }

  return (
    <StatusPage
      status='error'
      description={<ErrorComponent error={error} />}
      action={
        <Button
          type='primary'
          onClick={() => router.invalidate()}
        >
          {t('Actions.Retry')}
        </Button>
      }
    />
  );
}
