import { HeaderIconButton } from './HeaderIconButton';
import { Remind } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

export function RemindButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <HeaderIconButton
      label={t('Header.Remind')}
      icon={<Remind />}
      onClick={() => {
        navigate({ to: '/remind' });
      }}
    />
  );
}
