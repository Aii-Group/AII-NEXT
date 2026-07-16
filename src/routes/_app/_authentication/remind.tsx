import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LayoutWrapper } from '@/components/Wrapper';

export const Route = createFileRoute('/_app/_authentication/remind')({
  staticData: { hideSidebar: true },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation('common');

  return <LayoutWrapper>{t('Header.Remind')}</LayoutWrapper>;
}
