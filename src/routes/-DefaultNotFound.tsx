import { useNavigate } from '@tanstack/react-router';
import { Button, Result } from 'antd';
import { useTranslation } from 'react-i18next';
import NotFoundSvg from '@/assets/404.svg';

export function DefaultNotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <Result
      subTitle={t('Status_Page.Not_Found_Description')}
      icon={
        <img
          src={NotFoundSvg}
          alt='404'
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
