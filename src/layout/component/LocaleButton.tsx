import { Translate } from '@icon-park/react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/constants/locale';
import { usePreferenceStore } from '@/store/preference/store';

export function LocaleButton() {
  const { t } = useTranslation();
  const locale = usePreferenceStore((state) => state.locale);
  const setLocale = usePreferenceStore((state) => state.setLocale);

  const items: MenuProps['items'] = SUPPORTED_LOCALES.map((item) => ({
    key: item,
    label: LOCALE_LABELS[item],
  }));

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setLocale(key as Locale);
  };

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [locale],
        onClick: handleMenuClick,
      }}
    >
      <Button
        type='text'
        aria-label={t('Header.Locale')}
        icon={<Translate />}
      />
    </Dropdown>
  );
}
