import { createFileRoute, notFound } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { findExternalLinkBySlug } from '@/layout/utils';

export const Route = createFileRoute('/_app/_system/iframe/$slug')({
  loader: ({ params }) => {
    const item = findExternalLinkBySlug(params.slug);
    if (!item?.link) {
      throw notFound();
    }

    return {
      link: item.link,
      label: item.label,
    };
  },
  component: IframePage,
});

function IframePage() {
  const { link, label } = Route.useLoaderData();
  const { t } = useTranslation('menu');

  return (
    <iframe
      src={link}
      title={t(label, { ns: 'menu' })}
      className='h-[calc(100dvh-5rem)] w-full border-0 bg-card'
      referrerPolicy='no-referrer'
    />
  );
}
