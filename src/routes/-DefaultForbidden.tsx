import { useNavigate } from '@tanstack/react-router';
import { Button, Result } from 'antd';
import { useTranslation } from 'react-i18next';
import ForbiddenSvg from '@/assets/403.svg';

export function DefaultForbidden() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <Result
      subTitle={t('Status_Page.Forbidden_Description')}
      icon={
        <img
          src={ForbiddenSvg}
          alt='403'
          className='mx-auto w-full max-w-md'
        />
      }
      extra={
        <Button
          type='primary'
          onClick={() => navigate({ to: '/' })}
        >
          {t('Actions.Go_Home')}
        </Button>
      }
    />
  );
}
